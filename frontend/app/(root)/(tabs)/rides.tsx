import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE,AnimatedRegion } from "react-native-maps";
import React, { useEffect, useRef, useState } from "react";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import socket from "@/constants/socket";
import tripDataStore from "@/store/tripData";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { icons } from "@/constants";
import profileStore from "@/store/profile";
import tripStore from "@/store/trip";

const Rides = () => {
  const mapRef = useRef<MapView>(null);
  const lastLocationRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [yourLocation, setYourLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [riderDistances, setRiderDistances] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const profile = profileStore((state: any) => state.profile);
  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const clearRunningTrip = tripDataStore((state: any) => state.clearRunningTrip);
  const yourMarkerRef = useRef<any>(null);
  const tripData=tripStore((state:any)=>state.initialTrip)

 useEffect(() => {
  if (yourMarkerRef.current && yourLocation) {
    // Only animate on Android
    if (Platform.OS === "android") {
      yourMarkerRef.current.animateMarkerToCoordinate(yourLocation, 5000);
    }
  }
}, [yourLocation]);
  

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;




  useEffect(() => {

    // const handleTripData = (data: any) => {
    //   setRunningTrip(data.trip);
    //   alert(data.message);
    // };




  



    const handleLocationUpdate = (updatedTrip: any) => {
      if (!runningTrip || updatedTrip._id === runningTrip._id) {
        setRunningTrip(updatedTrip);
      }
    };

   
    socket.on("locationUpdate", handleLocationUpdate);

   
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

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
      setYourLocation({
        latitude: location.coords.latitude,
        longitude:location.coords.longitude
      })
    });



    const startLocationUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
    

      setHasPermission(true);

    locationSubscription = await Location.watchPositionAsync(
  {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 10,
    timeInterval: 10000,
  },
  (location) => {
    const { latitude, longitude } = location.coords;
    const last = lastLocationRef.current;

    if (
      last &&
      Math.abs(latitude - last.latitude) < 0.0001 &&
      Math.abs(longitude - last.longitude) < 0.0001
    ) {
      return;
    }

    lastLocationRef.current = { latitude, longitude };
    setYourLocation({ latitude, longitude });

    socket.emit("update-location", {
      tripId: runningTrip?._id,
      riderId: profile._id,
      latitude,
      longitude,
    });

    setIsLoading(false);
  }
    );
      
    
    };


    if (runningTrip) startLocationUpdates();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  const handleLeaveTrip = async () => {
    try {
      const tripId = runningTrip?._id;
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.post(`${API_BASE_URL}/leave-trip`, { tripId }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
     });
      if(response.status === 200) {
        socket.emit("leave-room", tripId.toString());
        console.log("leaving room " + tripId.toString());
        clearRunningTrip();
      }
      else {
        console.error("Failed to leave trip:", response.data);
      }
    } catch (error) {
      console.error("Failed to leave trip:", error);
    }
  };






    const fetchRunningTrip = async () => {
      try {
        setIsLoadingTrip(true);
    
        const res = await axios.get(`${API_BASE_URL}/getRunningTrip`, 
          
        );
        if (res.data) {
          setRunningTrip(res.data);
          setIsLoadingTrip(false);
        }
      } catch (e: any) {
        console.log("Error fetching running trip", e);
        if (e.response?.status === 400) {
          // No active trip found, this is expected
          setRunningTrip(null);
        }
      } finally {
        setIsLoadingTrip(false);
      }
    }



  
  useEffect(() => {
    fetchRunningTrip();
  },[])

  // Refresh trip data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRunningTrip();
    }, [])
  );
    


  


  

