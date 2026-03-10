import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, endpoint, data = null, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        method,
        url: `${API_URL}/api${endpoint}`,
        ...options
      };
      
      if (data) {
        if (method === 'get') {
          config.params = data;
        } else {
          config.data = data;
        }
      }
      
      const response = await axios(config);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Er is een fout opgetreden';
      setError(message);
      if (!options.silent) {
        toast.error(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, params, options) => 
    request('get', endpoint, params, options), [request]);
  
  const post = useCallback((endpoint, data, options) => 
    request('post', endpoint, data, options), [request]);
  
  const put = useCallback((endpoint, data, options) => 
    request('put', endpoint, data, options), [request]);
  
  const del = useCallback((endpoint, options) => 
    request('delete', endpoint, null, options), [request]);

  return { loading, error, get, post, put, del, request };
};

// Specific API hooks
export const useClasses = () => {
  const api = useApi();
  
  return {
    ...api,
    getClasses: (includeInactive = false) => 
      api.get('/classes', { includeInactive }),
    createClass: (data) => api.post('/classes', data),
    updateClass: (id, data) => api.put(`/classes/${id}`, data),
    deleteClass: (id) => api.del(`/classes/${id}`),
    importClasses: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.request('post', '/classes/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  };
};

export const useStudyTypes = () => {
  const api = useApi();
  
  return {
    ...api,
    getStudyTypes: (includeInactive = false) => 
      api.get('/study-types', { includeInactive }),
    createStudyType: (data) => api.post('/study-types', data),
    updateStudyType: (id, data) => api.put(`/study-types/${id}`, data),
    deleteStudyType: (id) => api.del(`/study-types/${id}`)
  };
};

export const useAvailabilityRules = () => {
  const api = useApi();
  
  return {
    ...api,
    getRules: (includeInactive = false) => 
      api.get('/availability-rules', { includeInactive }),
    createRule: (data) => api.post('/availability-rules', data),
    updateRule: (id, data) => api.put(`/availability-rules/${id}`, data),
    deleteRule: (id) => api.del(`/availability-rules/${id}`)
  };
};

export const useExclusionDates = () => {
  const api = useApi();
  
  return {
    ...api,
    getDates: (includeInactive = false) => 
      api.get('/exclusion-dates', { includeInactive }),
    createDate: (data) => api.post('/exclusion-dates', data),
    deleteDate: (id) => api.del(`/exclusion-dates/${id}`)
  };
};

export const useStudyMoments = () => {
  const api = useApi();
  
  return {
    ...api,
    getMoments: (params) => api.get('/study-moments', params),
    getAvailableMoments: (studyTypeId) => 
      api.get('/study-moments/available', { studyTypeId }),
    getMoment: (id) => api.get(`/study-moments/${id}`),
    createMoment: (data) => api.post('/study-moments', data),
    updateMoment: (id, data) => api.put(`/study-moments/${id}`, data),
    deleteMoment: (id) => api.del(`/study-moments/${id}`),
    generateMoments: (data) => api.post('/study-moments/generate', data)
  };
};

export const useRegistrations = () => {
  const api = useApi();
  
  return {
    ...api,
    getRegistrations: (params) => api.get('/registrations', params),
    getMyRegistrations: () => api.get('/registrations/my'),
    createRegistration: (data) => api.post('/registrations', data),
    updateRegistration: (id, data) => api.put(`/registrations/${id}`, data),
    cancelRegistration: (id) => api.del(`/registrations/${id}`)
  };
};

export const useAttendance = () => {
  const api = useApi();
  
  return {
    ...api,
    getAttendance: (params) => api.get('/attendance', params),
    getAttendanceByDate: (date) => api.get(`/attendance/by-date/${date}`),
    recordAttendance: (data) => api.post('/attendance', data),
    updateAttendance: (id, data) => api.put(`/attendance/${id}`, data)
  };
};

export const useEmailTemplates = () => {
  const api = useApi();
  
  return {
    ...api,
    getTemplates: () => api.get('/email-templates'),
    createTemplate: (data) => api.post('/email-templates', data),
    updateTemplate: (id, data) => api.put(`/email-templates/${id}`, data),
    deleteTemplate: (id) => api.del(`/email-templates/${id}`)
  };
};

export const useUsers = () => {
  const api = useApi();
  
  return {
    ...api,
    getUsers: () => api.get('/users'),
    updateUser: (id, data) => api.put(`/users/${id}`, data)
  };
};

export const useReports = () => {
  const api = useApi();
  
  return {
    ...api,
    getSummary: (params) => api.get('/reports/summary', params),
    exportRegistrations: (params) => api.get('/reports/export', params)
  };
};

export const useDashboard = () => {
  const api = useApi();
  
  return {
    ...api,
    getStats: () => api.get('/dashboard/stats'),
    seedData: () => api.post('/seed')
  };
};
