import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import socket from '@/constants/socket';  // your configured socket instance
import tripDataStore from '@/store/tripData';
import profileStore from '@/store/profile';
import { ActivityIndicator } from 'react-native';


type Message = {
  _id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string | number | Date;
};

const Chat = () => {
  const runningTrip = tripDataStore((state: any) => state.runningTrip);
  const profile = profileStore((state: any) => state.profile);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);
  const [loading, setLoading] = useState<Boolean>(false);

  useEffect(() => {
    if (!runningTrip?._id || !profile._id) return;

   

    
    socket.emit('fetch-messages', runningTrip._id);

    // Listen for previous chat history
    socket.on('chat:history', (msgs) => {
      setLoading(true);
       setMessages(msgs);
      setLoading(false);
      
      
    });

    // Listen for new messages
    socket.on('receive-message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off('chat:history');
      socket.off('receive-message');
      socket.emit('leave-trip', {
        tripId: runningTrip._id,
        userId: profile._id,
      });
    };
  }, [runningTrip?._id, profile?._id]);


  // console.log(runningTrip)

if (!runningTrip) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No active trip found. Please start or join a trip to chat.</Text>
      </SafeAreaView>
    );
  }


  const sendMessage = () => {
    if (!input.trim() || !profile) return;

    const messagePayload = {
      tripId: runningTrip._id,
      senderId: profile._id,
      senderName: profile.name || profile.email|| 'Unknown',
      message: input.trim(),
    };

    socket.emit('send-message', messagePayload);

    setInput('');
  };

 const renderItem = ({ item }: { item: Message }) => {
  const isMe = profile && item.senderId === profile._id;
  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {!isMe && <Text style={styles.senderName}>{item.senderName.split("@")[0]}</Text>}
      <Text
        style={[
          styles.messageText,
          isMe && { color: '#fff' }, // Make my messages white
        ]}
      >
        {item.message}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

  return (
    <SafeAreaView style={{ flex: 1 }}>

    { loading ? (
        <View className='flex h-full items-center justify-center'>
          <ActivityIndicator/>
          <Text>Loading chat....</Text>
          
        </View>
        ):


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ 
          padding: 16, 
          backgroundColor: '#f7f7f7', 
          borderBottomWidth: 1, 
          borderColor: '#e0e0e0',
          marginBottom: 8
        }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: '#222', 
            marginBottom: 4 
          }}>
            Trip id: <Text style={{ color: '#007AFF' }}>{runningTrip.tripId || 'Unnamed Trip'}</Text>
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#555' 
          }}>
            Password: <Text style={{ fontWeight: '600', color: '#007AFF' }}>{runningTrip.password || 'No Password'}</Text>
          </Text>
        </View>

       

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: 10 }}
        />

          

        <View style={styles.inputContainer} >
          <TextInput
            className='h-12'
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={{ color: 'white' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '75%',
  },
  myMessage: {
    backgroundColor: '#007AFF',
  
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  
  },
  senderName: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 3,
  },
  messageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#555',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
   
    borderTopWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center', 
    paddingHorizontal: 15,
    marginLeft: 8,
  },
});

export default Chat;