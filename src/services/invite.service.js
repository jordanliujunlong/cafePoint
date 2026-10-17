const crypto = require('crypto');

// 容易看错的字符（0/O、1/I）不放进字母表；32 个字符 ^ 8 位 ≈ 1.1 万亿种组合，无法靠猜测命中。
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 8;

function randomCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

/** 使用者输入 / 贴上的内容 -> 统一格式（大写、去掉空白和连字号）。格式不对回传 null。 */
function normalizeCode(input) {
  const raw = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== CODE_LEN) return null;
  for (const ch of raw) if (!ALPHABET.includes(ch)) return null;
  return raw;
}

/** 8 位 -> XXXX-XXXX（给人看的格式）。 */
function formatCode(raw) {
  return raw.slice(0, 4) + '-' + raw.slice(4);
}

/**
 * 在传入的 prisma client（可以是 transaction client）里，为某位会员产生一组新的邀请码。
 */
async function issueInviteCode(db, inviterId, sourceTxId) {
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    const exists = await db.inviteCode.findUnique({ where: { code } });
    if (exists) continue;
    return db.inviteCode.create({ data: { code, inviterId, sourceTxId: sourceTxId || null } });
  }
  throw new Error('招待コードを生成できませんでした');
}

/**
 * 新会员使用邀请码。必须在 prisma.$transaction 的 tx 里呼叫。
 * 回传 { ok:true, inviteeBonus, inviterBonus, inviterId } 或 { ok:false, reason: 'invalid'|'used'|'self' }
 */
async function redeemInvite(tx, rawCode, newMember, rules) {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: 'invalid' };

  const invite = await tx.inviteCode.findUnique({ where: { code } });
  if (!invite) return { ok: false, reason: 'invalid' };
  if (invite.inviterId === newMember.id) return { ok: false, reason: 'self' }; // 只能邀请其他人
  if (invite.usedById) return { ok: false, reason: 'used' };

  // 用「还没被使用」当更新条件：两个人同时输入同一组码时，只有一个会成功。
  const claimed = await tx.inviteCode.updateMany({
    where: { id: invite.id, usedById: null },
    data: { usedById: newMember.id, usedAt: new Date() }
  });
  if (claimed.count === 0) return { ok: false, reason: 'used' };

  const inviterBonus = Math.max(0, Number(rules.inviterBonus) || 0);
  const inviteeBonus = Math.max(0, Number(rules.inviteeBonus) || 0);

  if (inviterBonus > 0) {
    await tx.member.update({ where: { id: invite.inviterId }, data: { points: { increment: inviterBonus } } });
    await tx.transaction.create({
      data: {
        memberId: invite.inviterId,
        type: 'bonus',
        earnedPoints: inviterBonus,
        note: `お友達紹介ボーナス（${newMember.displayName}さんが入会）`
      }
    });
  }
  if (inviteeBonus > 0) {
    await tx.member.update({ where: { id: newMember.id }, data: { points: { increment: inviteeBonus } } });
    await tx.transaction.create({
      data: { memberId: newMember.id, type: 'bonus', earnedPoints: inviteeBonus, note: 'ご紹介入会ボーナス' }
    });
  }
  return { ok: true, inviterId: invite.inviterId, inviterBonus, inviteeBonus };
}

/** 登入页检查邀请码是否可用（不透露是谁的码）。 */
async function checkInvite(db, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return 'invalid';
  const invite = await db.inviteCode.findUnique({ where: { code } });
  if (!invite) return 'invalid';
  if (invite.usedById) return 'used';
  return 'ok';
}

module.exports = { normalizeCode, formatCode, issueInviteCode, redeemInvite, checkInvite };
