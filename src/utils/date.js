const config = require('../config');

// 以门店时区计算「今天」的日期字串 YYYY-MM-DD（用来判断签到是否跨日、统计当日数据）。
function dateKeyInTz(date, tz) {
  // en-CA 的 Intl 输出刚好就是 YYYY-MM-DD 格式
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || config.storeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function todayKey() {
  return dateKeyInTz(new Date());
}

function daysAgoDate(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// 给定 YYYY-MM-DD，回传前一天的 YYYY-MM-DD（纯日期运算，不受时区 / 夏令时间影响）。
function prevDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

module.exports = { dateKeyInTz, todayKey, daysAgoDate, prevDayKey };
