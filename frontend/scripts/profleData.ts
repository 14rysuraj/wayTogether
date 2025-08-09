import profileStore from "@/store/profile";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const setProfileData = async () => {
    try {

        const response=await axios.get(`${API_BASE_URL}/profile`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.data.success)
        {
             const setProfile = profileStore.getState().setProfile;
            setProfile(response.data.user);

        }
        
    } catch (error) {
        console.error("Error setting profile data:", error);
    }

}