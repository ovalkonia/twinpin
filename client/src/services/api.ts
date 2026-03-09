import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // бек адрес
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;