export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data = {};
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      console.error('JSON parsing failed:', e);
    }
  }
  return data;
};
