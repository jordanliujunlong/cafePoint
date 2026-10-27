// 集章卡：每次消费盖 1 个章，集满 STAMP_GOAL 个换 1 张免费券（下次消费全额免费），印章归零重新累积。
const STAMP_GOAL = 10;

/** 目前印章数 + 这次盖的章数 -> { stamps: 盖完后的印章数, ticketsEarned: 这次换到几张免费券 } */
function addStamps(current, added) {
  const total = Math.max(0, current || 0) + Math.max(0, added || 0);
  return { stamps: total % STAMP_GOAL, ticketsEarned: Math.floor(total / STAMP_GOAL) };
}

module.exports = { STAMP_GOAL, addStamps };
