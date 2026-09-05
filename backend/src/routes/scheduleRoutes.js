const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// GET all schedules / POST create schedule
router.route('/')
  .get(scheduleController.getAllSchedules)
  .post(scheduleController.createSchedule);

// GET / PUT single schedule
router.route('/:id')
  .get(scheduleController.getScheduleById)
  .put(scheduleController.updateSchedule);

module.exports = router;
