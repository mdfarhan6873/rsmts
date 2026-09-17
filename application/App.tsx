/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/splash';
import LoginScreen from './src/screens/auth/login';
import MainTabs from './src/screens/dashboard/MainTabs';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashComplete(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !splashComplete) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      {user ? <MainTabs /> : <LoginScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfcfc',
  },
});


export default App;
