const prisma = require('../db');

// 积分规则永远只有一行，读不到就用 schema 预设值补一份。
async function getRules() {
  const rule = await prisma.rule.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' }
  });
  return rule;
}

async function updateRules(patch) {
  const allowed = ['earnRate', 'checkinPoints', 'streak5Bonus', 'streak10Bonus', 'redeemRate', 'maxRedeemPercent', 'inviterBonus', 'inviteeBonus'];
  const data = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      const n = Number(patch[key]);
      if (!Number.isFinite(n) || n < 0) continue;
      data[key] = Math.round(n);
    }
  }
  return prisma.rule.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data }
  });
}

function earnFromAmount(amount, rules) {
  const rate = rules.earnRate || 10;
  return Math.floor(Math.max(0, amount) / rate);
}

function pointsValue(points, rules) {
  const rate = rules.redeemRate || 10;
  return points / rate;
}

function maxUsablePoints(orderAmount, memberPoints, rules) {
  const byOrder = Math.floor((orderAmount * (rules.maxRedeemPercent || 0)) / 100 * (rules.redeemRate || 10));
  return Math.max(0, Math.min(memberPoints, byOrder));
}

module.exports = { getRules, updateRules, earnFromAmount, pointsValue, maxUsablePoints };
