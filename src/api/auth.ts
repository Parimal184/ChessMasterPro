import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export const login = async (email: string, password: string) => {
  return await axios.post(`${API_URL}/login`, { email, password });
};

export const register = async (email: string, password: string) => {
  return await axios.post(`${API_URL}/register`, { email, password });
};
