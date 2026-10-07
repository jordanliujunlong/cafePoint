const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');
const { attachIdentity } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const staffRoutes = require('./routes/staff.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Railway / 反向代理在前面，需要这个才能正确识别 https，cookie 的 secure 旗标才会生效
app.set('trust proxy', 1);

app.use(
  helmet({
    // 前端是同一个 Express 服务器直接吐出的静态档案，关掉预设的严格 CSP，
    // 避免挡到内嵌的 <style>/<script>；如果之后接 CDN 字型等外部资源要另外调整。
    contentSecurityPolicy: false
  })
);
app.use(
  cors({
    origin: config.appBaseUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachIdentity);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/me', memberRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// ---- 静态前端（public/）----
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`本町咖啡积分系统后端已启动： http://localhost:${config.port}`);
  console.log(`APP_BASE_URL = ${config.appBaseUrl}`);
  if (!config.line.channelId) {
    console.warn('⚠️  尚未设定 LINE_CHANNEL_ID / LINE_CHANNEL_SECRET，顾客端 LINE 登入暂时无法使用。');
  }
});
