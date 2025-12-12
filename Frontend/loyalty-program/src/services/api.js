const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";



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

  // Get CSRF token from cookies
  getCsrfToken() {
    const name = "csrfToken=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Get CSRF token from cookies (preferred) or localStorage (fallback)
    const csrfToken = this.getCsrfToken() || localStorage.getItem("csrfToken");
    
    // Only send CSRF token for non-GET requests and non-auth endpoints
    const isAuthEndpoint = endpoint.startsWith('/auth/');
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && !isAuthEndpoint && isStateChanging ? { "x-csrf-token": csrfToken } : {}),
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
      // Don't redirect for auth endpoints (login, activate, password reset)
      if (response.status === 401 && !isAuthEndpoint) {
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
      let data = null;
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          // If JSON parsing fails, throw a more descriptive error
          throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      // If it's already an Error object, throw it as is
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it in an Error
      throw new Error(error.message || "Request failed");
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
