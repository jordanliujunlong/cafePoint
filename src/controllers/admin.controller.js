const bcrypt = require('bcryptjs');
const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey, daysAgoDate, dateKeyInTz } = require('../utils/date');
const pointsService = require('../services/points.service');

async function overview(req, res) {
  const since = daysAgoDate(7);
  const rows = await prisma.transaction.findMany({
    where: { ts: { gte: since } },
    select: { ts: true, type: true, earnedPoints: true, redeemedPoints: true }
  });

  const key = todayKey();
  const todays = rows.filter((t) => dateKeyInTz(t.ts) === key);
  const todayCheckins = todays.filter((t) => t.type === 'checkin').length;
  const todayIssued = todays.reduce((s, t) => s + (t.earnedPoints || 0), 0);
  const todayRedeemed = todays.reduce((s, t) => s + (t.redeemedPoints || 0), 0);

  const days = [];
  for (let i = 6; i >= 0; i--) days.push(daysAgoDate(i));
  const series = days.map((d) => {
    const dKey = dateKeyInTz(d);
    const dayTx = rows.filter((t) => dateKeyInTz(t.ts) === dKey);
    const issued = dayTx.reduce((s, t) => s + (t.earnedPoints || 0), 0);
    const redeemed = dayTx.reduce((s, t) => s + (t.redeemedPoints || 0), 0);
    const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    return { date: dKey, label: wd, issued, redeemed };
  });

  const memberCount = await prisma.member.count();
  const pointsSum = await prisma.member.aggregate({ _sum: { points: true } });
  const rules = await pointsService.getRules();
  const totalLiability = pointsService.pointsValue(pointsSum._sum.points || 0, rules);

  res.json({ memberCount, todayCheckins, todayIssued, todayRedeemed, totalLiability, series });
}

async function listMembers(req, res) {
  const q = (req.query.q || '').trim();
  const where = q
    ? { OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }
    : {};
  const members = await prisma.member.findMany({ where, orderBy: { joinedAt: 'desc' }, take: 200 });
  res.json(members);
}

async function getRules(req, res) {
  const rules = await pointsService.getRules();
  res.json(rules);
}

async function putRules(req, res) {
  const rules = await pointsService.updateRules(req.body || {});
  res.json(rules);
}

async function ledger(req, res) {
  const filter = req.query.type; // 'checkin' | 'purchase' | undefined
  const where = filter ? { type: filter } : {};
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { ts: 'desc' },
    take: 200,
    include: { member: { select: { displayName: true } }, staffUser: { select: { name: true } } }
  });
  res.json(
    rows.map((t) => ({
      id: t.id,
      ts: t.ts,
      type: t.type,
      memberName: t.member ? t.member.displayName : '—',
      orderAmount: t.orderAmount,
      paidAmount: t.paidAmount,
      redeemedPoints: t.redeemedPoints,
      earnedPoints: t.earnedPoints,
      note: t.note,
      staffName: t.staffUser ? t.staffUser.name : null
    }))
  );
}

// ---- 店员 / 管理员帐号管理（仅限 admin）----

async function listStaff(req, res) {
  const staff = await prisma.staffUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  });
  res.json(staff);
}

async function createStaff(req, res) {
  const { username, password, name, role } = req.body || {};
  if (!username || !password || !name || !['staff', 'admin'].includes(role)) {
    throw new HttpError(400, 'アカウント・パスワード・氏名をすべて入力し、権限（staff または admin）を選択してください');
  }
  if (password.length < 6) throw new HttpError(400, 'パスワードは6文字以上で入力してください');
  const existing = await prisma.staffUser.findUnique({ where: { username } });
  if (existing) throw new HttpError(409, 'このアカウントはすでに登録されています');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.staffUser.create({ data: { username, passwordHash, name, role } });
  res.status(201).json({ id: user.id, username: user.username, name: user.name, role: user.role });
}

async function deleteStaff(req, res) {
  const { id } = req.params;
  if (id === req.staff.id) throw new HttpError(400, '現在ログイン中のアカウントは削除できません');
  await prisma.staffUser.delete({ where: { id } }).catch(() => {
    throw new HttpError(404, 'アカウントが見つかりません');
  });
  res.json({ ok: true });
}

module.exports = {
  overview,
  listMembers,
  getRules,
  putRules,
  ledger,
  listStaff,
  createStaff,
  deleteStaff
};
