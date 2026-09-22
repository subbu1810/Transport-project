import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_TRANSPORT = 'transport_config';
export const STORAGE_KEY_API_URL = 'transport_api_url';

// Default presets - you can add more transports here anytime!
export const PRESET_TRANSPORTS = [
  {
    code: 'LIFE',
    name: 'Life Transport',
    apiUrl: 'https://api.lifetransport.ssquareg.com/api/v1',
    description: 'Life Transport Logistics',
    color: '#10b981'
  },
  {
    code: 'GARUDA',
    name: 'Garuda Transport',
    apiUrl: 'https://api.garudaerp.ssquareg.com/api/v1',
    description: 'Garuda ERP Transport Logistics',
    color: '#2563eb'
  },
  {
    code: 'DEMO',
    name: 'Demo / Local',
    apiUrl: 'http://10.0.2.2:8000/api/v1',
    description: 'Local Emulator Development',
    color: '#6b7280'
  }
];

// Active in-memory cache for ultra-fast API calls
let cachedApiUrl = null;

export const getCachedApiUrl = () => cachedApiUrl;
export const setCachedApiUrl = (url) => { cachedApiUrl = url; };

/**
 * Retrieve saved transport configuration
 */
export const getTransportConfig = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_TRANSPORT);
    if (raw) {
      const config = JSON.parse(raw);
      cachedApiUrl = config.apiUrl;
      return config;
    }
  } catch (err) {
    console.error('Failed to get transport config:', err);
  }
  return null;
};

/**
 * Save new transport configuration
 */
export const setTransportConfig = async (config) => {
  try {
    if (!config || !config.apiUrl) {
      throw new Error('Invalid transport config: apiUrl is required');
    }
    // Clean up trailing slash
    let cleanUrl = config.apiUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.includes('/api/')) {
      cleanUrl = `${cleanUrl}/api/v1`;
    }

    const payload = {
      code: config.code || 'CUSTOM',
      name: config.name || 'Transport Company',
      apiUrl: cleanUrl,
      updatedAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(STORAGE_KEY_TRANSPORT, JSON.stringify(payload));
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, payload.apiUrl);
    cachedApiUrl = payload.apiUrl;
    return payload;
  } catch (err) {
    console.error('Failed to save transport config:', err);
    throw err;
  }
};

/**
 * Remove transport configuration
 */
export const clearTransportConfig = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_TRANSPORT);
    await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    cachedApiUrl = null;
  } catch (err) {
    console.error('Failed to clear transport config:', err);
  }
};

/**
 * Parse data scanned from QR code or typed manually
 * Supports:
 * 1. JSON payload: { "code": "LIFE", "name": "Life Transport", "apiUrl": "https://..." }
 * 2. URL string: https://api.lifetransport.ssquareg.com/api/v1
 * 3. Short Code: LIFE, GARUDA, etc.
 */
export const parseQRData = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    throw new Error('Invalid QR code data');
  }

  const trimmed = rawData.trim();

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.apiUrl) {
        return {
          code: parsed.code || 'QR_TRANSPORT',
          name: parsed.name || 'Transport Partner',
          apiUrl: parsed.apiUrl
        };
      }
    } catch (e) {
      // not valid JSON, continue to other checks
    }
  }

  // 2. Check if it matches a preset code (e.g. LIFE, GARUDA)
  const upperCode = trimmed.toUpperCase();
  const matchedPreset = PRESET_TRANSPORTS.find(p => p.code === upperCode);
  if (matchedPreset) {
    return matchedPreset;
  }

  // 3. Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let name = 'Custom Transport';
    try {
      const match = trimmed.match(/https?:\/\/(?:api\.)?([^\/\.]+)/i);
      if (match && match[1]) {
        name = match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' Transport';
      }
    } catch (e) {}

    return {
      code: 'CUSTOM',
      name: name,
      apiUrl: trimmed
    };
  }


  throw new Error('Unrecognized QR code or company code. Please verify and try again.');
};
