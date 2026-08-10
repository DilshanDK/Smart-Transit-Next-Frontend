import axios from 'axios';
import Cookies from 'js-cookie';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:4000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token and dynamically resolve baseURL
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
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
    // Handle network connection errors globally
    if (error.code === 'ERR_NETWORK') {
      error.response = {
        data: { message: 'Backend connection failed. Please ensure the server is running.' },
        status: 503,
      };
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = Cookies.get('transit_refresh_token');
        const token = Cookies.get('transit_token');
        if (refreshToken) {
          try {
            // Find current role based on URL route
            const role = window.location.pathname.startsWith('/company') ? 'driver' : 'passenger';
            
            const refreshResponse = await axios.post(
              `${getApiBaseUrl()}/auth/${role}/refresh`,
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
          } catch (refreshError: any) {
            const refreshStatus = refreshError?.response?.status;
            if (refreshStatus === 401 || refreshStatus === 403) {
              // Refresh token is genuinely expired or revoked — force logout
              Cookies.remove('transit_token');
              Cookies.remove('transit_refresh_token');
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
            // For network errors during refresh — don't logout, backend may still be restarting
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
