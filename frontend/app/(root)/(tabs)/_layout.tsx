

import { icons } from '@/constants';
import { Stack, Tabs } from 'expo-router';
import { Image, ImageSourcePropType, View } from 'react-native';
import { green } from 'react-native-reanimated/lib/typescript/Colors';
import 'react-native-get-random-values';
import React from 'react';
import socket from '@/constants/socket';
import tripDataStore from '@/store/tripData';
import { useEffect } from 'react';
import {useToast} from 'react-native-toast-notifications';
import profileStore from '@/store/profile';


const TabIcon = ({
    source,
    focused,
  }: {
    source: ImageSourcePropType;
    focused: boolean;
  }) => (
    <View
      className={`flex flex-row justify-center items-center rounded-full ${focused ? "bg-black-300" : ""}`}
    >
      <View
        className={` rounded-full w-12 h-12 items-center justify-center ${focused ? "bg-general-400" : ""}`}
      >
        <Image
          source={source}
          tintColor="#0286ff"
          resizeMode="contain"
          className="w-7 h-7"
        />
      </View>
    </View>
  );


export default function Layout() {

  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const setRunningTrip = tripDataStore((state: any) => state.setRunningTrip);
  const toast = useToast();
  const profile=profileStore((state:any)=>state.profile)


  useEffect(() => { 
    
    if (runningTrip?._id)
    {
      socket.emit("join-room", runningTrip._id);
      console.log("Joined trip room:", runningTrip._id);
    }
  
},[runningTrip?._id]);
    

  useEffect(() => {
  const handleTripUpdate = (data: any) => {
    console.log("Trip Update:", data);

    
    toast.show(data.message, { type: "success", duration: 3000 });

    
    setRunningTrip(data.trip);
  };

    socket.on("trip:update", handleTripUpdate);
    socket.on("trip:leave", (data:any) => { 
      toast.show(data.message, { type: "warning", duration: 3000 });
        setRunningTrip(data.trip)
    })

  return () => {
    socket.off("trip:update", handleTripUpdate);
  };
}, []);


  return (
    <Tabs
    initialRouteName="home"
    screenOptions={{
      tabBarActiveTintColor: "white",
      tabBarInactiveTintColor: "white",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "white",
        borderRadius: 10,
       
        overflow: "hidden",
      
        
        height: 78,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        
      },
    }}
  >
          <Tabs.Screen
              name='home'
              options={{
                  title:'Home',
                  headerShown: false,
                  tabBarIcon: ({ focused }) => (
                      <TabIcon source={icons.home} focused={focused } />
                  )
              }} />
          
          <Tabs.Screen
              name='rides'
              options={{
                  title: 'Rides',
                  headerShown: false,
                  tabBarIcon: ({ focused }) => (
                      <TabIcon source={icons.list} focused={ focused} />
                  )
              }}
          />

          <Tabs.Screen
              name='chat'
              options={{
                  title:'Chat',
                  headerShown: false,
                  tabBarIcon: ({ focused }) => (
                      <TabIcon source={icons.chat} focused={focused } />
                  ),
        
                    
                  
                  
              }}
          />

          <Tabs.Screen
              name='profile'
              options={{
                  title: 'Profile',
                  headerShown: false,
                  tabBarIcon: ({ focused }) => (
                      <TabIcon source={icons.profile} focused={focused } />
          
                  )
              }}    
          />
          
      </Tabs>
  );
}


