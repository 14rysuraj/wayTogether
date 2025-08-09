import { View,Text,SafeAreaView,TouchableOpacity,Image,FlatList,TextInput,Alert,} from "react-native";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import GoogleTextInput from "@/components/GoogleTextInput";
import ReactNativeModal from "react-native-modal";
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import tripStore from "@/store/trip";
import tripDataStore from "@/store/tripData";
import axios from "axios";
import socket from "@/constants/socket";
import ImageViewing from 'react-native-image-viewing';
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { setProfileData } from "@/scripts/profleData";
import profileStore from "@/store/profile";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  
  const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  const trip = tripStore((state) => state.trip);
  const setTrip = tripStore((state) => state.setTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const [hasPermission, setHasPermission] = useState(false);
  const [showJoinTrip, setShowJoinTrip] = useState(false);
  const [tripPassword, setTripPassword] = useState("");
  const [tripId, setTripId] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const profile=profileStore((state: any) => state.profile);



 const [visible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<{ uri: string }[]>([]);

  const openImageViewer = (images: string[], index: number) => {
    const formatted = images.map((img) => ({ uri: `data:image/jpeg;base64,${img}` }));
    setCurrentImages(formatted);
    setImageIndex(index);
    setIsVisible(true);
  };



    const [showAddPost, setShowAddPost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState("");


  


const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true, // Set to true to get base64 data
    allowsMultipleSelection: true,
    quality: 0.7,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    // Extract base64 strings from assets
    const base64Images = result.assets
      .map((asset) => asset.base64)
      .filter((b64): b64 is string => typeof b64 === "string");
    setPostImages([...postImages, ...base64Images]);
  }
};


  // Add post handler
const handleAddPost = async () => {
  if (!postContent.trim()) {
    alert("Post content cannot be empty");
    return;
  }
  setPosting(true);
  try {
    const formData = new FormData();
    formData.append("content", postContent);
    postImages.forEach((img, idx) => {
      formData.append("photo", {
        uri: `data:image/jpeg;base64,${img}`,
        name: `photo${idx}.jpg`,
        type: "image/jpeg",
      } as any);
    });

    await axios.post(
      `${API_BASE_URL}/create`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    setShowAddPost(false);
    setPostContent("");
    setPostImages([]);
    // Refresh posts
    const response = await axios.get(`${API_BASE_URL}/allPost`);
    setPosts(response.data?.post || []);
  } catch (err) {
    alert("Failed to add post");
  }
  setPosting(false);
};
  

  // Socket setup
  useEffect(() => {
     setProfileData();

  
    socket.on("trip:notification", (data) => {
      console.log("Trip notification", data);
      alert(data.message);
    });

    return () => {
     
      socket.off("trip:notification");
      socket.disconnect();
    };
  }, []);


   const fetchPosts = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/allPost`);
          setPosts(response.data?.post || []);
        } catch (error) {
          console.log("Error fetching posts:", error);
        }
      };


  // Fetch Posts
  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [])
  );

  // Fetch running trip
  useEffect(() => {
    const fetchRunningTrip = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/getRunningTrip`);
        if (response.data)
        {
          setRunningTrip(response.data);
        }
       
      } catch (err) {
        console.log("Error fetching running trip:", err);
      }
    };

    fetchRunningTrip();
 
  }, []);


  const onRefresh = async () => {
  setRefreshing(true);
  await fetchPosts();
  setRefreshing(false);
};



 

  // Get current user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setTrip({
        location: {
          userLatitude: location.coords.latitude,
          userLongitude: location.coords.longitude,
          userAddress: address?.[0]?.name || "",
          destinationLatitude: 0,
          destinationLongitude: 0,
          destinationAddress: "",
        },
      });
    })();
  }, []);

  const handleCreateTrip = () => {
    if (!trip.location.destinationAddress) {
      alert("Please enter destination Location");
      return;
    }
    router.push("/(root)/create_trip");
  };

  const handleJoinTrip = async () => {
    if (!tripPassword) {
      alert("Please enter trip password");
      return;
    }

    const tripData = {
      tripId: tripId,
      password: tripPassword,
      rider: {  
        latitude: trip.location.userLatitude,
        longitude: trip.location.userLongitude,
        address: trip.location.userAddress,
      },
    };

    try {
      const response=await axios.post(`${API_BASE_URL}/joinTrip`, tripData, {
        headers: { "Content-Type": "application/json" },
      });


      if (response.data)
      {
        socket.emit("join-room", tripId.toString());

      }

     

      setShowJoinTrip(false);
      router.push("/(root)/(tabs)/rides");
    } catch (error: any) {
      console.log("Error joining trip:", error);
      alert(error?.response?.data?.message || "Failed to join trip");
    }
  };

  const handleUserClick = async (userId: string) => {
    if (!userId) {
      alert("User information not available");
      return;
    }
    
    try {
      setUserDetailsLoading(true);
      setSelectedUser(null);
      setShowUserDetails(true);
      
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setSelectedUser(response.data.user);
      } else {
        alert("Failed to fetch user details");
        setShowUserDetails(false);


      
      }
    } catch (error: any) {
      console.log("Error fetching user details:", error);
      alert("Failed to fetch user details");
      setShowUserDetails(false);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!postId) {
      Alert.alert("Error", "Invalid post ID");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPost(postId);
              const token = await AsyncStorage.getItem('userToken');
              const response = await axios.delete(`${API_BASE_URL}/deletePost/${postId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (response.data.success) {
                // Remove the post from the local state
                setPosts(posts.filter(post => post._id !== postId));
                Alert.alert("Success", "Post deleted successfully");
              } else {
                Alert.alert("Error", response.data.message || "Failed to delete post");
              }
            } catch (error: any) {
              console.log("Error deleting post:", error);
              if (error.response?.status === 403) {
                Alert.alert("Error", "You can only delete your own posts");
              } else if (error.response?.status === 404) {
                Alert.alert("Error", "Post not found");
              } else {
                Alert.alert("Error", error.response?.data?.message || "Failed to delete post");
              }
            } finally {
              setDeletingPost(null);
            }
          }
        }
      ]
    );
  };

  const handleEditPost = (post: any) => {
    setEditPostContent(post.content);
    setEditingPost(post._id);
    setShowPostMenu(null);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editPostContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(`${API_BASE_URL}/updatePost/${postId}`, {
        content: editPostContent
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        // Update the post in the local state
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, content: editPostContent }
            : post
        ));
        setEditingPost(null);
        setEditPostContent("");
        Alert.alert("Success", "Post updated successfully");
      } else {
        Alert.alert("Error", response.data.message || "Failed to update post");
      }
    } catch (error: any) {
      console.log("Error updating post:", error);
      if (error.response?.status === 403) {
        Alert.alert("Error", "You can only edit your own posts");
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "Post not found");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Failed to update post");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditPostContent("");
  };

  // Close menu when clicking outside
  const handleCloseMenu = () => {
    setShowPostMenu(null);
  };




  return (
 
        <SafeAreaView className="bg-general-500 px-4 py-10 flex-1">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={handleCloseMenu}
            className="flex-1"
          >
          {/* Header */}
          <View className="flex flex-row justify-between items-center px-4 py-2">
            <View className="flex flex-row items-center">
           
            
            {
              profile?.profile ?
              <Image source={{ uri: `data:image/jpeg;base64,${profile.profile}` }}
              className="h-12 w-12 rounded-full"
                   resizeMode="contain"
             /> :<Image source={icons.profile}/>
        }

        
              <View className="ml-5">
                <Text className="text-xl font-Jakarta font-semibold">Welcome</Text>
                <Text className="text-black">
                  {profile?.name || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <Image source={icons.notification} className="h-8 w-8" />
            </TouchableOpacity>
          </View>

          {/* Destination Input */}
          <View className="flex flex-row items-center justify-center my-10 relative z-50 rounded-xl">
            <GoogleTextInput
              icon={icons.map}
              containerStyle="bg-neutral-100"
              textInputBackgroundColor="transparent"
              handlePress={(location) =>
                setTrip({
                  location: {
                    ...trip.location,
                    destinationLatitude: location.latitude,
                    destinationLongitude: location.longitude,
                    destinationAddress: location.address,
                  },
                })
              }
            />
          </View>

          {/* Action Buttons */}
          <View className="flex flex-row justify-between px-4 gap-2">
            <CustomButton title="Create Trip" className="w-1/2 rounded-lg" onPress={handleCreateTrip} />
            <CustomButton title="Join Trip" className="w-1/2 rounded-lg" onPress={() => setShowJoinTrip(true)} />
          </View>

          {/* Latest Posts */}
      <View className="mt-8 flex-1">
        

        <View className="flex flex-row justify-between">

 <Text className="px-4 mb-4 text-xl font-JakartaSemiBold">Latest Posts</Text>
         <TouchableOpacity
            className="px-4 mb-4"
            onPress={() => setShowAddPost(true)}
          >
            <Text>Add post</Text>
          </TouchableOpacity>

        </View>
       
 <FlatList
        data={posts || []}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        renderItem={({ item }) => (
          <View className="bg-white mx-4 mb-4 p-4 rounded-2xl shadow-sm">
            {/* User Info */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Image
                  source={icons.profile}
                  className="h-10 w-10 rounded-full mr-3"
                  resizeMode="cover"
                />
                <View>
                  <TouchableOpacity 
                    onPress={() => handleUserClick(item.userId?._id)}
                    activeOpacity={0.7}
                  >
                    <Text className="font-JakartaSemiBold text-base text-blue-600 underline">
                      {item.userId?.name ||
                        item.userId?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                        'User'}
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              {/* Three-dot menu - Only show for post creator */}
              {item.userId?._id && profile?._id && item.userId._id === profile._id && (
                <View className="relative">
                  <TouchableOpacity
                    onPress={() => setShowPostMenu(showPostMenu === item._id ? null : item._id)}
                    className="p-2"
                  >
                    <Text className="text-gray-600 text-lg">⋯</Text>
                  </TouchableOpacity>
                  
                  {/* Dropdown Menu */}
                  {showPostMenu === item._id && (
                    <View className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[120px]">
                      <TouchableOpacity
                        onPress={() => handleEditPost(item)}
                        className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                      >
                        <Text className="text-blue-600 text-sm font-medium">✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowPostMenu(null);
                          handleDeletePost(item._id);
                        }}
                        disabled={deletingPost === item._id}
                        className="px-4 py-3 active:bg-gray-50"
                      >
                        <Text className={`text-red-600 text-sm font-medium ${deletingPost === item._id ? 'opacity-50' : ''}`}>
                          {deletingPost === item._id ? '⏳ Deleting...' : '🗑️ Delete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Post Content */}
            {editingPost === item._id ? (
              <View className="mb-3">
                <TextInput
                  value={editPostContent}
                  onChangeText={setEditPostContent}
                  multiline
                  className="border border-gray-300 rounded-lg p-3 text-gray-800 leading-5"
                  placeholder="Edit your post..."
                />
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => handleSaveEdit(item._id)}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-sm font-medium">Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    className="bg-gray-300 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-gray-700 text-sm font-medium">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text className="text-gray-800 mb-3 leading-5">{item.content}</Text>
            )}

            {/* Images */}
           {item.images && item.images.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {item.images.map((img: string, idx: number) => (
           <TouchableOpacity
                    key={idx}
                    onPress={() => openImageViewer(item.images, idx)}
                    activeOpacity={0.8}
                  >
              <Image
                
                      source={{ uri: `data:image/jpeg;base64,${img}` }}
                       className="h-32 w-32 rounded-lg"
              resizeMode="cover"
                    />
                  </TouchableOpacity>
          ))}
        </View>
      )}
          </View>
        )}
        />
        
               <ImageViewing
        images={currentImages}
        imageIndex={imageIndex}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
      />

      </View>
      


        <ReactNativeModal
        isVisible={showAddPost}
        onBackdropPress={() => setShowAddPost(false)}
        onBackButtonPress={() => setShowAddPost(false)}
      >
        <View className="bg-white rounded-2xl p-5">
          <Text className="text-2xl font-JakartaSemiBold mb-2">Add Post</Text>
          <TextInput
            placeholder="What's on your mind?"
            value={postContent}
            onChangeText={setPostContent}
            multiline
            className="border border-gray-200 rounded-lg p-2 mb-3 min-h-[80px]"
          />
          {/* Image preview */}
          <View className="flex-row flex-wrap mb-2">
            {postImages.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: `data:image/jpeg;base64,${img}` }}
                className="h-16 w-16 rounded mr-2 mb-2"
              />
            ))}
          </View>
          <View className="flex-row gap-2">
            <CustomButton
              title="Pick Image"
              className="flex-1"
              onPress={pickImage}
            />
            <CustomButton
              title={posting ? "Posting..." : "Post"}
              className="flex-1"
              onPress={handleAddPost}
              disabled={posting}
            />
          </View>
        </View>
      </ReactNativeModal>





          {/* Join Trip Modal */}
          <ReactNativeModal
            isVisible={showJoinTrip}
            onBackdropPress={() => setShowJoinTrip(false)}
            onBackButtonPress={() => setShowJoinTrip(false)}
          >
            <View className="bg-white rounded-2xl p-5">
          <Text className="text-2xl font-JakartaSemiBold mb-2">Join Trip</Text>
           <InputField
                label="Trip ID"
                placeholder="Enter Trip Password"
                icon={icons.lock}
                onChangeText={setTripId}
              />
              <InputField
                label="Password"
                placeholder="Enter Trip Password"
                icon={icons.lock}
                onChangeText={setTripPassword}
              />
              <CustomButton title="Join" className="mt-6" onPress={handleJoinTrip} />
            </View>
          </ReactNativeModal>

          {/* User Details Modal */}
          <ReactNativeModal
            isVisible={showUserDetails}
            onBackdropPress={() => setShowUserDetails(false)}
            onBackButtonPress={() => setShowUserDetails(false)}
          >
            <View className="bg-white rounded-2xl p-5 max-h-[80%]">
              <Text className="text-2xl font-JakartaSemiBold mb-4 text-center">User Details</Text>
              
              {userDetailsLoading ? (
                <View className="items-center py-8">
                  <Text className="text-gray-500">Loading user details...</Text>
                </View>
              ) : selectedUser ? (
                <View className="space-y-4">
                  {/* User Avatar and Name */}
                  <View className="items-center mb-4">

                  <Image source={{ uri: `data:image/jpeg;base64,${selectedUser.profile}` }}
          className="h-32 w-32 rounded-full"
              resizeMode="contain"
        />
                    <Text className="text-xl font-JakartaSemiBold">
                      {selectedUser.name || 'Unknown User'}
                    </Text>
                    <Text className="text-gray-500">
                      {selectedUser.email}
                    </Text>
                  </View>

                  {/* User Stats */}
                  <View className="bg-gray-50 rounded-lg p-4">
                    <Text className="font-JakartaSemiBold mb-2">User Information</Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Name:</Text>
                        <Text className="font-medium">{selectedUser.name || 'Not provided'}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Email:</Text>
                        <Text className="font-medium">{selectedUser.email}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Member Since:</Text>
                        <Text className="font-medium">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Status:</Text>
                        <Text className="font-medium text-green-600">
                          {selectedUser.isVerified ? '✅ Verified' : '❌ Not Verified'}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">User ID:</Text>
                        <Text className="font-medium text-xs">{selectedUser._id}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Trip Statistics */}
                  <View className="bg-blue-50 rounded-lg p-4">
                    <Text className="font-JakartaSemiBold mb-2 text-blue-800">🚗 Trip Statistics</Text>
                    {selectedUser.tripStats ? (
                      <View className="space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-blue-600">✅ Completed Trips:</Text>
                          <Text className="font-medium text-blue-800">
                            {selectedUser.tripStats.completedTrips || 0}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-blue-600">🎯 Trips Created:</Text>
                          <Text className="font-medium text-blue-800">
                            {selectedUser.tripStats.createdTrips || 0}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-blue-600">👥 Total Trips Joined:</Text>
                          <Text className="font-medium text-blue-800">
                            {selectedUser.tripStats.totalTrips || 0}
                          </Text>
                        </View>
                        {selectedUser.tripStats.totalTrips > 0 && (
                          <View className="flex-row justify-between">
                            <Text className="text-blue-600">📊 Completion Rate:</Text>
                            <Text className="font-medium text-blue-800">
                              {Math.round((selectedUser.tripStats.completedTrips / selectedUser.tripStats.totalTrips) * 100)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text className="text-blue-600 text-center py-2">No trip data available</Text>
                    )}
                  </View>

                  {/* Close Button */}
                  <CustomButton 
                    title="Close" 
                    className="mt-4" 
                    onPress={() => setShowUserDetails(false)} 
                  />
                </View>
              ) : (
                <View className="items-center py-8">
                  <Text className="text-gray-500">No user details available</Text>
                  <CustomButton 
                    title="Close" 
                    className="mt-4" 
                    onPress={() => setShowUserDetails(false)} 
                  />
                </View>
              )}
            </View>
          </ReactNativeModal>
          </TouchableOpacity>
        </SafeAreaView>

  );
};

export default Home;