const contractService = require('../services/contractService');

class ContractController {
  async createContract(req, res, next) {
    try {
      const contract = await contractService.createContract(req.body);
      return res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllContracts(req, res, next) {
    try {
      const { employee_id, status, limit, offset } = req.query;
      const contracts = await contractService.getAllContracts({
        employee_id,
        status,
        limit,
        offset,
      });
      return res.status(200).json({
        success: true,
        count: contracts.length,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getContractById(req, res, next) {
    try {
      const contract = await contractService.getContractById(req.params.id);
      return res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  async getContractsByEmployee(req, res, next) {
    try {
      const contracts = await contractService.getContractsByEmployee(req.params.employeeId);
      return res.status(200).json({
        success: true,
        count: contracts.length,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveContractForDate(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { date } = req.query;
      const contract = await contractService.getActiveContractForDate(employeeId, date);
      return res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateContract(req, res, next) {
    try {
      const updated = await contractService.updateContract(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteContract(req, res, next) {
    try {
      const result = await contractService.deleteContract(req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContractController();
