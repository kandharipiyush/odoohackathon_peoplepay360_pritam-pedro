const timeOffService = require('../services/timeOffService');

class TimeOffController {
  // ==========================================
  // Leave Types
  // ==========================================
  async createLeaveType(req, res, next) {
    try {
      const leaveType = await timeOffService.createLeaveType(req.body);
      return res.status(201).json({
        success: true,
        data: leaveType,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllLeaveTypes(req, res, next) {
    try {
      const types = await timeOffService.getAllLeaveTypes();
      return res.status(200).json({
        success: true,
        count: types.length,
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Leave Allocations
  // ==========================================
  async createAllocation(req, res, next) {
    try {
      const allocation = await timeOffService.createAllocation(req.body);
      return res.status(201).json({
        success: true,
        data: allocation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllocations(req, res, next) {
    try {
      const { employee_id, leave_type_id } = req.query;
      const allocations = await timeOffService.getAllocations({ employee_id, leave_type_id });
      return res.status(200).json({
        success: true,
        count: allocations.length,
        data: allocations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllocationById(req, res, next) {
    try {
      const allocation = await timeOffService.getAllocationById(req.params.id);
      return res.status(200).json({
        success: true,
        data: allocation,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Leave Requests & Approval
  // ==========================================
  async submitRequest(req, res, next) {
    try {
      const request = await timeOffService.submitRequest(req.body);
      return res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequests(req, res, next) {
    try {
      const { employee_id, status, start_date, end_date, limit, offset } = req.query;
      const requests = await timeOffService.getRequests({
        employee_id,
        status,
        start_date,
        end_date,
        limit,
        offset,
      });
      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequestById(req, res, next) {
    try {
      const request = await timeOffService.getRequestById(req.params.id);
      return res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const result = await timeOffService.approveRequest(req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refuseRequest(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await timeOffService.refuseRequest(req.params.id, reason);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimeOffController();
