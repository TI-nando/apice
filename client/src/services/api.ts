import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL as string)
  || (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e?.response?.status === 401) {
      localStorage.removeItem("token");
      location.href = "/login";
    }
    return Promise.reject(e);
  }
);
