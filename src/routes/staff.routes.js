const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/staff.controller');

const router = express.Router();
router.use(requireStaff()); // staff 或 admin 都可以用收银台

router.get('/members', asyncHandler(ctrl.listMembers));
router.post('/scan', asyncHandler(ctrl.scan));
router.post('/checkout', asyncHandler(ctrl.checkout));
router.get('/today-log', asyncHandler(ctrl.todayLog));

module.exports = router;
