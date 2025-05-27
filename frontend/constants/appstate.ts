import { useEffect } from 'react';
import { AppState } from 'react-native';
import socket from './socket';

useEffect(() => {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") {
      socket.disconnect();
    } else {
      socket.connect();
    }
  });

  return () => subscription.remove();
}, []);