import axios from 'axios';

const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Utility function to format teacher name from email (name.surname@university.edu format)
export const formatTeacherName = (email) => {
  if (!email || !email.includes('@')) return '';
  const namePart = email.split('@')[0];
  return namePart.split('.').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ');
};

export default api;