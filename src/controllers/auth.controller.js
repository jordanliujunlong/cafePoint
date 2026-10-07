const bcrypt = require('bcryptjs');
const prisma = require('../db');
const config = require('../config');
const jwt = require('../utils/jwt');
const HttpError = require('../utils/HttpError');
const lineService = require('../services/line.service');

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
      '尚未设定 LINE_CHANNEL_ID / LINE_CHANNEL_SECRET，请参考 README 完成 LINE Login 设定。'
    );
  }
  const state = lineService.buildState();
  res.cookie('line_oauth_state', state, { ...cookieBase, maxAge: 10 * 60 * 1000 });
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
    return res.redirect('/?login_error=' + encodeURIComponent('登入验证失败，请重新试一次'));
  }

  const tokenResp = await lineService.exchangeCodeForToken(code);
  const profile = await lineService.fetchProfile(tokenResp.access_token);

  const member = await prisma.member.upsert({
    where: { lineUserId: profile.userId },
    update: {
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null
    },
    create: {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null,
      points: 20 // 新会员礼
    }
  });

  // 新建立的会员，补一笔「新会员礼」纪录
  const existingBonus = await prisma.transaction.findFirst({
    where: { memberId: member.id, type: 'bonus' }
  });
  if (!existingBonus) {
    await prisma.transaction.create({
      data: { memberId: member.id, type: 'bonus', earnedPoints: 20, note: '新会员礼' }
    });
  }

  const token = jwt.sign({ sub: member.id, type: 'member' }, '30d');
  res.cookie('member_jwt', token, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.redirect('/');
}

function memberLogout(req, res) {
  res.clearCookie('member_jwt', { path: '/' });
  res.json({ ok: true });
}

// ---------- 店员 / 管理员帐密登入 ----------

async function staffLogin(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    throw new HttpError(400, '请输入帐号与密码');
  }
  const user = await prisma.staffUser.findUnique({ where: { username } });
  if (!user) throw new HttpError(401, '帐号或密码错误');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, '帐号或密码错误');

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
    throw new HttpError(400, '请输入目前密码，新密码至少需要 6 个字符');
  }
  const user = await prisma.staffUser.findUnique({ where: { id: req.staff.id } });
  if (!user) throw new HttpError(404, '找不到帐号');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new HttpError(401, '目前密码不正确');
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
  lineLoginStart,
  lineLoginCallback,
  memberLogout,
  staffLogin,
  staffLogout,
  staffChangePassword,
  me
};
