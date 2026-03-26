import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Flask default port
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
