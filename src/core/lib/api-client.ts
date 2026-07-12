import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if we are on the client
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('transit_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = Cookies.get('transit_refresh_token');
        const token = Cookies.get('transit_token');
        if (refreshToken) {
          try {
            // Find current role based on URL route
            const role = window.location.pathname.startsWith('/company') ? 'driver' : 'passenger';
            
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/auth/${role}/refresh`,
              { refreshToken },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (refreshResponse.status === 200 || refreshResponse.status === 201) {
              const newAccessToken = refreshResponse.data.accessToken;
              const newRefreshToken = refreshResponse.data.refreshToken;

              Cookies.set('transit_token', newAccessToken, { expires: 7 });
              Cookies.set('transit_refresh_token', newRefreshToken, { expires: 7 });

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            Cookies.remove('transit_token');
            Cookies.remove('transit_refresh_token');
            const path = window.location.pathname;
            if (path.startsWith('/company')) {
              window.location.href = '/company/login';
            } else {
              window.location.href = '/passenger/login';
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
