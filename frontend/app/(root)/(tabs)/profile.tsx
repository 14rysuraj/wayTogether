import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClerk } from '@clerk/clerk-expo'
import { router } from 'expo-router'

const profile = () => {



  const { signOut } = useClerk()

  const handleLogout = async () => {
    try {
      await signOut()
      // Redirect to your desired page
      router.replace('/(auth)/sign-in')
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }



  return (
    <SafeAreaView>

      <Text>profile</Text>
      <TouchableOpacity onPress={handleLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>

    </SafeAreaView>
    
    
  )
}

export default profile