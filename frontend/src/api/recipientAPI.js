import axios from '../api';

const recipientAPI = {
  submitApplication: async (amount_requested, reason) => {
    try {
      const response = await axios.post('/api/recipient/apply', {
        amount_requested,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  withdrawApplication: async (application_id) => {
    try {
      const response = await axios.delete(`/api/recipient/application/${application_id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadDocument: async (document_type, file, application_id = null) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', document_type);
      if (application_id) {
        formData.append('application_id', application_id);
      }

      const response = await axios.post('/api/recipient/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const response = await axios.delete(`/api/recipient/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getApplications: async () => {
    try {
      const response = await axios.get('/api/recipient/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDocuments: async () => {
    try {
      const response = await axios.get('/api/recipient/documents');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getWallet: async () => {
    try {
      const response = await axios.get('/api/recipient/wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default recipientAPI;
