// src/shared/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or sessionStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
