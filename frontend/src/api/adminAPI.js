import axios from '../api';

const adminAPI = {
  getAllUsers: async () => {
    try {
      const response = await axios.get('/api/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSystemStats: async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPendingDocuments: async () => {
    try {
      const response = await axios.get('/api/admin/documents');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPendingApplications: async () => {
    try {
      const response = await axios.get('/api/admin/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getApprovedApplications: async () => {
    try {
      const response = await axios.get('/api/admin/applications/approved');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  verifyDocument: async (document_id, approved, rejection_reason = '') => {
    try {
      const response = await axios.put(`/api/admin/document/${document_id}/verify`, {
        approved,
        rejection_reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  reviewApplication: async (application_id, approved, verification_notes = '') => {
    try {
      const response = await axios.put(`/api/admin/application/${application_id}/review`, {
        approved,
        verification_notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  disburseFunds: async (application_id, amount_to_disburse) => {
    try {
      const response = await axios.put(`/api/admin/application/${application_id}/disburse`, {
        amount_to_disburse
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTransactionLedger: async (status = '', limit = 50, skip = 0) => {
    try {
      const response = await axios.get('/api/admin/ledger', {
        params: { status, limit, skip }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  flagTransaction: async (transaction_id, reason) => {
    try {
      const response = await axios.put(`/api/admin/transaction/${transaction_id}/flag`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminAPI;
