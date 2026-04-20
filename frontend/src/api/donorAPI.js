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

  makeDonation: async ({ application_id, amount, message = '', payment_reference, proof_image }) => {
    try {
      const formData = new FormData();
      formData.append('application_id', application_id);
      formData.append('amount', amount);
      formData.append('message', message);
      formData.append('payment_reference', payment_reference);
      formData.append('proof_image', proof_image);
      // Reused by backend upload middleware filename strategy.
      formData.append('document_type', 'PAYMENT_PROOF');

      const response = await axios.post('/api/donor/donate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
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
  },

  exportReceipt: async (receipt_id) => {
    try {
      const response = await axios.get(`/api/donor/receipt/download/${receipt_id}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default donorAPI;
