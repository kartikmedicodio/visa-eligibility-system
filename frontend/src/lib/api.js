import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents API
export const uploadDocument = async (file, documentType = 'other') => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDocument = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const processDocument = async (id) => {
  const response = await api.post(`/documents/${id}/process`);
  return response.data;
};

// Applications API
export const createApplication = async (name, email, documentIds = []) => {
  const response = await api.post('/applications', {
    name,
    email,
    documentIds,
  });
  return response.data;
};

export const getApplication = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

export const processApplicationDocuments = async (id) => {
  const response = await api.post(`/applications/${id}/process`);
  return response.data;
};

// Eligibility API
export const checkEligibility = async (applicationId, visaTypes = null) => {
  const response = await api.post('/eligibility/check', {
    applicationId,
    visaTypes,
  });
  return response.data;
};

export const getEligibilityResults = async (applicationId) => {
  const response = await api.get(`/eligibility/${applicationId}`);
  return response.data;
};

// Rules API
export const scrapeRules = async (visaType, url = null) => {
  const response = await api.post('/rules/scrape', {
    visaType,
    url,
  });
  return response.data;
};

export const getRules = async (visaType) => {
  const response = await api.get(`/rules/${visaType}`);
  return response.data;
};

export const listAllRules = async () => {
  const response = await api.get('/rules');
  return response.data;
};

