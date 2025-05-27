import { io } from 'socket.io-client';

const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL!;
const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
});

export default socket;