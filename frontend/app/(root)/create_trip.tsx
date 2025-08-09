import { View, Text, TouchableOpacity, Image, TextInput } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import tripStore from "@/store/trip";
import tripDataStore from "@/store/tripData";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { icons } from "@/constants";
import { router } from "expo-router";
import MapView, { Marker,  PROVIDER_DEFAULT,  PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet, {
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import GoogleTextInput from "@/components/GoogleTextInput";
import CustomButton from "@/components/CustomButton";
import MapViewDirections from "react-native-maps-directions";
import { useSignIn, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';


const create_trip = () => {

  const trip = tripStore((state) => state.trip);
  const setTrip = tripStore((state) => state.setTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const [isRoute, setIsRoute] = useState<boolean>(false);
  const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [distance, setDistance] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<string | null>(null);
    interface TripDetails {
      name: string;
      password: string;
    }
    const [tripDetails, setTripDetails] = useState<TripDetails>({
      name: "",
      password:"",
    });
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;



  console.log(trip);
  


  const getDistanceMatrix = async () => {
    if (!trip.location) return;

    const origin = `${trip.location.userLatitude},${trip.location.userLongitude}`;
    const dest = `${trip.location.destinationLatitude},${trip.location.destinationLongitude}`;

    const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&key=${googlePlacesApiKey}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      const element = data.rows[0].elements[0];
      if (element.status === "OK") {
        setIsRoute(true);
        setDistance(element.distance.text);
        setDuration(element.duration.text);
      } else {
        console.warn("Distance Matrix API returned error:", element.status);
      }
    } catch (err) {
      console.error("Error fetching distance matrix:", err);
    }
  };

useEffect(() => {
  if (
    trip.location.userLatitude !== 0 &&
    trip.location.userLongitude !== 0 &&
    trip.location.destinationLatitude !== 0 &&
    trip.location.destinationLongitude !== 0
  ) {
    getDistanceMatrix();
  }
}, [
  trip.location.userLatitude,
  trip.location.userLongitude,
  trip.location.destinationLatitude,
  trip.location.destinationLongitude,
]);

  
  

  const handleConfirmTrip = async () => {
    if (!trip.location.destinationAddress) {
      alert("Please enter destination Location");
      return;
    }
    if (!trip.location.userAddress) {
      alert("Please enter user Location");
      return;
    }
    if (!tripDetails.name) {
      alert("Please enter trip name");
      return;
    }
    if (!tripDetails.password) {
      alert("Please enter trip password");
      return;
    }
  
    const tripData = {
      name: tripDetails.name,
      password: tripDetails.password,
      location: {
        userLatitude: trip.location.userLatitude,
        userLongitude: trip.location.userLongitude,
        userAddress: trip.location.userAddress,
        destinationLatitude: trip.location.destinationLatitude,
        destinationLongitude: trip.location.destinationLongitude,
        destinationAddress: trip.location.destinationAddress,
      },
      riders: 
        {
          latitude: trip.location.userLatitude,
          longitude: trip.location.userLongitude,
          address: trip.location.userAddress,
         
        },
      
     
    };
  
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(`${API_BASE_URL}/createTrip`, tripData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log('Trip created:', response.data);
      if (response.data.status===400)
      {
        return alert(response.data.message);
      }

      // Update the trip store with the created trip
      setRunningTrip(response.data);
  
      router.push("/(root)/(tabs)/rides");
    } catch (error:any) {
      console.log('Error creating trip:', error);
      alert(error.response?.data?.message || 'Error creating trip');
    }
  };

  return (
    <GestureHandlerRootView>
      <View className="flex-1 bg-white">
        <View className="flex flex-col h-screen bg-blue-500">
          <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  className="w-6 h-6"
                />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-JakartaSemiBold ml-5">Go Back</Text>
          </View>

          

          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: trip.location.userLatitude,
              longitude: trip.location.userLongitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            loadingEnabled={true}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsTraffic={true}
          >
            <Marker
              coordinate={{
                latitude: trip.location.userLatitude,
                longitude: trip.location.userLongitude,
              }}
               title="Your Location"
    
            />

            <Marker
              coordinate={{
                latitude: trip.location.destinationLatitude,
                longitude: trip.location.destinationLongitude,
              }}
              title="Destination"
              
            />

            

            
{trip.location.userLatitude  &&
 trip.location.userLongitude  &&
 trip.location.destinationLatitude &&
 trip.location.destinationLongitude  && (
              <MapViewDirections
                
    origin={{
      latitude: trip.location.userLatitude,
      longitude: trip.location.userLongitude,
    }}
    destination={{
      latitude: trip.location.destinationLatitude,
      longitude: trip.location.destinationLongitude,
    }}
    apikey={googlePlacesApiKey}
    strokeWidth={6}
      strokeColor="blue"
              
    precision="high"
    onError={(errorMessage) => {
      console.error("MapViewDirections Error:", errorMessage);
    }}
    mode="DRIVING"
              />
)} 
            

          </MapView>
        </View>

        <BottomSheet ref={bottomSheetRef} index={0} snapPoints={["50%", "90%"]}>
          <BottomSheetView className="p-4 gap-4">
            
            <Text className="text-lg font-JakartaSemiBold mb-3">From</Text>

            <GoogleTextInput
              icon={icons.target}
              initialLocation={trip.location.userAddress}
              containerStyle="bg-neutral-100"
              textInputBackgroundColor="transparent"
              handlePress={(location) =>
                setTrip({
                  location: {
                    ...trip.location,
                    userLatitude: location.latitude,
                    userLongitude: location.longitude,
                    userAddress: location.address,
                  },
                })
              }
            />

            <Text className="text-lg font-JakartaSemiBold mb-3">To</Text>

            <GoogleTextInput
              icon={icons.map}
              initialLocation={trip.location.destinationAddress}
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

            <View>
              <Text className="text-lg font-JakartaSemiBold mb-3">
                Trip Details
              </Text>
              <View className="flex flex-row justify-between items-center bg-neutral-100 p-4 rounded-xl">
                <Text className="text-base font-JakartaSemiBold">Distance</Text>
                <Text className="text-base font-JakartaSemiBold">Duration</Text>
              </View>

              <View className="flex flex-row justify-between items-center bg-neutral-100 p-4 rounded-xl mt-2">
               <Text className="text-base font-JakartaSemiBold">
  {distance ?? "--"}
</Text>
<Text className="text-base font-JakartaSemiBold">
  {duration ?? "--"}
</Text>
              </View>

              <View className="flex flex-row justify-between items-center  gap-2  rounded-xl mt-2">
                <TextInput
                  placeholder="Trip name"
                  className="bg-neutral-100 w-1/2  h-14 p-2 text-black rounded-lg"
                  onChangeText={(value)=>setTripDetails({...tripDetails,'name':value})}
                  value={tripDetails.name}
                />

                <TextInput
                  placeholder="Password"
                  className="bg-neutral-100 w-1/2 h-14 p-2 text-black rounded-lg"
                  onChangeText={(value)=>setTripDetails({...tripDetails,'password':value})}
                  value={tripDetails.password}
                />
              </View>
              

              <CustomButton
                title="Confirm Trip"
                className="my-4"
                onPress={handleConfirmTrip}
              />
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default create_trip;
