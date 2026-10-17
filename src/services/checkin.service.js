const { prevDayKey } = require('../utils/date');

// 连续签到规则：
//  - 每天自己签到一次，拿「基本签到积分」(rules.checkinPoints)
//  - 连续第 5 天，当天额外加 rules.streak5Bonus
//  - 连续第 10 天，当天额外加 rules.streak10Bonus，然后循环结束：隔天重新从第 1 天开始
//  - 中途漏签任何一天，连续天数归零，下一次签到从第 1 天开始
const CYCLE_DAYS = 10;
const MILESTONES = [
  { day: 5, ruleKey: 'streak5Bonus' },
  { day: 10, ruleKey: 'streak10Bonus' }
];

/**
 * 计算「今天这次签到」是连续第几天。
 * @param {string|null} lastDate  上次签到日期 YYYY-MM-DD（门店时区）
 * @param {number} prevStreak     上次签到后记录的连续天数
 * @param {string} today          今天 YYYY-MM-DD
 */
function nextStreak(lastDate, prevStreak, today) {
  if (lastDate && lastDate === prevDayKey(today)) {
    // 昨天有签到：接着数；如果昨天刚好是第 10 天（循环已完成），今天重新从 1 开始
    return prevStreak >= CYCLE_DAYS ? 1 : prevStreak + 1;
  }
  return 1; // 第一次签到，或中间断过
}

/** 今天这个连续天数该拿的额外奖励（没有里程碑则为 null）。 */
function bonusForStreak(streak, rules) {
  const hit = MILESTONES.find((m) => m.day === streak);
  if (!hit) return null;
  const points = Number(rules[hit.ruleKey]) || 0;
  return points > 0 ? { day: hit.day, points } : null;
}

/**
 * 给前端显示用：此刻「有效的」连续天数。
 *  - 今天已签到：就是记录的天数
 *  - 昨天签到、今天还没签：沿用记录的天数（若昨天刚完成第 10 天则显示 0，表示新循环尚未开始）
 *  - 更早之前：已经断了，显示 0
 */
function effectiveStreak(lastDate, streak, today) {
  if (!lastDate) return 0;
  if (lastDate === today) return streak;
  if (lastDate === prevDayKey(today)) return streak >= CYCLE_DAYS ? 0 : streak;
  return 0;
}

/** 下一次签到会是第几天，以及还要几天才有奖励（给「再 N 天有奖励」的提示用）。 */
function nextMilestone(currentEffective, rules) {
  const upcomingDay = currentEffective >= CYCLE_DAYS ? 1 : currentEffective + 1;
  const next = MILESTONES.find((m) => m.day >= upcomingDay && (Number(rules[m.ruleKey]) || 0) > 0);
  if (!next) return null;
  return { day: next.day, points: Number(rules[next.ruleKey]), daysAway: next.day - upcomingDay };
}

module.exports = { CYCLE_DAYS, MILESTONES, nextStreak, bonusForStreak, effectiveStreak, nextMilestone };
