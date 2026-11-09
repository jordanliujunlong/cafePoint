const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey, daysAgoDate, dateKeyInTz } = require('../utils/date');
const pointsService = require('../services/points.service');
const jwtUtil = require('../utils/jwt');
const inviteService = require('../services/invite.service');
const stampService = require('../services/stamp.service');
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
      points: m.points,
      stamps: m.stamps,
      freeTickets: m.freeTickets
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
      points: member.points,
      stamps: member.stamps,
      freeTickets: member.freeTickets
    }
  });
}

async function checkout(req, res) {
  const { memberId, orderAmount, redeemPoints, useFreeTicket } = req.body || {};
  const amount = Number(orderAmount);
  if (!memberId || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, '会員を選択し、正しいご利用金額を入力してください');
  }
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new HttpError(404, '会員が見つかりません');

  const useTicket = !!useFreeTicket;
  if (useTicket && member.freeTickets < 1) throw new HttpError(400, 'この会員は無料券を持っていません');

  const rules = await pointsService.getRules();
  // 无料券：这笔全额免费，不能同时折抵积分，也不盖章
  const maxUse = useTicket ? 0 : pointsService.maxUsablePoints(amount, member.points, rules);
  const useRedeem = Math.max(0, Math.min(Number(redeemPoints) || 0, maxUse));
  const discount = useTicket ? amount : useRedeem / rules.redeemRate;
  const paidAmount = Math.max(0, amount - discount);
  const stampsAdded = useTicket ? 0 : 1;
  const next = stampService.addStamps(member.stamps, stampsAdded);

  // 扣积分 / 盖章 / 记账 / 产生邀请码要一起成功，或一起失败。
  const { updatedMember, tx, invite } = await prisma.$transaction(async (db) => {
    // 以读到的印章 / 免费券 / 积分为条件更新：同一位会员同时结两笔帐时，只有一笔会成功，不会多发或多扣。
    const r = await db.member.updateMany({
      where: { id: member.id, stamps: member.stamps, freeTickets: member.freeTickets, points: member.points },
      data: {
        points: member.points - useRedeem + next.rewardPoints,
        totalSpent: { increment: paidAmount },
        stamps: next.stamps,
        freeTickets: member.freeTickets - (useTicket ? 1 : 0)
      }
    });
    if (r.count === 0) throw new HttpError(409, '会員情報が更新されたため、会計を確定できませんでした。もう一度お試しください');
    const updatedMember = await db.member.findUnique({ where: { id: member.id } });
    const tx = await db.transaction.create({
      data: {
        memberId: member.id,
        type: 'purchase',
        orderAmount: amount,
        discount,
        redeemedPoints: useRedeem,
        paidAmount,
        earnedPoints: 0,
        stampsAdded,
        freeTicketUsed: useTicket,
        note: (req.body && req.body.note) || (useTicket ? '無料券でご利用' : ''),
        staffUserId: req.staff.id
      }
    });
    // 集满印章：送积分，另记一笔奖励
    if (next.rewardPoints > 0) {
      await db.transaction.create({
        data: {
          memberId: member.id,
          type: 'bonus',
          earnedPoints: next.rewardPoints,
          note: `スタンプ${stampService.STAMP_GOAL}個達成ボーナス`
        }
      });
    }
    // 每次消费，给这位顾客一组一次性邀请码
    const invite = await inviteService.issueInviteCode(db, member.id, tx.id);
    return { updatedMember, tx, invite };
  });

  res.json({
    member: {
      id: updatedMember.id,
      displayName: updatedMember.displayName,
      points: updatedMember.points,
      stamps: updatedMember.stamps,
      freeTickets: updatedMember.freeTickets
    },
    transaction: {
      id: tx.id,
      orderAmount: amount,
      discount,
      redeemedPoints: useRedeem,
      paidAmount,
      stampsAdded,
      freeTicketUsed: useTicket,
      stampRewardPoints: next.rewardPoints
    },
    stampGoal: stampService.STAMP_GOAL,
    stampReward: stampService.STAMP_REWARD_POINTS,
    inviteCode: inviteService.formatCode(invite.code),
    inviteShareUrl: config.customerUrl(`invite=${invite.code}`),
    inviterBonus: rules.inviterBonus,
    inviteeBonus: rules.inviteeBonus,
    redeemRate: rules.redeemRate
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
      redeemedPoints: t.redeemedPoints,
      stampsAdded: t.stampsAdded,
      freeTicketUsed: t.freeTicketUsed
    }))
  });
}

module.exports = { listMembers, scan, checkout, todayLog };
