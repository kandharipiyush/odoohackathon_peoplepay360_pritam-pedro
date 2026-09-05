const employeeService = require('../services/employeeService');

class EmployeeController {
  async createEmployee(req, res, next) {
    try {
      const creatorRole = req.user?.role || null;
      const newEmployee = await employeeService.createEmployee({
        ...req.body,
        creator_role: creatorRole,
      });
      return res.status(201).json({
        success: true,
        data: newEmployee,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingEmployees(req, res, next) {
    try {
      const pending = await employeeService.getPendingEmployees();
      return res.status(200).json({
        success: true,
        count: pending.length,
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveEmployee(req, res, next) {
    try {
      const approverRole = req.user?.role || null;
      const approved = await employeeService.approveEmployee(req.params.id, {
        ...req.body,
        approver_role: approverRole,
      });
      return res.status(200).json({
        success: true,
        message: 'Employee registration approved successfully',
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectEmployee(req, res, next) {
    try {
      const result = await employeeService.rejectEmployee(req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEmployees(req, res, next) {
    try {
      const { department, status, search, limit, offset } = req.query;
      const employees = await employeeService.getAllEmployees({
        department,
        status,
        search,
        limit,
        offset,
      });
      return res.status(200).json({
        success: true,
        count: employees.length,
        data: employees,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      return res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const updated = await employeeService.updateEmployee(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const result = await employeeService.deleteEmployee(req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
