// Dynamically resolve API URL based on current host/subdomain
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;

    // 1. Local Testing
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }

    // 2. Direct IP Testing
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return `${protocol}//${hostname}/api/v1`;
    }

    // 3. Dynamic Subdomain: e.g. lifetransport.ssquareg.io -> api.lifetransport.ssquareg.io
    if (!hostname.startsWith('api.')) {
      return `${protocol}//api.${hostname}/api/v1`;
    }

    return `${protocol}//${hostname}/api/v1`;
  }

  return 'https://api.lifetransport.ssquareg.io/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();
export const STORAGE_URL = API_BASE_URL.replace('/api/v1', '/storage');

