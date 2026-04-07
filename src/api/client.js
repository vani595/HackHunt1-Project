import { normalizeValidationMessage } from '../utils/validation';

// APNA RENDER URL YAHAN LIKHO
const API_BASE_URL = 'https://hackathon-scrapper-tool.onrender.com/api'; 

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Fetching from:', url);

    try {
      const response = await fetch(url, {
        headers: { 
            'Content-Type': 'application/json', 
            ...(options.headers || {}) 
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Frontend API Error:', error);
      throw error;
    }
  }

  // Hackathons data fetch karne ka function
  async getHackathons(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    const queryString = params.toString();
    return this.request(`/hackathons${queryString ? `?${queryString}` : ''}`);
  }

  async signin(email, password) {
    return this.request('/user/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(payload) {
    return this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new APIClient();