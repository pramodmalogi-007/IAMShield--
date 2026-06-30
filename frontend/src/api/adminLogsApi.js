import axios from "axios";

const api = axios.create({
baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/logs`,});

const authHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return { Authorization: `Bearer ${token}` };
};

export const getLogs = () =>
  api.get("/", { headers: authHeaders() });