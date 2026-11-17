import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // Uses vite proxy
});

export default api;
