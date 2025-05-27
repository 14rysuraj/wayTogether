import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import React, { useEffect, useRef, useState } from "react";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import socket from "@/constants/socket";
import tripDataStore from "@/store/tripData";

const Rides = () => {
  const mapRef = useRef<MapView>(null);
  const lastLocationRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [yourLocation, setYourLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const clearRunningTrip = tripDataStore(
    (state: any) => state.clearRunningTrip
  );

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
          timeInterval: 1000,
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
      });
      console.log("Leaving trip:", runningTrip?._id);
      clearRunningTrip();
    } catch (error) {
      console.error("Failed to leave trip:", error);
    }
  };

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

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        className="absolute top-12 right-5 z-50 bg-white p-3 rounded-full shadow-md"
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
        style={styles.map}
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

        {runningTrip?.riders?.map((rider: any) => {
          if (rider.id === user?.id || !rider.latitude || !rider.longitude)
            return null;
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
    </View>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Rides;

function startLocationUpdates() {
  throw new Error("Function not implemented.");
}
