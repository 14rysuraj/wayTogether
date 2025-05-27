import { View, Text, ScrollView, Image, Modal, Alert } from "react-native";
import React, { useState } from "react";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import {ReactNativeModal} from "react-native-modal"

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password:''
  })

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });


  const onSignUp = async () => {
    
    if (!isLoaded) return;
    

    if (/^\d/.test(form.name)) {
      Alert.alert("Invalid Name", "Name cannot start with a number.");
      return;
    }

    if (form.name.length <= 4) {
      Alert.alert("Invalid Name", "Name must be greater than 4 characters.");
      return;
    }
    
    
   

    // Start sign-up process using email and password provided
    try {
      console.log("Creating user with:", form.email);
      await signUp.create({
        
        emailAddress:form.email,
        password: form.password,
      })
      console.log("User creation successful");

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setVerification({
        ...verification,
        state: "pending",
      })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      
    } catch (err:any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }


  const onPressVerify = async() => {
    if (!isLoaded) return

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code:verification.code,
      })
        console.log(completeSignUp.status)

      if (completeSignUp.status === 'complete') {

        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({
          ...verification,
          state: 'success',
        })
      }
      else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    




      
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors?.[0]?.longMessage,
        state:'failed',
      })
    }
  }

    
  





  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">Create Your Account</Text>
        </View>

        <View className="p-5 ">
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, 'name': value })}
          />

          <InputField
            label="Email"
            placeholder="Enter your Email"
            autoCapitalize="none"
            icon={icons.email}
            value={form.email}
            onChangeText={(value)=>setForm({...form,'email':value})}
          />

          <InputField
            label="Password"
            placeholder="Enter your Password"
            icon={icons.lock}
            value={form.password}
            autoCapitalize="none"
            secureTextEntry={true}
            onChangeText={(value)=>setForm({...form,'password':value})}
          />

          <CustomButton
            title="Sign-up"
            className="mt-6 w-full"
            onPress={onSignUp}
          
          />

          <Link href={"/(auth)/sign-in"} className="mt-4">
            <Text>
              Already have an account ?
            </Text>
            <Text className="text-blue-500 mr-2">log in</Text>
            
          </Link>


          <View className="flex flex-row items-center my-4">

            <View className="h-[0.5px] flex flex-1 bg-blue-500" />
            <Text className="mx-3 text-xl">or</Text>
            <View className="h-[0.5px] flex flex-1 bg-blue-500" />

          </View>


          <CustomButton
            className=" shadow-none border border-gray-300 w-full bg-white "
            title="Sign-up with google"
            IconLeft={icons.google}
            textVariant="primary"

          />


        </View>

        

      </View>

      <ReactNativeModal
        isVisible={verification.state === 'pending'}
        onModalHide={() => {
          if (verification.state === 'success') {
            setShowSuccessModal(true);
          }
        }}
      >
        <View className="bg-white  rounded-2xl p-5">

          <Text className="text-2xl font-JakartaSemiBold">Verification</Text>
          <Text className="font-Jakarta">we've sent a verification code to {form.email}</Text>
          

          <InputField
              label={"Code"}
              icon={icons.lock}
              placeholder={"12345"}
            value={verification.code}
            keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code }) 
              }
          />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
          
          <CustomButton
            title="Verify"
            className="mt-4 w-full"
            onPress={onPressVerify}
          />


          </View>
      </ReactNativeModal>

      <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />
            <Text className="text-3xl font-JakartaBold text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Browse Home"
            onPress={() =>
              router.push(`/(root)/(tabs)/home`)}
              className="mt-5 w-full"
            />
          </View>
        </ReactNativeModal>
      
      
    </ScrollView>
  );
};

export default SignUp;
