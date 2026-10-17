const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ログインの試行回数が多すぎます。しばらくしてからもう一度お試しください' }
});

const inviteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '確認の回数が多すぎます。しばらくしてからもう一度お試しください' }
});
router.get('/invite/check', inviteLimiter, asyncHandler(ctrl.inviteCheck));

router.get('/line/login', asyncHandler(ctrl.lineLoginStart));
router.get('/line/callback', asyncHandler(ctrl.lineLoginCallback));
router.post('/member/logout', asyncHandler(ctrl.memberLogout));

router.post('/staff/login', loginLimiter, asyncHandler(ctrl.staffLogin));
router.post('/staff/logout', asyncHandler(ctrl.staffLogout));
router.post('/staff/change-password', requireStaff(), asyncHandler(ctrl.staffChangePassword));

router.get('/me', asyncHandler(ctrl.me));

module.exports = router;
