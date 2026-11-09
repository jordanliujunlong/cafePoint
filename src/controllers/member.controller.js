const prisma = require('../db');
const HttpError = require('../utils/HttpError');
const { todayKey } = require('../utils/date');
const pointsService = require('../services/points.service');
const checkinService = require('../services/checkin.service');
const jwtUtil = require('../utils/jwt');
const config = require('../config');
const inviteService = require('../services/invite.service');
const stampService = require('../services/stamp.service');

async function summary(req, res) {
  const member = await prisma.member.findUnique({ where: { id: req.member.id } });
  if (!member) throw new HttpError(404, '会員情報が見つかりません');
  const rules = await pointsService.getRules();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthTx = await prisma.transaction.findMany({
    where: { memberId: member.id, ts: { gte: monthStart } },
    select: { earnedPoints: true }
  });
  const monthEarned = monthTx.reduce((s, t) => s + (t.earnedPoints || 0), 0);

  const unusedInvites = await prisma.inviteCode.count({ where: { inviterId: member.id, usedById: null } });
  const today = todayKey();
  const streak = checkinService.effectiveStreak(member.lastCheckinDate, member.checkinStreak, today);

  res.json({
    id: member.id,
    displayName: member.displayName,
    pictureUrl: member.pictureUrl,
    points: member.points,
    totalSpent: member.totalSpent,
    pointsValue: pointsService.pointsValue(member.points, rules),
    stamps: member.stamps,
    freeTickets: member.freeTickets,
    stampGoal: stampService.STAMP_GOAL,
    stampReward: stampService.STAMP_REWARD_POINTS,
    checkedInToday: member.lastCheckinDate === today,
    streak,
    cycleDays: checkinService.CYCLE_DAYS,
    nextMilestone: checkinService.nextMilestone(streak, rules),
    monthEarned,
    unusedInvites,
    rules: {
      checkinPoints: rules.checkinPoints,
      streak5Bonus: rules.streak5Bonus,
      streak10Bonus: rules.streak10Bonus,
      inviterBonus: rules.inviterBonus,
      inviteeBonus: rules.inviteeBonus,
      redeemRate: rules.redeemRate
    }
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
      stampsAdded: t.stampsAdded,
      freeTicketUsed: t.freeTicketUsed,
      note: t.note,
      staffName: t.staffUser ? t.staffUser.name : null
    }))
  );
}

async function checkin(req, res) {
  const member = await prisma.member.findUnique({ where: { id: req.member.id } });
  if (!member) throw new HttpError(404, '会員情報が見つかりません');

  const today = todayKey();
  if (member.lastCheckinDate === today) {
    throw new HttpError(409, '本日はすでにチェックイン済みです。また明日お越しください！');
  }

  const rules = await pointsService.getRules();
  const streak = checkinService.nextStreak(member.lastCheckinDate, member.checkinStreak, today);
  const bonus = checkinService.bonusForStreak(streak, rules);
  const base = rules.checkinPoints;
  const total = base + (bonus ? bonus.points : 0);

  // 用「上次签到日期没有变」当条件更新：就算同一人同时连点两次，也只会有一次成功。
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.member.updateMany({
      where: { id: member.id, lastCheckinDate: member.lastCheckinDate },
      data: { points: { increment: total }, lastCheckinDate: today, checkinStreak: streak }
    });
    if (r.count === 0) return null;

    await tx.transaction.create({
      data: {
        memberId: member.id,
        type: 'checkin',
        earnedPoints: base,
        note: `毎日チェックイン（連続${streak}日目）`
      }
    });
    if (bonus) {
      await tx.transaction.create({
        data: {
          memberId: member.id,
          type: 'bonus',
          earnedPoints: bonus.points,
          note: `連続チェックイン${bonus.day}日ボーナス`
        }
      });
    }
    return tx.member.findUnique({ where: { id: member.id } });
  });

  if (!updated) throw new HttpError(409, '本日はすでにチェックイン済みです。また明日お越しください！');

  res.json({
    ok: true,
    basePoints: base,
    bonusPoints: bonus ? bonus.points : 0,
    bonusDay: bonus ? bonus.day : null,
    pointsEarned: total,
    streak,
    cycleDays: checkinService.CYCLE_DAYS,
    nextMilestone: checkinService.nextMilestone(
      streak >= checkinService.CYCLE_DAYS ? 0 : streak,
      rules
    ),
    points: updated.points
  });
}

// 会员二维码：每次呼叫都会签出一组新的、90 秒内有效的内容，前端每 60 秒重新拿一次。
async function qr(req, res) {
  const member = await prisma.member.findUnique({
    where: { id: req.member.id },
    select: { id: true, displayName: true, points: true }
  });
  if (!member) throw new HttpError(404, '会員情報が見つかりません');
  res.set('Cache-Control', 'no-store');
  res.json({
    code: jwtUtil.signMemberQr(member.id),
    expiresIn: jwtUtil.QR_TTL_SEC,
    refreshIn: 60,
    displayName: member.displayName,
    points: member.points
  });
}

// 我的邀请码：每次消费收银员会给一组，一组只能被一位其他会员使用一次。
async function invites(req, res) {
  const rows = await prisma.inviteCode.findMany({
    where: { inviterId: req.member.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { usedBy: { select: { displayName: true } } }
  });
  const rules = await pointsService.getRules();
  const usedInvite = await prisma.inviteCode.findUnique({ where: { usedById: req.member.id }, select: { id: true } });
  res.json({
    canRedeem: !usedInvite, // 自己还没用过别人的邀请码
    inviterBonus: rules.inviterBonus,
    inviteeBonus: rules.inviteeBonus,
    redeemRate: rules.redeemRate,
    codes: rows.map((r) => ({
      code: inviteService.formatCode(r.code),
      shareUrl: config.customerUrl(`invite=${r.code}`),
      createdAt: r.createdAt,
      used: !!r.usedById,
      usedAt: r.usedAt,
      usedByName: r.usedBy ? r.usedBy.displayName : null
    }))
  });
}

const REDEEM_ERRORS = {
  invalid: '招待コードが見つかりません。もう一度ご確認ください',
  used: 'この招待コードはすでに使用されています',
  self: 'ご自身の招待コードは使用できません',
  already: '招待コードはお一人様1回までです。すでにご利用済みです'
};

// 已登入的会员（新、老都可以）输入朋友的邀请码。
async function redeemInvite(req, res) {
  const member = await prisma.member.findUnique({ where: { id: req.member.id } });
  if (!member) throw new HttpError(404, '会員情報が見つかりません');
  const rules = await pointsService.getRules();
  let r;
  try {
    r = await prisma.$transaction((tx) => inviteService.redeemInvite(tx, req.body && req.body.code, member, rules));
  } catch (e) {
    // usedById 唯一约束：同一人同时送出两组码时，只有一组会成功
    if (e && e.code === 'P2002') r = { ok: false, reason: 'already' };
    else throw e;
  }
  if (!r.ok) throw new HttpError(400, REDEEM_ERRORS[r.reason] || REDEEM_ERRORS.invalid);
  const updated = await prisma.member.findUnique({ where: { id: member.id }, select: { points: true } });
  res.json({ ok: true, inviteeBonus: r.inviteeBonus, points: updated.points });
}

module.exports = { summary, transactions, checkin, qr, invites, redeemInvite };
