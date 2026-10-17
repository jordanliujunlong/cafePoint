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

  let member = await prisma.member.findUnique({ where: { lineUserId: profile.userId } });
  let isNew = false;
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
      isNew = true;
    } catch (e) {
      // 极少见：同一个人同时按了两次登入，另一个请求已经建立了会员
      member = await prisma.member.findUnique({ where: { lineUserId: profile.userId } });
      if (!member) throw e;
    }
  }

  // 邀请码：只有「第一次加入」的新会员才能使用；已经是会员的人带码登入，不会消耗这组码。
  let inviteResult = '';
  let inviteBonus = 0;
  if (inviteCookie) {
    if (!isNew) {
      inviteResult = 'existing';
    } else {
      const rules = await pointsService.getRules();
      const r = await prisma.$transaction((tx) => inviteService.redeemInvite(tx, inviteCookie, member, rules));
      inviteResult = r.ok ? 'ok' : r.reason;
      inviteBonus = r.ok ? r.inviteeBonus : 0;
    }
  }

  const token = jwt.sign({ sub: member.id, type: 'member' }, '30d');
  res.cookie('member_jwt', token, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
  if (inviteResult) {
    return res.redirect(`/?invite_result=${inviteResult}&invite_bonus=${inviteBonus}`);
  }
  res.redirect('/');
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
  lineLoginStart,
  lineLoginCallback,
  memberLogout,
  staffLogin,
  staffLogout,
  staffChangePassword,
  me
};
