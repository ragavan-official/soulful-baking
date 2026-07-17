export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const parsed = await response.json();
      // Return the parsed value directly (may be array, object, etc.)
      return parsed;
    } catch (e) {
      console.error('JSON parsing failed:', e);
    }
  }
  // Fallback: empty object so data.message is always safe to access
  return {};
};
