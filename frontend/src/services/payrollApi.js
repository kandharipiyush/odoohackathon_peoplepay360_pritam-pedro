import api from './api';

export const payrollApi = {
  getPayruns: async (params) => {
    return api.get('/payruns', { params });
  },

  getPayrun: async (id) => {
    return api.get(`/payruns/${id}`);
  },

  createPayrun: async (data) => {
    return api.post('/payruns', data);
  },

  processPayrun: async (id) => {
    return api.post(`/payruns/${id}/compute`);
  },

  validatePayrun: async (id) => {
    return api.post(`/payruns/${id}/validate`);
  },

  markPayrunAsPaid: async (id) => {
    return api.post(`/payruns/${id}/pay`);
  },

  getPayrunWarnings: async (id) => {
    // Warnings are embedded in the payrun response; fetch payrun details
    return api.get(`/payruns/${id}`);
  },

  getPayslips: async (params) => {
    if (params?.payrunId) {
      return api.get(`/payruns/${params.payrunId}/payslips`, { params });
    }
    return api.get('/payslips', { params });
  },

  getPayslip: async (id) => {
    return api.get(`/payruns/payslips/${id}`);
  },

  downloadPayslipPdf: async (id) => {
    const token = localStorage.getItem('token');
    const response = await api.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payslip_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  emailPayslip: async (id) => {
    // Not implemented on backend yet — placeholder
    return { data: { success: true, message: 'Email feature coming soon' } };
  },

  bulkEmailPayslips: async (ids) => {
    // Not implemented on backend yet — placeholder
    return { data: { success: true, count: ids.length, message: 'Bulk email feature coming soon' } };
  }
};
