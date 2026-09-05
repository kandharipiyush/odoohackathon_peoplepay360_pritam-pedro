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

// Approvals & Refusals (support POST, PATCH, PUT for maximum client compatibility)
router.all('/requests/:id/approve', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    return timeOffController.approveRequest(req, res, next);
  }
  next();
});

router.all('/requests/:id/refuse', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    return timeOffController.refuseRequest(req, res, next);
  }
  next();
});

module.exports = router;
