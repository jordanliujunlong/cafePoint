require('dotenv').config();

function required(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    console.warn(`[config] 缺少环境变量 ${name}，请检查 .env（参考 .env.example）。`);
    return '';
  }
  return v;
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  appBaseUrl: required('APP_BASE_URL', 'http://localhost:3000').replace(/\/+$/, ''),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  storeTz: process.env.STORE_TZ || 'Asia/Taipei',
  line: {
    channelId: process.env.LINE_CHANNEL_ID || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    get redirectUri() {
      return `${module.exports.appBaseUrl}/api/auth/line/callback`;
    }
  }
};
