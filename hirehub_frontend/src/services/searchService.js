import axios from 'axios';
import API_BASE_URL from config;
const searchService = {
  searchProfiles: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-profiles/`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default searchService; 