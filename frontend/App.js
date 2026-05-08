import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QueryProvider from './src/services/QueryProvider';
import useAuthStore from './src/store/authStore';
import api from './src/services/api';
import { ToastProvider } from './src/context/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestNotificationPermission, scheduleDailyMotivation, setupNotificationChannels, registerSmartReminders } from './src/services/notifications';
import { useBadgeCount } from './src/hooks/useBadgeCount';
import { navigationRef, registerDeepLinkHandler, unregisterDeepLinkHandler } from './src/services/DeepLinkHandler';
import OfflineBanner from './src/components/OfflineBanner';
import { useSyncQueue } from './src/hooks/useSyncQueue';

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
import SearchUsersScreen from './src/screens/SearchUsersScreen';
import FriendRequestsScreen from './src/screens/FriendRequestsScreen';
import FriendListScreen from './src/screens/FriendListScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import PendingTasksScreen from './src/screens/PendingTasksScreen';

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
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ headerShown: true, title: 'Find Friends', headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ headerShown: true, title: 'Friend Requests', headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
      <Stack.Screen name="FriendList" component={FriendListScreen} options={{ headerShown: true, title: 'Friends', headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: true, title: 'Messages', headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
      <Stack.Screen name="PendingTasks" component={PendingTasksScreen} options={{ headerShown: true, title: 'My Tasks', headerStyle: { backgroundColor: '#0f0f1a' }, headerTintColor: '#6C63FF', headerTitleStyle: { color: '#fff' } }} />
    </Stack.Navigator>
  );
}

// Syncs OS badge count with unread message count. Must live inside QueryProvider.
function BadgeSync() {
  useBadgeCount();
  return null;
}

// Replays offline mutations when device reconnects.
function SyncQueue() {
  useSyncQueue();
  return null;
}

export default function App() {
  const { isAuthenticated, token, setAuth, clearAuth, _hydrated } = useAuthStore();
  const [validating, setValidating] = useState(true);

  // Register deep-link handler for notification taps
  useEffect(() => {
    registerDeepLinkHandler();
    return () => unregisterDeepLinkHandler();
  }, []);

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
        // Set up Android channels first, then request permission & schedule
        setupNotificationChannels().then(() =>
          requestNotificationPermission().then((granted) => {
            if (granted) {
              scheduleDailyMotivation();
              registerSmartReminders();
            }
          })
        );
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
    <SafeAreaProvider>
    <QueryProvider>
      <ToastProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <BadgeSync />
          <SyncQueue />
          {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </ToastProvider>
    </QueryProvider>
    <OfflineBanner />
    </SafeAreaProvider>
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
