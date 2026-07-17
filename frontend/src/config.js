export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const parsed = await response.json();
      return parsed;
    } catch (e) {
      console.error('JSON parsing failed:', e);
      throw new Error('Server returned invalid JSON format.');
    }
  }
  
  // If response is OK but not JSON, it is likely an HTML routing fallback
  if (response.ok) {
    try {
      const text = await response.text();
      const snippet = text.substring(0, 150).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      throw new Error(`Expected JSON but received "${contentType}". Content: ${snippet}...`);
    } catch (err) {
      throw new Error(`Expected JSON but received non-JSON response (Content-Type: ${contentType})`);
    }
  }
  
  return {};
};
