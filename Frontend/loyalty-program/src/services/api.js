const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  // Get JWT token from localStorage
  getToken() {
    return localStorage.getItem("token");
  }

  // Set JWT token in localStorage
  setToken(token) {
    localStorage.setItem("token", token);
  }

  // Remove JWT token from localStorage
  removeToken() {
    localStorage.removeItem("token");
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const csrfToken = getCookie("csrfToken");

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        ...options.headers,
      },
      credentials: "include",
    };

    // Add Authorization header if token exists
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        this.removeToken();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return null; // Return null for empty successful responses
      }

      // Parse JSON response
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Request failed");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    let url = endpoint;

    // Build query string from params if provided
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }

    return this.request(url, {
      method: "GET",
    });
  }

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // PATCH request
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // POST with file upload (multipart/form-data)
  async postWithFile(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      method: "POST",
      body: formData,
      headers: {},
    };

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH with file upload
  async patchWithFile(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      method: "PATCH",
      body: formData,
      headers: {},
    };

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;
