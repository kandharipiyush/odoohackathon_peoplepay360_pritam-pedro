const { pool } = require('../config/db');

/**
 * Service managing working schedule definitions
 */
class ScheduleService {
  /**
   * Create a new working schedule
   */
  async createSchedule({ name, type = 'Standard_40h', weekly_hours = 40.0, schedule_details }) {
    if (!name) {
      const error = new Error('Field "name" is required');
      error.statusCode = 400;
      throw error;
    }

    const defaultDetails = {
      monday: { start: '09:00', end: '17:00', break_minutes: 60 },
      tuesday: { start: '09:00', end: '17:00', break_minutes: 60 },
      wednesday: { start: '09:00', end: '17:00', break_minutes: 60 },
      thursday: { start: '09:00', end: '17:00', break_minutes: 60 },
      friday: { start: '09:00', end: '17:00', break_minutes: 60 },
    };

    const detailsJson = JSON.stringify(schedule_details || defaultDetails);

    const [result] = await pool.query(
      `INSERT INTO working_schedules (name, type, weekly_hours, schedule_details_json)
       VALUES (?, ?, ?, ?)`,
      [name, type, weekly_hours, detailsJson]
    );

    return this.getScheduleById(result.insertId);
  }

  /**
   * Get all working schedules
   */
  async getAllSchedules() {
    const [rows] = await pool.query('SELECT * FROM working_schedules ORDER BY id ASC');
    return rows.map((row) => ({
      ...row,
      schedule_details_json:
        typeof row.schedule_details_json === 'string'
          ? JSON.parse(row.schedule_details_json)
          : row.schedule_details_json,
    }));
  }

  /**
   * Get working schedule by ID
   */
  async getScheduleById(id) {
    const [rows] = await pool.query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (rows.length === 0) {
      const error = new Error(`Working schedule with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const row = rows[0];
    return {
      ...row,
      schedule_details_json:
        typeof row.schedule_details_json === 'string'
          ? JSON.parse(row.schedule_details_json)
          : row.schedule_details_json,
    };
  }

  /**
   * Update working schedule
   */
  async updateSchedule(id, { name, type, weekly_hours, schedule_details }) {
    await this.getScheduleById(id);

    const fieldsToUpdate = [];
    const params = [];

    if (name !== undefined) {
      fieldsToUpdate.push('name = ?');
      params.push(name);
    }
    if (type !== undefined) {
      fieldsToUpdate.push('type = ?');
      params.push(type);
    }
    if (weekly_hours !== undefined) {
      fieldsToUpdate.push('weekly_hours = ?');
      params.push(weekly_hours);
    }
    if (schedule_details !== undefined) {
      fieldsToUpdate.push('schedule_details_json = ?');
      params.push(JSON.stringify(schedule_details));
    }

    if (fieldsToUpdate.length > 0) {
      params.push(id);
      await pool.query(`UPDATE working_schedules SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, params);
    }

    return this.getScheduleById(id);
  }
}

module.exports = new ScheduleService();
