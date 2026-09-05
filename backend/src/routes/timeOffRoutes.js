const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');

// Leave Types
router.route('/types')
  .get(timeOffController.getAllLeaveTypes)
  .post(timeOffController.createLeaveType);

// Allocations
router.route('/allocations')
  .get(timeOffController.getAllocations)
  .post(timeOffController.createAllocation);

router.get('/allocations/:id', timeOffController.getAllocationById);

// Requests
router.route('/requests')
  .get(timeOffController.getRequests)
  .post(timeOffController.submitRequest);

router.get('/requests/:id', timeOffController.getRequestById);

// Approvals & Refusals
router.post('/requests/:id/approve', timeOffController.approveRequest);
router.post('/requests/:id/refuse', timeOffController.refuseRequest);

module.exports = router;
