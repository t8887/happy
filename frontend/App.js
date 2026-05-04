import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QueryProvider from './src/services/QueryProvider';
import useAuthStore from './src/store/authStore';
import api from './src/services/api';
import { ToastProvider } from './src/context/ToastContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FeedScreen from './src/screens/FeedScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, token, setAuth, clearAuth, _hydrated } = useAuthStore();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Wait for Zustand to rehydrate from storage before validating
    if (!_hydrated) return;

    if (!token) {
      setValidating(false);
      return;
    }

    // Validate persisted token against the server
    api.get('/auth/me')
      .then((res) => {
        setAuth(res.data.user, token);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setValidating(false);
      });
  }, [_hydrated]);

  if (!_hydrated || validating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <QueryProvider>
      <ToastProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </ToastProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
