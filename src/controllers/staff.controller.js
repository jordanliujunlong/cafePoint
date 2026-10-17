const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey, daysAgoDate, dateKeyInTz } = require('../utils/date');
const pointsService = require('../services/points.service');
const jwtUtil = require('../utils/jwt');
const inviteService = require('../services/invite.service');
const config = require('../config');

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

// 店员扫描会员二维码（相机、扫码枪或手动贴上内容都走这支）。
async function scan(req, res) {
  const memberId = jwtUtil.verifyMemberQr(req.body && req.body.code);
  if (!memberId) {
    throw new HttpError(400, 'QRコードが無効か、有効期限が切れています。お客様に「会員コード」画面を開き直してもらい、もう一度読み取ってください');
  }
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new HttpError(404, '会員が見つかりません');
  res.json({
    member: {
      id: member.id,
      displayName: member.displayName,
      pictureUrl: member.pictureUrl,
      phone: member.phone,
      points: member.points
    }
  });
}

async function checkout(req, res) {
  const { memberId, orderAmount, redeemPoints } = req.body || {};
  const amount = Number(orderAmount);
  if (!memberId || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, '会員を選択し、正しいご利用金額を入力してください');
  }
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new HttpError(404, '会員が見つかりません');

  const rules = await pointsService.getRules();
  const maxUse = pointsService.maxUsablePoints(amount, member.points, rules);
  const useRedeem = Math.max(0, Math.min(Number(redeemPoints) || 0, maxUse));
  const discount = useRedeem / rules.redeemRate;
  const paidAmount = Math.max(0, amount - discount);
  const earnedPoints = pointsService.earnFromAmount(paidAmount, rules);

  // 扣积分 / 记账 / 产生邀请码要一起成功，或一起失败。
  const { updatedMember, tx, invite } = await prisma.$transaction(async (db) => {
    const updatedMember = await db.member.update({
      where: { id: member.id },
      data: {
        points: { increment: earnedPoints - useRedeem },
        totalSpent: { increment: paidAmount }
      }
    });
    const tx = await db.transaction.create({
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
    });
    // 每次消费，给这位顾客一组一次性邀请码
    const invite = await inviteService.issueInviteCode(db, member.id, tx.id);
    return { updatedMember, tx, invite };
  });

  res.json({
    member: { id: updatedMember.id, displayName: updatedMember.displayName, points: updatedMember.points },
    transaction: {
      id: tx.id,
      orderAmount: amount,
      discount,
      redeemedPoints: useRedeem,
      paidAmount,
      earnedPoints
    },
    inviteCode: inviteService.formatCode(invite.code),
    inviteShareUrl: `${config.appBaseUrl}/?invite=${invite.code}`
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

module.exports = { listMembers, scan, checkout, todayLog };
