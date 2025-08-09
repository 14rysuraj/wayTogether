import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export const debugTripIssues = async () => {
  console.log('=== Trip Debug Information ===');
  
  try {
    // Check if user token exists
    const token = await AsyncStorage.getItem('userToken');
    console.log('User token exists:', !!token);
    
    if (!token) {
      console.log('❌ No user token found - user not authenticated');
      return;
    }
    
    // Test authentication
    try {
      const authResponse = await axios.get(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ Authentication working:', authResponse.data.success);
    } catch (error: any) {
      console.log('❌ Authentication failed:', error.response?.data);
    }
    
    // Test getRunningTrip endpoint
    try {
      const tripResponse = await axios.get(`${API_BASE_URL}/getRunningTrip`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ getRunningTrip response:', tripResponse.data);
    } catch (error: any) {
      console.log('❌ getRunningTrip failed:', error.response?.data);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
};
