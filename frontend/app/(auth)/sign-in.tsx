import { View, Text, ScrollView, Image, Alert } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, useRouter } from "expo-router";
import { useSignIn, useUser } from "@clerk/clerk-expo";
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";



const SignIn = () => {


  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password:''
  })
  const [isLoading, setIsLoading] = useState(false)
    const { startSSOFlow } = useSSO()


   useEffect(() => {

    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
   }, [])
  
  WebBrowser.maybeCompleteAuthSession()


const onSignInPress = async () => {
  if (!form.email || !form.password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  setIsLoading(true);
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: form.email,
      password: form.password,
    });

    if (response.data.success) {
      await AsyncStorage.setItem('userToken', response.data.token);
      router.replace("/(root)/(tabs)/home");
    } else {
      Alert.alert("Login failed", response.data.message);
    }
  } catch (err: any) {
    console.error("Login error:", err);
    if (err.response?.data?.message) {
      Alert.alert("Error", err.response.data.message);
    } else if (err.code === 'NETWORK_ERROR') {
      Alert.alert("Error", "Network error. Please check your connection.");
    } else {
      Alert.alert("Error", "Something went wrong");
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleOAuthLogin = useCallback(async () => {
    try {
     
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        
        redirectUrl: AuthSession.makeRedirectUri(),
      })

   
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
        const email = signUp?.emailAddress;
        const user = signIn?.userData;
      if (user) {
      await axios.post(`${API_BASE_URL}/google-auth`, {
      email: email,
        name: user.firstName + " " + user.lastName,
      
      
      // add other fields as needed
    });
  }
        router.push('/(root)/(tabs)/home')
      } else {
       
      }
    } catch (err) {
     
      console.error(JSON.stringify(err, null, 2))
    }
  }, [])





  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">Welcome , Sign in to your account</Text>
        </View>

        <View className="p-5 ">
    
          <InputField
            label="Email"
            placeholder="Enter your Email"
            icon={icons.email}
            value={form.email}
            autoCapitalize="none"
            onChangeText={(value)=>setForm({...form,'email':value})}
          />

          <InputField
            label="Password"
            placeholder="Enter your Password"
            icon={icons.lock}
            secureTextEntry={true}
            value={form.password}
            onChangeText={(value)=>setForm({...form,'password':value})}
          />

          <CustomButton
            title={isLoading ? "Signing In..." : "Sign-In"}
            className="mt-6 w-full"
            onPress={onSignInPress}
            disabled={isLoading}
          />
          <Text>
              Don't have an acoount ?
            </Text>

          <Link href={"/(auth)/sign-up"} className="mt-4">
            
            <Text className="text-blue-500 mr-2">sign up</Text>
            
          </Link>


          <View className="flex flex-row items-center my-4">

            <View className="h-[0.5px] flex flex-1 bg-blue-500" />
            <Text className="mx-3 text-xl">or</Text>
            <View className="h-[0.5px] flex flex-1 bg-blue-500" />

          </View>


          <CustomButton
            className=" shadow-none border border-gray-300  bg-white w-full "
            title="Sign-In with google"
            IconLeft={icons.google}
            textVariant="primary"
            onPress={handleOAuthLogin}

          />


        </View>

        

      </View>
    </ScrollView>
  );
};

export default SignIn;
