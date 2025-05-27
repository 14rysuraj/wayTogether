

import { Stack } from 'expo-router';
import React from 'react';


const Layout=()=> {




  return (
      <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name='create_trip' options={{ headerShown: false }} />

     
        
      </Stack>
  );
}

export default Layout;
