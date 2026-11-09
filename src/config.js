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
    // 管理画面からコピーしたときに紛れ込みやすい前後の空白・改行を除く
    channelId: (process.env.LINE_CHANNEL_ID || '').trim(),
    channelSecret: (process.env.LINE_CHANNEL_SECRET || '').trim(),
    get redirectUri() {
      return `${module.exports.appBaseUrl}/api/auth/line/callback`;
    },
    // LIFF アプリの ID（LINE Login チャネル → LIFF タブ）。未設定なら従来の LINE Login で動く
    liffId: (process.env.LIFF_ID || '').trim()
  },
  /** お客様に案内する URL（招待リンク等）。LIFF があれば LINE アプリ内で開く liff.line.me の URL */
  customerUrl(query) {
    const base = module.exports.line.liffId
      ? `https://liff.line.me/${module.exports.line.liffId}`
      : `${module.exports.appBaseUrl}/`;
    return query ? `${base}?${query}` : base;
  }
};
