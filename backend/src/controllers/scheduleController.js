const scheduleService = require('../services/scheduleService');

class ScheduleController {
  async createSchedule(req, res, next) {
    try {
      const schedule = await scheduleService.createSchedule(req.body);
      return res.status(201).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSchedules(req, res, next) {
    try {
      const schedules = await scheduleService.getAllSchedules();
      return res.status(200).json({
        success: true,
        count: schedules.length,
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  }

  async getScheduleById(req, res, next) {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id);
      return res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSchedule(req, res, next) {
    try {
      const updated = await scheduleService.updateSchedule(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScheduleController();
