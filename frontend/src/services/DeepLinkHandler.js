/**
 * DeepLinkHandler — custom navigation module for notification deep links.
 *
 * How it works:
 *  1. A shared navigationRef is created here and passed to NavigationContainer via the `ref` prop.
 *  2. All scheduled notifications embed a `screen` (and optional `params`) in their `data` payload.
 *  3. When the user taps a notification (foreground or background/killed), expo-notifications fires
 *     `addNotificationResponseReceivedListener`. This module reads `data.screen` + `data.params`
 *     and calls `navigationRef.navigate()` — no Firebase, no Linking API needed.
 *
 * Supported routes and their expected `data` payloads:
 *   { screen: 'Feed' }
 *   { screen: 'PendingTasks' }
 *   { screen: 'ChatList' }
 *   { screen: 'Chat',   params: { friend: { _id, name, username, avatar } } }
 *   { screen: 'Profile' }
 *
 * Usage:
 *   import { navigationRef, registerDeepLinkHandler, unregisterDeepLinkHandler } from './DeepLinkHandler';
 *   // In NavigationContainer:  <NavigationContainer ref={navigationRef}>
 *   // In App useEffect:        registerDeepLinkHandler();  return () => unregisterDeepLinkHandler();
 */

import { createRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/** Shared ref passed to NavigationContainer */
export const navigationRef = createRef();

/** Routes that require the user to be logged in (inside AppStack) */
const AUTHENTICATED_ROUTES = new Set(['Feed', 'PendingTasks', 'ChatList', 'Chat', 'Profile']);

/**
 * Navigate to a screen by name + optional params.
 * Silently no-ops if navigation is not yet ready.
 */
const navigateTo = (screen, params) => {
  if (!navigationRef.current?.isReady()) return;
  try {
    navigationRef.current.navigate(screen, params);
  } catch {
    // Navigator may not have this route in current stack — safe to ignore
  }
};

/**
 * Resolve the notification tap payload into a { screen, params } destination.
 * Returns null if there is no valid route to navigate to.
 */
const resolveRoute = (data) => {
  if (!data?.screen) return null;

  const screen = data.screen;

  if (!AUTHENTICATED_ROUTES.has(screen)) return null;

  switch (screen) {
    case 'Chat':
      // Requires a `friend` object in params
      if (!data.params?.friend) return null;
      return { screen, params: data.params };

    default:
      return { screen, params: data.params || undefined };
  }
};

let _subscription = null;

/**
 * Register the notification tap listener.
 * Call this once inside a useEffect at the root of the app (inside NavigationContainer).
 */
export const registerDeepLinkHandler = () => {
  // expo-notifications is not supported on web
  if (Platform.OS === 'web') return;

  _subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const route = resolveRoute(data);
    if (route) navigateTo(route.screen, route.params);
  });

  // Handle the case where the app was killed and opened via a notification tap
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    const data = response.notification.request.content.data;
    const route = resolveRoute(data);
    if (route) {
      // Defer slightly so NavigationContainer is mounted and ready
      setTimeout(() => navigateTo(route.screen, route.params), 300);
    }
  });
};

/**
 * Remove the listener. Call this in the useEffect cleanup.
 */
export const unregisterDeepLinkHandler = () => {
  _subscription?.remove();
  _subscription = null;
};
