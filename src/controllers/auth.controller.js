const bcrypt = require('bcryptjs');
const prisma = require('../db');
const config = require('../config');
const jwt = require('../utils/jwt');
const HttpError = require('../utils/HttpError');
const lineService = require('../services/line.service');
const inviteService = require('../services/invite.service');
const pointsService = require('../services/points.service');

const cookieBase = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  path: '/'
};

// ---------- LINE Login（顾客端）----------

function lineLoginStart(req, res) {
  if (!config.line.channelId || !config.line.channelSecret) {
    throw new HttpError(
      500,
      'LINE_CHANNEL_ID / LINE_CHANNEL_SECRET が未設定です。README を参照して LINEログイン を設定してください。'
    );
  }
  const state = lineService.buildState();
  res.cookie('line_oauth_state', state, { ...cookieBase, maxAge: 10 * 60 * 1000 });
  // 登入页带来的邀请码（选填）：先记在 cookie 里，等 LINE 登入完成回到 callback 再处理。
  const invite = inviteService.normalizeCode(req.query.invite);
  if (invite) res.cookie('invite_code', invite, { ...cookieBase, maxAge: 30 * 60 * 1000 });
  else res.clearCookie('invite_code', { path: '/' });
  res.redirect(lineService.buildAuthorizeUrl(state));
}

async function lineLoginCallback(req, res) {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.redirect(`/?login_error=${encodeURIComponent(errorDescription || error)}`);
  }

  const savedState = req.cookies && req.cookies.line_oauth_state;
  res.clearCookie('line_oauth_state', { path: '/' });
  if (!code || !state || !savedState || state !== savedState) {
    return res.redirect('/?login_error=' + encodeURIComponent('ログインの認証に失敗しました。もう一度お試しください'));
  }

  const tokenResp = await lineService.exchangeCodeForToken(code);
  const profile = await lineService.fetchProfile(tokenResp.access_token);

  const inviteCookie = req.cookies && req.cookies.invite_code;
  res.clearCookie('invite_code', { path: '/' });

  const { member, inviteResult, inviteBonus } = await signInLineUser(profile, inviteCookie);
  setMemberCookie(res, member);
  if (inviteResult) {
    return res.redirect(`/?invite_result=${inviteResult}&invite_bonus=${inviteBonus}`);
  }
  res.redirect('/');
}

/**
 * LINE 的使用者（userId / 名称 / 头像）-> 找出或建立会员，并处理带来的邀请码。
 * 一般 LINE Login 与 LIFF 登入共用。
 */
async function signInLineUser(profile, rawInvite) {
  let member = await prisma.member.findUnique({ where: { lineUserId: profile.userId } });
  if (member) {
    member = await prisma.member.update({
      where: { id: member.id },
      data: { displayName: profile.displayName, pictureUrl: profile.pictureUrl || null }
    });
  } else {
    try {
      member = await prisma.$transaction(async (tx) => {
        const created = await tx.member.create({
          data: {
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl || null,
            points: 20 // 新会员礼
          }
        });
        await tx.transaction.create({
          data: { memberId: created.id, type: 'bonus', earnedPoints: 20, note: '新規入会ボーナス' }
        });
        return created;
      });
    } catch (e) {
      // 极少见：同一个人同时按了两次登入，另一个请求已经建立了会员
      member = await prisma.member.findUnique({ where: { lineUserId: profile.userId } });
      if (!member) throw e;
    }
  }

  // 邀请码：新会员、老会员都可以用（每人一生只能用一次，不能用自己的码）。
  let inviteResult = '';
  let inviteBonus = 0;
  if (rawInvite) {
    const rules = await pointsService.getRules();
    let r;
    try {
      r = await prisma.$transaction((tx) => inviteService.redeemInvite(tx, rawInvite, member, rules));
    } catch (e) {
      if (e && e.code === 'P2002') r = { ok: false, reason: 'already' }; // 同时送出两组码
      else throw e;
    }
    inviteResult = r.ok ? 'ok' : r.reason;
    inviteBonus = r.ok ? r.inviteeBonus : 0;
  }
  return { member, inviteResult, inviteBonus };
}

