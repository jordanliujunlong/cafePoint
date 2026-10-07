const crypto = require('crypto');
const prisma = require('../db');
const { getRules } = require('./points.service');

function randomCode() {
  // 6 位数字签到码，crypto.randomInt 避免用 Math.random 这种可预测性较高的来源。
  return String(crypto.randomInt(100000, 1000000));
}

async function getActiveCode() {
  const rules = await getRules();
  let row = await prisma.checkinCode.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', code: randomCode() }
  });

  const elapsedSec = (Date.now() - new Date(row.generatedAt).getTime()) / 1000;
  if (elapsedSec >= rules.codeTTL) {
    row = await prisma.checkinCode.update({
      where: { id: 'singleton' },
      data: { code: randomCode(), generatedAt: new Date() }
    });
    return { ...row, secondsRemaining: rules.codeTTL };
  }
  return { ...row, secondsRemaining: Math.max(0, Math.ceil(rules.codeTTL - elapsedSec)) };
}

async function regenerateCode() {
  return prisma.checkinCode.upsert({
    where: { id: 'singleton' },
    update: { code: randomCode(), generatedAt: new Date() },
    create: { id: 'singleton', code: randomCode() }
  });
}

async function verifyCode(code) {
  const active = await getActiveCode();
  return active.code === String(code || '').trim();
}

module.exports = { getActiveCode, regenerateCode, verifyCode };
