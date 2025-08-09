import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { UserProfile } from '@clerk/clerk-react'
import AsyncStorage from "@react-native-async-storage/async-storage";
import profileStore from '@/store/profile';
import axios from 'axios';
import ReactNativeModal from 'react-native-modal';
import CustomButton from '@/components/CustomButton';
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import { setProfileData } from '@/scripts/profleData';

const Profile = () => {

  const { user } = useUser();
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  
  // State for modals and data
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTripHistory, setShowTripHistory] = useState(false);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripHistoryLoading, setTripHistoryLoading] = useState(false);
  const [profileImage,setProfileImage] = useState("");
  
  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const profile = profileStore((state: any) => state.profile);
  const setProfile = profileStore((state: any) => state.setProfile);
  const [tripStats, setTripStats] = useState<any>(null);
 



  // Initialize edit form when profile data is available
  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  // Fetch trip statistics
  useEffect(() => {
    const fetchTripStats = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.success) {
          // Get trip statistics for current user
          const statsResponse = await axios.get(`${API_BASE_URL}/user/${response.data.user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (statsResponse.data.success) {
            setTripStats(statsResponse.data.user.tripStats);
          }
        }
      } catch (error) {
        console.log("Error fetching trip stats:", error);
      }
    };

    fetchTripStats();
  }, []);

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(`${API_BASE_URL}/updateProfile`, {
        name: editForm.name,
        email: editForm.email
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setProfile(response.data.user);
        setShowEditProfile(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", response.data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.log("Error updating profile:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTripHistory = async () => {
    setShowTripHistory(true);
    setTripHistoryLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/userTrips`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTripHistory(response.data.trips || []);
      } else {
        Alert.alert("Error", "Failed to fetch trip history");
      }
    } catch (error: any) {
      console.log("Error fetching trip history:", error);
      Alert.alert("Error", "Failed to fetch trip history");
    } finally {
      setTripHistoryLoading(false);
    }
  };


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
      quality: 0.7,
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      const imageUri = result.assets[0].uri;
  
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile.jpg",
      });
  
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.post(
          `${API_BASE_URL}/updateProfileImage`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
  
        if (response.data.success) {
          Alert.alert("Success", "Profile image updated successfully");
          setProfileData();
        } else {
          Alert.alert("Error", response.data.message || "Failed to update profile image");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message);
      }
    }
  };



  
  

  
  return (

    

    <SafeAreaView style={styles.container}>
      <View style={styles.profileSection}>


        {
          profile?.profile ?
          <Image source={{ uri: `data:image/jpeg;base64,${profile.profile}` }}
          className="h-32 w-32 rounded-full"
              resizeMode="contain"
        />:<Image source={icons.profile}/>
        }
      
        <TouchableOpacity onPress={pickImage}>
         <Text>Edit profile</Text> 
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.name || 'Guest'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        
        {/* Trip Statistics */}
        {tripStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>🚗 Trip Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tripStats.completedTrips || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tripStats.createdTrips || 0}</Text>
                <Text style={styles.statLabel}>Created</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{tripStats.totalTrips || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
            {tripStats.totalTrips > 0 && (
              <Text style={styles.completionRate}>
                Completion Rate: {Math.round((tripStats.completedTrips / tripStats.totalTrips) * 100)}%
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleViewTripHistory}>
          <Text style={styles.buttonText}>View Trip History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <ReactNativeModal
        isVisible={showEditProfile}
        onBackdropPress={() => setShowEditProfile(false)}
        onBackButtonPress={() => setShowEditProfile(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={editForm.name}
            onChangeText={(value) => setEditForm({...editForm, name: value})}
          />

          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            value={editForm.email}
            onChangeText={(value) => setEditForm({...editForm, email: value})}
            editable={false}
          />

          <View style={styles.modalButtons}>
            <CustomButton
              title="Cancel"
              className="flex-1 mr-2"
              onPress={() => setShowEditProfile(false)}
            />
            <CustomButton
              title={loading ? "Saving..." : "Save"}
              className="flex-1 ml-2"
              onPress={handleSaveProfile}
              disabled={loading}
            />
          </View>
        </View>
      </ReactNativeModal>


{/* Profile Image Modal */}




      {/* Trip History Modal */}
      <ReactNativeModal
        isVisible={showTripHistory}
        onBackdropPress={() => setShowTripHistory(false)}
        onBackButtonPress={() => setShowTripHistory(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Trip History</Text>
          
          {tripHistoryLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading trip history...</Text>
            </View>
          ) : tripHistory.length > 0 ? (
            <ScrollView style={styles.tripHistoryList}>
              {tripHistory.map((trip, index) => (
                <View key={trip._id || index} style={styles.tripItem}>
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripName}>{trip.name}</Text>
                    <Text style={[
                      styles.tripStatus,
                      { color: trip.status === 'completed' ? '#10b981' : trip.status === 'running' ? '#3b82f6' : '#ef4444' }
                    ]}>
                      {trip.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.tripDate}>
                    {new Date(trip.startDate).toLocaleDateString()}
                  </Text>

                  <Text style={styles.tripDate}>
                   Total Rider {trip.riders}
                  </Text>

                  <Text style={styles.tripLocation}>
                    From: {trip.location?.userAddress || 'Unknown'}
                  </Text>
                  <Text style={styles.tripLocation}>
                    To: {trip.location?.destinationAddress || 'Unknown'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No trip history found</Text>
            </View>
          )}

          <CustomButton
            title="Close"
            className="mt-4"
            onPress={() => setShowTripHistory(false)}
          />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actions: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginBottom: 15,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  // Modal styles
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tripHistoryList: {
    maxHeight: 400,
  },
  tripItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tripStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  tripDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  tripLocation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  // Statistics styles
  statsContainer: {
    marginTop: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  completionRate: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '500',
  },
});