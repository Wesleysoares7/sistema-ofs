import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T>(url: string) {
    return this.api.get<T>(url);
  }

  async post<T>(url: string, data?: any) {
    return this.api.post<T>(url, data);
  }

  async put<T>(url: string, data?: any) {
    return this.api.put<T>(url, data);
  }

  async delete<T>(url: string) {
    return this.api.delete<T>(url);
  }
}

export const api = new ApiService();
