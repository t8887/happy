import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QueryProvider from './src/services/QueryProvider';
import useAuthStore from './src/store/authStore';
import api from './src/services/api';
import { ToastProvider } from './src/context/ToastContext';
import { requestNotificationPermission, scheduleDailyMotivation } from './src/services/notifications';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import FeedScreen from './src/screens/FeedScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CompletedTasksScreen from './src/screens/CompletedTasksScreen';
import NotificationTestScreen from './src/screens/NotificationTestScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CompletedTasks" component={CompletedTasksScreen} />
      <Stack.Screen name="NotificationTest" component={NotificationTestScreen} />
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
        // Schedule daily motivation now that we know user is authenticated
        requestNotificationPermission().then((granted) => {
          if (granted) scheduleDailyMotivation();
        });
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
