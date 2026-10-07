const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey, daysAgoDate, dateKeyInTz } = require('../utils/date');
const pointsService = require('../services/points.service');
const codeService = require('../services/code.service');

async function getCode(req, res) {
  const active = await codeService.getActiveCode();
  const todayCheckins = await countTodayCheckins();
  res.json({ code: active.code, secondsRemaining: active.secondsRemaining, todayCheckins });
}

async function regenerateCode(req, res) {
  const row = await codeService.regenerateCode();
  const rules = await pointsService.getRules();
  res.json({ code: row.code, secondsRemaining: rules.codeTTL });
}

async function countTodayCheckins() {
  const since = daysAgoDate(1);
  const recent = await prisma.transaction.findMany({
    where: { type: 'checkin', ts: { gte: since } },
    select: { ts: true }
  });
  const key = todayKey();
  return recent.filter((t) => dateKeyInTz(t.ts) === key).length;
}

async function listMembers(req, res) {
  const q = (req.query.q || '').trim();
  const where = q
    ? { OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }
    : {};
  const members = await prisma.member.findMany({
    where,
    orderBy: { joinedAt: 'desc' },
    take: 50
  });
  res.json(
    members.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      pictureUrl: m.pictureUrl,
      phone: m.phone,
      points: m.points
    }))
  );
}

async function checkout(req, res) {
  const { memberId, orderAmount, redeemPoints } = req.body || {};
  const amount = Number(orderAmount);
  if (!memberId || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, '请选择会员并输入有效的订单金额');
  }
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new HttpError(404, '找不到这位会员');

  const rules = await pointsService.getRules();
  const maxUse = pointsService.maxUsablePoints(amount, member.points, rules);
  const useRedeem = Math.max(0, Math.min(Number(redeemPoints) || 0, maxUse));
  const discount = useRedeem / rules.redeemRate;
  const paidAmount = Math.max(0, amount - discount);
  const earnedPoints = pointsService.earnFromAmount(paidAmount, rules);

  const [updatedMember, tx] = await prisma.$transaction([
    prisma.member.update({
      where: { id: member.id },
      data: {
        points: { increment: earnedPoints - useRedeem },
        totalSpent: { increment: paidAmount }
      }
    }),
    prisma.transaction.create({
      data: {
        memberId: member.id,
        type: 'purchase',
        orderAmount: amount,
        discount,
        redeemedPoints: useRedeem,
        paidAmount,
        earnedPoints,
        note: (req.body && req.body.note) || '',
        staffUserId: req.staff.id
      }
    })
  ]);

  res.json({
    member: { id: updatedMember.id, displayName: updatedMember.displayName, points: updatedMember.points },
    transaction: {
      id: tx.id,
      orderAmount: amount,
      discount,
      redeemedPoints: useRedeem,
      paidAmount,
      earnedPoints
    }
  });
}

async function todayLog(req, res) {
  const since = daysAgoDate(1);
  const rows = await prisma.transaction.findMany({
    where: { ts: { gte: since } },
    orderBy: { ts: 'desc' },
    include: { member: { select: { displayName: true } } }
  });
  const key = todayKey();
  const todays = rows.filter((t) => dateKeyInTz(t.ts) === key);

  const revenue = todays.reduce((s, t) => s + (t.paidAmount || 0), 0);
  const issued = todays.reduce((s, t) => s + (t.earnedPoints || 0), 0);
  const redeemed = todays.reduce((s, t) => s + (t.redeemedPoints || 0), 0);

  res.json({
    revenue,
    issued,
    redeemed,
    transactions: todays.map((t) => ({
      id: t.id,
      ts: t.ts,
      type: t.type,
      memberName: t.member ? t.member.displayName : '—',
      paidAmount: t.paidAmount,
      earnedPoints: t.earnedPoints,
      redeemedPoints: t.redeemedPoints
    }))
  });
}

module.exports = { getCode, regenerateCode, listMembers, checkout, todayLog };
