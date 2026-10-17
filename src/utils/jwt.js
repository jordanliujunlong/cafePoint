const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: expiresIn || '30d' });
}

function verify(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

// ---- 会员二维码专用 token ----
// 二维码会被店员扫描、甚至被拍照，所以：
//  1) 用「另一把」由 JWT_SECRET 衍生出来的密钥签发，不能拿来当登入 cookie 使用；
//  2) 有效期很短（预设 90 秒），顾客画面每 60 秒会自动换一张新的。
const QR_PREFIX = 'BMQ:';
const QR_TTL_SEC = 90;
const qrSecret = () => config.jwtSecret + '|member-qr|v1';

function signMemberQr(memberId) {
  const token = jwt.sign({ typ: 'member-qr', sub: memberId }, qrSecret(), { expiresIn: QR_TTL_SEC });
  return QR_PREFIX + token;
}

// 回传 memberId；无效、过期或被改过都回传 null。
function verifyMemberQr(code) {
  const raw = String(code || '').trim();
  if (!raw.startsWith(QR_PREFIX)) return null;
  try {
    const payload = jwt.verify(raw.slice(QR_PREFIX.length), qrSecret());
    return payload && payload.typ === 'member-qr' ? payload.sub : null;
  } catch (e) {
    return null;
  }
}

module.exports = { sign, verify, signMemberQr, verifyMemberQr, QR_TTL_SEC };
