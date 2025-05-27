import { View, Text, ScrollView, Image, Alert } from "react-native";
import React, { useState } from "react";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [form, setForm] = useState({
  
    email: '',
    password:''
  })


  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

   
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(root)/(tabs)/home')
      } else {
        
        console.error(JSON.stringify(signInAttempt, null, 2))
       
      }
    } catch (err:any) {
     
      
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error',err.errors[0].longMessage)
      
    }
  }





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
            onChangeText={(value)=>setForm({...form,'email':value})}
          />

          <InputField
            label="Password"
            placeholder="Enter your Password"
            icon={icons.lock}
            value={form.password}
            onChangeText={(value)=>setForm({...form,'password':value})}
          />

          <CustomButton
            title="Sign-In"
            className="mt-6 w-full"
            onPress={onSignInPress}
          
          />

          <Link href={"/(auth)/sign-up"} className="mt-4">
            <Text>
              Don't have an acoount ?
            </Text>
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

          />


        </View>

        

      </View>
    </ScrollView>
  );
};

export default SignIn;
