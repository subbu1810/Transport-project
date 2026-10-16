import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_TRANSPORT = 'transport_config';
export const STORAGE_KEY_API_URL = 'transport_api_url';
export const STORAGE_KEY_SAVED_TRANSPORTS = 'saved_transports_history';

// In-memory cache for ultra-fast API baseURL resolution
let cachedApiUrl = null;

export const getCachedApiUrl = () => cachedApiUrl;
export const setCachedApiUrl = (url) => { cachedApiUrl = url; };

/**
 * Retrieve saved list of transports scanned / used on this device
 */
export const getSavedTransports = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SAVED_TRANSPORTS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.error('Failed to get saved transports list:', err);
  }
  return [];
};

/**
 * Retrieve active transport configuration
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
 * Save active transport configuration and add to scanned history in memory
 */
export const setTransportConfig = async (config) => {
  try {
    if (!config || !config.apiUrl) {
      throw new Error('Invalid transport config: apiUrl is required');
    }

    // Clean up trailing slash & standard API path
    let cleanUrl = config.apiUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.includes('/api/')) {
      cleanUrl = `${cleanUrl}/api/v1`;
    }

    const payload = {
      code: (config.code || 'CUSTOM').toUpperCase(),
      name: config.name || 'Transport Partner',
      apiUrl: cleanUrl,
      description: config.description || 'Scanned Transport Connection',
      color: config.color || '#2563eb',
      updatedAt: new Date().toISOString()
    };

    // Save active transport
    await AsyncStorage.setItem(STORAGE_KEY_TRANSPORT, JSON.stringify(payload));
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, payload.apiUrl);
    cachedApiUrl = payload.apiUrl;

    // Update saved transports history
    try {
      const savedList = await getSavedTransports();
      const updatedList = [
        payload,
        ...savedList.filter(item => item.apiUrl !== payload.apiUrl && item.code !== payload.code)
      ];
      await AsyncStorage.setItem(STORAGE_KEY_SAVED_TRANSPORTS, JSON.stringify(updatedList));
    } catch (histErr) {
      console.warn('Failed to update transport history:', histErr);
    }

    return payload;
  } catch (err) {
    console.error('Failed to save transport config:', err);
    throw err;
  }
};

/**
 * Remove a single transport from saved history
 */
export const removeSavedTransport = async (codeOrUrl) => {
  try {
    const savedList = await getSavedTransports();
    const filtered = savedList.filter(
      item => item.code !== codeOrUrl && item.apiUrl !== codeOrUrl
    );
    await AsyncStorage.setItem(STORAGE_KEY_SAVED_TRANSPORTS, JSON.stringify(filtered));

    // If current active transport was deleted, clear active config
    const current = await getTransportConfig();
    if (current && (current.code === codeOrUrl || current.apiUrl === codeOrUrl)) {
      await clearTransportConfig();
    }
  } catch (err) {
    console.error('Failed to remove saved transport:', err);
  }
};

/**
 * Remove active transport configuration
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
 * Wipe all transport data completely (fresh state)
 */
export const clearAllTransportData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_TRANSPORT);
    await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
    await AsyncStorage.removeItem(STORAGE_KEY_SAVED_TRANSPORTS);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    cachedApiUrl = null;
  } catch (err) {
    console.error('Failed to clear all transport data:', err);
  }
};

/**
 * Parse data scanned from QR code or entered manually
 * Supports:
 * 1. JSON payload: { "code": "LIFE", "name": "Life Transport", "apiUrl": "https://..." }
 * 2. Full URL string: https://api.lifetransport.ssquareg.com/api/v1
 * 3. Domain or IP address: e.g. api.lifetransport.ssquareg.com or 192.168.1.5:8000
 */
export const parseQRData = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    throw new Error('Invalid QR code data. Please scan a valid Transport QR code.');
  }

  const trimmed = rawData.trim();

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.apiUrl) {
        return {
          code: (parsed.code || 'QR_TRANSPORT').toUpperCase(),
          name: parsed.name || 'Transport Partner',
          apiUrl: parsed.apiUrl,
          color: parsed.color || '#2563eb'
        };
      }
    } catch (e) {
      // not valid JSON, proceed to other checks
    }
  }

  // 2. Check if it's an HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let name = 'Transport Partner';
    try {
      const match = trimmed.match(/https?:\/\/(?:api\.)?([^\/\.]+)/i);
      if (match && match[1]) {
        name = match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' Transport';
      }
    } catch (e) {}

    return {
      code: 'CUSTOM',
      name: name,
      apiUrl: trimmed,
      color: '#2563eb'
    };
  }

  // 3. Check if it looks like a domain or host with port (e.g. transport.example.com or 10.0.2.2:8000)
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    const fullUrl = `https://${trimmed}`;
    let name = 'Custom Transport';
    try {
      const match = trimmed.match(/(?:api\.)?([^\/\.]+)/i);
      if (match && match[1]) {
        name = match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' Transport';
      }
    } catch (e) {}

    return {
      code: 'CUSTOM',
      name: name,
      apiUrl: fullUrl,
      color: '#2563eb'
    };
  }

  throw new Error('Unrecognized QR code or API format. Please scan a valid QR code or enter a full API URL.');
};
