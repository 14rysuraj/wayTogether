import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
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

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { icons } from "@/constants";

const Rides = () => {
  const mapRef = useRef<MapView>(null);
  const lastLocationRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [yourLocation, setYourLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [riderDistances, setRiderDistances] = useState<any[]>([]);
   const [selectedRider, setSelectedRider] = useState<any>(null);

  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const clearRunningTrip = tripDataStore((state: any) => state.clearRunningTrip);

  const { user } = useUser();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) socket.emit("get-trip", user.id);
    }, [user?.id, runningTrip])
  );

  useEffect(() => {
    socket.connect();

    const handleTripData = (data: any) => {
      setRunningTrip(data);
    };

    const handleLocationUpdate = (updatedTrip: any) => {
      if (!runningTrip || updatedTrip._id === runningTrip._id) {
        setRunningTrip(updatedTrip);
      }
    };

    socket.on("connect", () => {
      console.log("Connected to server", user?.emailAddresses[0]?.emailAddress);
      socket.emit("get-trip", user?.id);
    });

    socket.on("trip-data", handleTripData);
    socket.on("locationUpdate", handleLocationUpdate);

    return () => {
      socket.off("connect");
      socket.off("trip-data", handleTripData);
      socket.off("locationUpdate", handleLocationUpdate);
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

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
      riderId: user?.id,
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
  }, [runningTrip, user?.id]);

  const handleLeaveTrip = async () => {
    try {
      socket.emit("leave-trip", {
        tripId: runningTrip?._id,
        userId: user?.id,
        email:user?.emailAddresses[0].emailAddress
      });
      console.log("Leaving trip:", runningTrip?._id);
      clearRunningTrip();
    } catch (error) {
      console.error("Failed to leave trip:", error);
    }
  };

useEffect(() => {
  if (!yourLocation || !runningTrip?.riders?.length) return;

  const updatedDistances = runningTrip.riders
    .filter(
      (r: any) =>
        r.id !== user?.id &&
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

  if (!yourLocation || !runningTrip) {
    return (
      <View style={styles.center}>
        <Text>No trip created or joined</Text>
      </View>
    );
  }

  const destination = {
    latitude: runningTrip.location.destinationLatitude,
    longitude: runningTrip.location.destinationLongitude,
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
        <Marker coordinate={initialRegion} title="Your Location" />
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
              strokeColor="purple"
              // lineDashPattern={[10, 10]}
            />
          )}

        {runningTrip?.riders?.map((rider: any) => {
          if (rider.id === user?.id || !rider.latitude || !rider.longitude) return null;
          return (
            <Marker
              key={rider.id}
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
            r.id !== user?.id &&
            r.latitude !== undefined &&
            r.longitude !== undefined
        )
        .map((rider: any, index: number) => (
          <TouchableOpacity
            key={rider.id}
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