import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { validateToken } from "@/utils/auth";


const Page = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      setIsSignedIn(isValid);
    };
    checkAuth();
  }, []);

  if (isSignedIn === null) return null;

  return isSignedIn
    ? <Redirect href="/(root)/(tabs)/home" />
    : <Redirect href="/(auth)/welcome" />;
};

export default Page;