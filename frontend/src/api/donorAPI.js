import axios from '../api';

const donorAPI = {
  getApprovedApplications: async () => {
    try {
      const response = await axios.get('/api/donor/approved-applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  makeDonation: async (application_id, amount, message = '') => {
    try {
      const response = await axios.post('/api/donor/donate', { application_id, amount, message });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDonationHistory: async () => {
    try {
      const response = await axios.get('/api/donor/history');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getReceipt: async (receipt_id) => {
    try {
      const response = await axios.get(`/api/donor/receipt/${receipt_id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  downloadReceipt: (receipt_id) => {
    return `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/donor/receipt/download/${receipt_id}`;
  }
};

export default donorAPI;
