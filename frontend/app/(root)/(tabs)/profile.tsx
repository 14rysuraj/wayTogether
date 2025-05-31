import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { UserProfile } from '@clerk/clerk-react'

const Profile = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };



  console.log('User imageUrl:', user?.imageUrl);


  
  return (

    

    <SafeAreaView style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{ uri: user?.imageUrl || 'https://i.pravatar.cc/300' }}
          style={styles.avatar}
          className='contain'
        />
        <Text style={styles.name}>{user?.fullName || 'Guest'}</Text>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Trip History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
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
});