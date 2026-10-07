const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();
router.use(requireStaff('admin')); // 只有 role === 'admin' 能进后台

router.get('/overview', asyncHandler(ctrl.overview));
router.get('/members', asyncHandler(ctrl.listMembers));
router.get('/rules', asyncHandler(ctrl.getRules));
router.put('/rules', asyncHandler(ctrl.putRules));
router.get('/ledger', asyncHandler(ctrl.ledger));

router.get('/staff', asyncHandler(ctrl.listStaff));
router.post('/staff', asyncHandler(ctrl.createStaff));
router.delete('/staff/:id', asyncHandler(ctrl.deleteStaff));

module.exports = router;
