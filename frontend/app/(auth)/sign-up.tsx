import { View, Text, ScrollView, Image, Alert,ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNativeModal } from "react-native-modal";

const SignUp = () => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

 const onSignUp = async () => {
  if (/^\d/.test(form.name)) {
    return Alert.alert("Invalid Name", "Name cannot start with a number.");
  }

  if (form.name.length <= 4) {
    return Alert.alert("Invalid Name", "Name must be greater than 4 characters.");
  }
   setLoading(true);

  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, form);

    if (response.data.success) {
      setShowSuccessModal(true);
      setLoading(false);
    } else if (response.data.unverified) {
      setShowSuccessModal(true);
      Alert.alert(
        "Email Not Verified",
        "Your email is registered but not verified. Please enter the OTP sent to your email."
      );
    } else {
      Alert.alert("Signup Failed", response.data.error || "Please try again");
    }
  } catch (err: any) {
  
    Alert.alert("Email doesnot exist", err?.response?.data?.error || "An error occurred.");
  }
};



  const onVerifyOtp = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
      email: form.email,
      otp,
    });
    if (response.data.success) {
      setShowSuccessModal(false);
      Alert.alert("Success", "Email verified! You can now log in.");
      router.push("/(auth)/sign-in");
    } else {
      Alert.alert("Verification Failed", response.data.message || "Invalid OTP");
    }
  } catch (err: any) {
    Alert.alert("Verification Error", err?.response?.data?.message || "An error occurred.");
  }
};

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />

          <InputField
            label="Email"
            placeholder="Enter your Email"
            autoCapitalize="none"
            icon={icons.email}
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter your Password"
            icon={icons.lock}
            value={form.password}
            autoCapitalize="none"
            secureTextEntry={true}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
          {
            loading ? (<ActivityIndicator size={"large"} color="#007AFF" className="mt-5" />) :
              ( <CustomButton title="Sign-up" className="mt-6 w-full" onPress={onSignUp} />)
          }

         

          <Text className="mt-4">
            Already have an account?
            <Link href={"/(auth)/sign-in"} className="text-blue-500 ml-2">
              Log in
            </Link>
          </Text>

          <View className="flex flex-row items-center my-4">
            <View className="h-[0.5px] flex-1 bg-blue-500" />
            <Text className="mx-3 text-xl">or</Text>
            <View className="h-[0.5px] flex-1 bg-blue-500" />
          </View>

          <CustomButton
            className="shadow-none border border-gray-300 w-full bg-white"
            title="Sign-up with Google"
            IconLeft={icons.google}
            textVariant="primary"
          />
        </View>
      </View>

 
      <ReactNativeModal
        isVisible={showSuccessModal}
        onBackdropPress={() => setShowSuccessModal(false)}
        onBackButtonPress={() => setShowSuccessModal(false)}

      >
  <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
    <Image
      source={images.check}
      className="w-[110px] h-[110px] mx-auto my-5"
    />
    <Text className="text-3xl font-JakartaBold text-center">Check Your Email</Text>
    <Text className="text-base text-gray-500 font-Jakarta text-center mt-2">
      An OTP has been sent to {form.email}. Please enter it below to verify your account.
    </Text>
    <InputField
      label="OTP"
      placeholder="Enter OTP"
      value={otp}
      onChangeText={setOtp}
      keyboardType="numeric"
      className="mt-4"
    />
    <CustomButton
      title="Verify OTP"
      onPress={onVerifyOtp}
      className="mt-5 w-full"
    />
  </View>
</ReactNativeModal>
    </ScrollView>
  );
};




export default SignUp;