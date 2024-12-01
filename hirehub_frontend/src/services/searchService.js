import axios from 'axios';

const searchService = {
  searchProfiles: async (query) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search-profiles/`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default searchService; 