import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export const testAuthEndpoints = async () => {
  console.log('Testing authentication endpoints...');
  
  try {
    // Test if the server is running
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('Server health check:', response.data);
  } catch (error) {
    console.error('Server health check failed:', error);
  }
  
  try {
    // Test login endpoint (this will fail with invalid credentials, but should return proper error)
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: 'test@test.com',
      password: 'wrongpassword'
    });
    console.log('Login test response:', response.data);
  } catch (error: any) {
    if (error.response?.data) {
      console.log('Login endpoint working (expected error):', error.response.data);
    } else {
      console.error('Login endpoint error:', error);
    }
  }
};
