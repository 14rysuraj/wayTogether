import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export const validateToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return false;

    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.success;
  } catch (error) {
    console.error('Token validation error:', error);
    await AsyncStorage.removeItem('userToken');
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      await axios.get(`${API_BASE_URL}/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await AsyncStorage.removeItem('userToken');
  }
};
