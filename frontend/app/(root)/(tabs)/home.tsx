import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useEffect, useState ,useMemo} from "react";
import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useClerk } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import CustomButton from "@/components/CustomButton";
import MapView from "react-native-maps";
import { icons, images } from "@/constants";
import tripStore from "@/store/trip";
import * as Location from "expo-location";
import GoogleTextInput from "@/components/GoogleTextInput";
import ReactNativeModal from "react-native-modal";
import { TextInput } from "react-native-gesture-handler";
import InputField from "@/components/InputField";
import axios from "axios";
import { io } from "socket.io-client";
import socket from "@/constants/socket";




const home = () => {
  const { user } = useUser();
  const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const trip = tripStore((state) => state.trip);
  const setTrip = tripStore((state) => state.setTrip);
  const [showJoinTrip, setShowJoinTrip] = useState<boolean>(false);
  const [tripPassword, setTripPassword] = useState<string>("");
  

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

 




  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
     
    })

    socket.on('trip:notification', (data) => {
      console.log('Trip notification', data);
      alert(data.message)
    });

    return () => {
      socket.off("connect");
      socket.disconnect();
    }

    
    
},[])
  

  useEffect(() => {
    const fetchRunningTrip = async () => {
        try {
          const userId = user?.id;
          if (!user?.id) throw new Error("User ID is not available.");
          const response = await axios.get(
            `${API_BASE_URL}/getRunningTrip/${userId}`,
            {
              params: { userId },
            }
          );
          
        } catch (err: any) {
          
         
        } finally {
         
        }
    };
    fetchRunningTrip();
},[])

  
  

  console.log(tripPassword);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        return;
      }


      let location = await Location.getCurrentPositionAsync({});

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords?.latitude!,
        longitude: location.coords?.longitude!,
      });
      

      setTrip({
        location: {
          userLatitude: location.coords.latitude,
          userLongitude: location.coords.longitude,
          userAddress: address[0].name!,
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
      password: tripPassword,
      rider: {
        id: user?.id ?? '',
        name: user?.firstName ?? '',
        email: user?.emailAddresses[0].emailAddress,
        latitude: trip.location.userLatitude,
        longitude: trip.location.userLongitude,
        address: trip.location.userAddress,
        status: "pending",
      }
      
    }

  
    try {
      const response = await axios.post(`${API_BASE_URL}/joinTrip`, tripData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setShowJoinTrip(false); 
      socket.emit("join-trip", { userId: user?.id, email: user?.emailAddresses[0].emailAddress, password: tripPassword })
    
        
     
       router.push("/(root)/(tabs)/rides");
    } catch (error: any) {
      console.log('Error joining trip:', error);
      alert(error?.response?.data?.message || 'Failed to join trip');
    }
  };




  

  return (
    <KeyboardAvoidingView>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <SafeAreaView className="bg-general-500 h-full px-4 py-10 ">
          {/* header  */}

          <View className=" flex flex-row justify-between items-center px-4 py-2  ">
            <View className="flex flex-row items-center">
              <Image source={icons.profile} className="h-12 w-12" />

              <View className="ml-5">
                <Text className="text-xl font-Jakarta font-semibold">
                  Welcome
                </Text>
                <Text className="text-black">{user?.emailAddresses[0].emailAddress}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Image source={icons.notification} className="h-8 w-8" />
            </TouchableOpacity>
          </View>

          <View
            className={`flex flex-row items-center justify-center  relative z-50 rounded-xl my-10 `}
          >
        
            
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

  


          {/* button  */}
          <View className="flex flex-row items-center justify-between px-4 gap-2    ">
            <CustomButton
              title="Create Trip "
              className="w-1/2 rounded-lg"
              onPress={handleCreateTrip}
            />
            <CustomButton title="Join Trip" className=" rounded-lg w-1/2" onPress={() => setShowJoinTrip(true)} />
          </View>


          <Text className="px-4 my-10 text-xl font-JakartaSemiBold">
            Current Trip
          </Text>
          
          <TouchableOpacity>
            <View className="flex flex-row items-center justify-between  px-4 rounded-xl">
              <Text className=" text-xl  font-JakartaSemiBold">Trip Name</Text>
              <Text className="text-xl font-JakartaSemiBold">Destination</Text>
            </View>

            <View className="flex flex-row items-center justify-between bg-neutral-100 px-4 rounded-xl mt-2">
              <Text className="text-base font-JakartaSemiBold">First Trip</Text>
              <Text className="text-base font-JakartaSemiBold">Pokhara</Text>
            </View>
          </TouchableOpacity>



          <Text className="px-4 my-10 text-xl font-JakartaSemiBold">
            Recent Trip
          </Text>


          <TouchableOpacity>
            <View className="flex flex-row items-center justify-between  px-4 rounded-xl">
              <Text className=" text-xl  font-JakartaSemiBold">Trip Name</Text>
              <Text className="text-xl font-JakartaSemiBold">Destination</Text>
            </View>

            <View className="flex flex-row items-center justify-between bg-neutral-100 px-4 rounded-xl mt-2">
              <Text className="text-base font-JakartaSemiBold">Pokhara Trip</Text>
              <Text className="text-base font-JakartaSemiBold">Pokhara</Text>
            </View>
          </TouchableOpacity>


          <ReactNativeModal
            isVisible={showJoinTrip}
            onBackdropPress={() => setShowJoinTrip(false)}
            onBackButtonPress={() => setShowJoinTrip(false)}
          
          >
            <View className="bg-white  rounded-2xl p-5">
              <Text className="text-2xl font-JakartaSemiBold">Join Trip</Text>
              <InputField label={"password"}
                placeholder="Enter Trip Password"
                icon={icons.lock}
                onChangeText={(value) => setTripPassword(value)}
              
              />
            </View>
            
            <CustomButton
              title="Join"
              className="mt-6"
              onPress={handleJoinTrip}
            />

          </ReactNativeModal>
       
       
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

}


export default home;
