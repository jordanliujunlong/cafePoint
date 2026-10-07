const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey } = require('../utils/date');
const pointsService = require('../services/points.service');
const codeService = require('../services/code.service');

async function summary(req, res) {
  const member = await prisma.member.findUnique({ where: { id: req.member.id } });
  if (!member) throw new HttpError(404, '找不到会员资料');
  const rules = await pointsService.getRules();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthTx = await prisma.transaction.findMany({
    where: { memberId: member.id, ts: { gte: monthStart } },
    select: { earnedPoints: true }
  });
  const monthEarned = monthTx.reduce((s, t) => s + (t.earnedPoints || 0), 0);

  res.json({
    id: member.id,
    displayName: member.displayName,
    pictureUrl: member.pictureUrl,
    points: member.points,
    totalSpent: member.totalSpent,
    pointsValue: pointsService.pointsValue(member.points, rules),
    checkedInToday: member.lastCheckinDate === todayKey(),
    monthEarned,
    rules: { checkinPoints: rules.checkinPoints }
  });
}

async function transactions(req, res) {
  const list = await prisma.transaction.findMany({
    where: { memberId: req.member.id },
    orderBy: { ts: 'desc' },
    take: 200,
    include: { staffUser: { select: { name: true } } }
  });
  res.json(
    list.map((t) => ({
      id: t.id,
      type: t.type,
      ts: t.ts,
      orderAmount: t.orderAmount,
      discount: t.discount,
      redeemedPoints: t.redeemedPoints,
      paidAmount: t.paidAmount,
      earnedPoints: t.earnedPoints,
      note: t.note,
      staffName: t.staffUser ? t.staffUser.name : null
    }))
  );
}

async function checkin(req, res) {
  const { code } = req.body || {};
  if (!code || String(code).trim().length !== 6) {
    throw new HttpError(400, '请输入完整的 6 位数字');
  }
  const member = await prisma.member.findUnique({ where: { id: req.member.id } });
  if (!member) throw new HttpError(404, '找不到会员资料');

  if (member.lastCheckinDate === todayKey()) {
    throw new HttpError(409, '今日已经签到过囉，明天再来吧！');
  }

  const valid = await codeService.verifyCode(code);
  if (!valid) {
    throw new HttpError(400, '签到码不正确，请再次向店员确认');
  }

  const rules = await pointsService.getRules();

  const [updated] = await prisma.$transaction([
    prisma.member.update({
      where: { id: member.id },
      data: { points: { increment: rules.checkinPoints }, lastCheckinDate: todayKey() }
    }),
    prisma.transaction.create({
      data: {
        memberId: member.id,
        type: 'checkin',
        earnedPoints: rules.checkinPoints,
        note: '到店签到'
      }
    })
  ]);

  res.json({ ok: true, pointsEarned: rules.checkinPoints, points: updated.points });
}

module.exports = { summary, transactions, checkin };
