// 集章卡：每次消费盖 1 个章，集满 STAMP_GOAL 个送 STAMP_REWARD_POINTS 积分，印章归零重新累积。
// （以前是换免费券；已持有的免费券仍可在收银时使用，但不再发新的。）
const STAMP_GOAL = 10;
const STAMP_REWARD_POINTS = 2000;

/** 目前印章数 + 这次盖的章数 -> { stamps: 盖完后的印章数, rewardsEarned: 这次集满几次, rewardPoints: 送的积分 } */
function addStamps(current, added) {
  const total = Math.max(0, current || 0) + Math.max(0, added || 0);
  const rewardsEarned = Math.floor(total / STAMP_GOAL);
  return { stamps: total % STAMP_GOAL, rewardsEarned, rewardPoints: rewardsEarned * STAMP_REWARD_POINTS };
}

module.exports = { STAMP_GOAL, STAMP_REWARD_POINTS, addStamps };
