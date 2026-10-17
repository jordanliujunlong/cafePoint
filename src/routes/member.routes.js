const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { requireMember } = require('../middleware/auth');
const ctrl = require('../controllers/member.controller');

const router = express.Router();
router.use(requireMember);

const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '試行回数が多すぎます。しばらくしてからもう一度お試しください' }
});

router.get('/summary', asyncHandler(ctrl.summary));
router.get('/transactions', asyncHandler(ctrl.transactions));
router.get('/qr', asyncHandler(ctrl.qr));
router.get('/invites', asyncHandler(ctrl.invites));
router.post('/checkin', checkinLimiter, asyncHandler(ctrl.checkin));

module.exports = router;