useEffect(() => {
  if (!yourLocation || !runningTrip?.riders?.length) return;

  const updatedDistances = runningTrip.riders
    .filter(
      (r: any) =>
        r._id !== profile._id &&
        r.latitude !== undefined &&
        r.longitude !== undefined
    )
    .map((r: any) => {
      const distance = getHaversineDistance(
        yourLocation,
        { latitude: r.latitude, longitude: r.longitude }
      );
      return {
        name: r.name || r.email || "Unknown",
        distance: distance.toFixed(2), // km with 2 decimals
      };
    });

  // Only update if changed
  if (
    JSON.stringify(updatedDistances) !== JSON.stringify(riderDistances)
  ) {
    setRiderDistances(updatedDistances);
  }
}, [yourLocation, runningTrip]);
  // riderDistances

 if (isLoadingTrip) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
        Loading trip data...
      </Text>
    </View>
  );
}

 if (!runningTrip) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 }}>
        No trip created or joined
      </Text>
      <Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
        Create a new trip or join an existing one to get started
      </Text>
    </View>
  );
}

 if (!yourLocation) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
        Getting your location...
      </Text>
    </View>
  );
}

  const destination = {
    latitude: runningTrip?.location.destinationLatitude,
    longitude: runningTrip?.location.destinationLongitude,
  };

  const initialRegion = {
    latitude: yourLocation.latitude,
    longitude: yourLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };



  const centerMapOnRider = (latitude: number, longitude: number,rider:any) => {
      setSelectedRider(rider);
  mapRef.current?.animateToRegion(
    {
      latitude,
      longitude,
      latitudeDelta: 0.01, // Zoom in closer to the marker
      longitudeDelta: 0.01,
    },
    900
  );
  };
  
  const centerMapOnMe = () => {
    if (yourLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: yourLocation.latitude,
          longitude: yourLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
      setSelectedRider(null)
    }
  };




    


  return (
    
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 48,
          right: 20,
          zIndex: 50,
          backgroundColor: "white",
          padding: 12,
          borderRadius: 24,
          elevation: 4,
        }}
        onPress={handleLeaveTrip}
      >
        <Text>Leave Trip</Text>
        </TouchableOpacity>
        

     
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        style={[styles.map, { marginBottom: 80 }]}
        followsUserLocation
        initialRegion={initialRegion}
      >
        <Marker
  ref={yourMarkerRef}
  coordinate={yourLocation}
  title="Your Location"
  pinColor="blue"
/>
        {destination && <Marker coordinate={destination} title="Destination" />}

        <MapViewDirections
          apikey={GOOGLE_API_KEY}
          origin={initialRegion}
          destination={destination}
          strokeWidth={6}
          strokeColor="blue"
          optimizeWaypoints
          precision="high"
          />
          



             {selectedRider && selectedRider.latitude && selectedRider.longitude && (
            <MapViewDirections
              apikey={GOOGLE_API_KEY}
              origin={yourLocation}
              destination={{
                latitude: selectedRider.latitude,
                longitude: selectedRider.longitude,
              }}
              strokeWidth={6}
              strokeColor="green"
              lineDashPattern={[10, 10]}
              precision="high"
            />
          )}

        {runningTrip?.riders?.map((rider: any) => {
          if (rider._id===profile._id || !rider.latitude || !rider.longitude) return null;
          return (
            <Marker
              key={rider._id}
              coordinate={{
                latitude: rider.latitude,
                longitude: rider.longitude,
              }}
              title={`Rider: ${rider.name || rider.email}`}
              pinColor="red"
            />
          );
        })}
      </MapView>

<BottomSheet ref={bottomSheetRef} index={0} snapPoints={["12%", "25%", "40%"]}>
  <BottomSheetView style={{ padding: 16 }}>
    {/* Center on Me Icon Button */}
    <TouchableOpacity
      onPress={centerMapOnMe}
      style={{
        alignSelf: "flex-end",
        marginBottom: 8,
        backgroundColor: "#f1f1f1",
        borderRadius: 20,
        padding: 8,
      }}
      accessibilityLabel="Center map on me"
    >
      <MaterialIcons name="my-location" size={24} color="#007AFF" />
    </TouchableOpacity>

    <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
      Riders & Distance
    </Text>

    {riderDistances.length === 0 ? (
      <Text style={{ fontStyle: "italic", color: "gray" }}>
        No other riders found.
      </Text>
    ) : (
      runningTrip?.riders
        ?.filter(
          (r: any) =>
            r._id !== profile._id &&
            r.latitude !== undefined &&
            r.longitude !== undefined
        )
        .map((rider: any, index: number) => (
          <TouchableOpacity
            key={rider._id}
            onPress={() => centerMapOnRider(rider.latitude, rider.longitude,rider)}
            style={{
              backgroundColor: "#f1f1f1",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "500", fontSize: 15 }}>
              🧍 {rider.name || rider.email || "Unknown"}
            </Text>
            <Text style={{ fontSize: 14, color: "#333" }}>
              📍
              {getHaversineDistance(
                yourLocation,
                { latitude: rider.latitude, longitude: rider.longitude }
              ).toFixed(2)}{" "}
              km
            </Text>
          </TouchableOpacity>
        ))
    )}
  </BottomSheetView>
</BottomSheet>

      </View>
      </GestureHandlerRootView>
  );
};


function getHaversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
) {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;

  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}




const styles = StyleSheet.create({
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Rides;