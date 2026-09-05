const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// GET attendance records list
router.get('/', attendanceController.getAttendanceRecords);

// POST check-in & check-out actions
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// GET single attendance record
router.get('/:id', attendanceController.getAttendanceById);

// PATCH / PUT manual exception resolution & manager adjustment
router.patch('/:id/exception', attendanceController.logManualException);

module.exports = router;
