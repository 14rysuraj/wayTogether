import { View, Image } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import React from "react";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;




if (!googlePlacesApiKey) {
  console.warn("Google API key is missing!");
}

const GoogleTextInput = ({
    icon,
    initialLocation,
    containerStyle,
    textInputBackgroundColor,
    handlePress,
  }: GoogleInputProps) => {
    return (
      <View
        className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle}`}
      >
      
        <GooglePlacesAutocomplete
          minLength={1}  
          fetchDetails={true}
          placeholder="Search"
          keyboardShouldPersistTaps="handled"
          debounce={200}
          predefinedPlaces={[]}
          timeout={30000}
          enablePoweredByContainer={false}
          styles={{
            textInputContainer: {
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              marginHorizontal: 20,
              position: "relative",
              shadowColor: "#d4d4d4",
            },
            textInput: {
              backgroundColor: textInputBackgroundColor
                ? textInputBackgroundColor
                : "white",
              fontSize: 16,
              fontWeight: "600",
              marginTop: 5,
              width: "100%",
              borderRadius: 200,
            },
            listView: {
              backgroundColor:
           
                 "white",
              position: "relative",
              top: 0,
              width: "100%",
              borderRadius: 10,
              shadowColor: "#d4d4d4",
              zIndex: 20,
            },
          }}
          onPress={(data, details = null) => {
            
     
          
if (details?.geometry?.location?.lat && details?.geometry?.location?.lng) {
  handlePress({
    latitude: details.geometry.location.lat,
    longitude: details.geometry.location.lng,
    address: data.description,
  });
}
            
}}
          query={{
            key: googlePlacesApiKey,
            language: "en",
          }}

          
          renderLeftButton={() => (
            <View className="justify-center items-center w-6 h-6">
              <Image
                source={icon ? icon : icons.search}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </View>
          )}
        
          
          textInputProps={{
            placeholderTextColor: "gray",
            placeholder: initialLocation?? "Where do you want to go?",
           
          }}
        />
      </View>
    );
};
  




  
  export default GoogleTextInput;