function setMemberCookie(res, member) {
  const token = jwt.sign({ sub: member.id, type: 'member' }, '30d');
  res.cookie('member_jwt', token, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

// ---------- LIFF 登入（在 LINE App 里开启时自动登入，不会出现授权画面）----------
// 前端用 liff.getIDToken() 拿到 ID token 送过来，这里向 LINE 验证后登入。
async function liffLogin(req, res) {
  const { idToken, invite } = req.body || {};
  if (!idToken) throw new HttpError(400, 'LINEの認証情報がありません。もう一度お試しください');
  let profile;
  try {
    profile = await lineService.verifyIdToken(idToken);
  } catch (e) {
    // LINE 側の理由（期限切れ / チャネル不一致など）を Railway のログに残す
    console.warn('[liff] ' + e.message);
    const msg = e.message || '';
    if (/expired/i.test(msg)) {
      throw new HttpError(401, 'ログインの有効期限が切れました。もう一度ログインしてください', { reason: 'expired' });
    }
    if (/audience|channel|client_id/i.test(msg)) {
      throw new HttpError(
        401,
        'LINEの設定に誤りがあります（LIFFアプリのチャネルとサーバーの LINE_CHANNEL_ID が一致しません）。お店にお知らせください',
        { reason: 'config' }
      );
    }
    throw new HttpError(401, 'LINEの認証に失敗しました。LINEアプリを開き直してもう一度お試しください', { reason: 'invalid' });
  }
  const { member, inviteResult, inviteBonus } = await signInLineUser(profile, invite);
  setMemberCookie(res, member);
  res.json({ ok: true, inviteResult, inviteBonus });
}

// 登入页输入邀请码后，先问一下这组码能不能用（不会透露是谁的码）。
async function inviteCheck(req, res) {
  const status = await inviteService.checkInvite(prisma, req.query.code);
  const rules = await pointsService.getRules();
  res.json({ status, inviteeBonus: status === 'ok' ? rules.inviteeBonus : 0 });
}

function memberLogout(req, res) {
  res.clearCookie('member_jwt', { path: '/' });
  res.json({ ok: true });
}

// ---------- 店员 / 管理员帐密登入 ----------

async function staffLogin(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    throw new HttpError(400, 'アカウントとパスワードを入力してください');
  }
  const user = await prisma.staffUser.findUnique({ where: { username } });
  if (!user) throw new HttpError(401, 'アカウントまたはパスワードが正しくありません');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'アカウントまたはパスワードが正しくありません');

  const token = jwt.sign({ sub: user.id, type: 'staff', role: user.role, name: user.name }, '12h');
  res.cookie('staff_jwt', token, { ...cookieBase, maxAge: 12 * 60 * 60 * 1000 });
  res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
}

function staffLogout(req, res) {
  res.clearCookie('staff_jwt', { path: '/' });
  res.json({ ok: true });
}

async function staffChangePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new HttpError(400, '現在のパスワードを入力してください。新しいパスワードは6文字以上で入力してください');
  }
  const user = await prisma.staffUser.findUnique({ where: { id: req.staff.id } });
  if (!user) throw new HttpError(404, 'アカウントが見つかりません');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new HttpError(401, '現在のパスワードが正しくありません');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.staffUser.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
}

// ---------- 共用：目前登入状态 ----------

async function me(req, res) {
  let member = null;
  let staff = null;

  if (req.member) {
    const m = await prisma.member.findUnique({ where: { id: req.member.id } });
    if (m) {
      member = {
        id: m.id,
        displayName: m.displayName,
        pictureUrl: m.pictureUrl,
        points: m.points,
        totalSpent: m.totalSpent,
        lastCheckinDate: m.lastCheckinDate,
        joinedAt: m.joinedAt
      };
    }
  }
  if (req.staff) {
    staff = { id: req.staff.id, name: req.staff.name, role: req.staff.role };
  }
  res.json({ member, staff });
}

module.exports = {
  inviteCheck,
  liffLogin,
  lineLoginStart,
  lineLoginCallback,
  memberLogout,
  staffLogin,
  staffLogout,
  staffChangePassword,
  me
};
