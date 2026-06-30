// src/api/adminDashboardApi.js
import axios from "axios";

const api = axios.create({
baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin`,});

export const getAdminStats = () => {
  const token = localStorage.getItem("adminToken");
  return api.get("/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
};