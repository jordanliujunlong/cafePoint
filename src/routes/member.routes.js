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
  message: { error: '尝试次数太多，请稍等一下再试' }
});

router.get('/summary', asyncHandler(ctrl.summary));
router.get('/transactions', asyncHandler(ctrl.transactions));
router.post('/checkin', checkinLimiter, asyncHandler(ctrl.checkin));

module.exports = router;
