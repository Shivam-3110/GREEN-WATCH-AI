import axios from 'axios';

const wasteDetectionAPI = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const detectWaste = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await wasteDetectionAPI.post(
      '/api/v1/waste-detection/detect',
      formData
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to detect waste');
  }
};

export const getSupportedWasteTypes = async () => {
  try {
    const response = await wasteDetectionAPI.get(
      '/api/v1/waste-detection/supported-waste-types'
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch waste types');
  }
};
