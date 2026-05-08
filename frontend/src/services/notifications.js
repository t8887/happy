import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'task_reminder_ids'; // { [taskId]: notificationId }

// ─── Channel IDs ─────────────────────────────────────────────────────────────
export const CHANNEL_TASKS    = 'task-reminders';
export const CHANNEL_MESSAGES = 'messages';
export const CHANNEL_GENERAL  = 'general';

/**
 * Create Android notification channels.
 * Must be called before scheduling any notifications.
 * Safe to call multiple times — Android no-ops if channel already exists.
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_TASKS, {
    name: 'Task Reminders',
    description: 'Daily reminders for your scheduled tasks',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_MESSAGES, {
    name: 'Messages',
    description: 'New message notifications from friends',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 150],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_GENERAL, {
    name: 'General',
    description: 'Daily motivation and general app notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableVibrate: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const getStoredReminders = async () => {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredReminders = async (map) => {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(map));
  } catch {}
};

const MOTIVATIONAL_QUOTES = [
  "Small steps every day lead to big results. Keep going! 💪",
  "Your future self is cheering you on. Make today count! 🌟",
  "Progress, not perfection. One task at a time. ✅",
  "The best time to start is now. Let's crush today! 🚀",
  "Consistency beats intensity. Show up today! 🔥",
  "Every completed task is a win. Go get yours! 🏆",
  "You've got this. One step closer to your goals. ⚡",
  "Discipline is choosing your goals over your excuses. 🎯",
  "Don't wait for motivation — create it. Start now! 💡",
  "Great days are built one habit at a time. 🌱",
];

// Configure how notifications are displayed while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions.
 * Returns true if granted, false otherwise.
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * Schedule (or re-schedule) the daily 9 AM motivational notification.
 * Safe to call on every app launch — cancels the previous one first.
 */
export const scheduleDailyMotivation = async () => {
  if (Platform.OS === 'web') return;

  // Cancel any previously scheduled daily motivation notification
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content?.data?.type === 'daily_motivation') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good morning! 🌅",
      body: randomQuote,
      data: { type: 'daily_motivation', screen: 'Feed' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_GENERAL } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
};

/**
 * Cancel any existing reminder for a task, then schedule a new daily one
 * at the task's scheduledTime (e.g. "14:30"). Stores the notification ID
 * in AsyncStorage so it can be cancelled later.
 */
export const scheduleTaskReminder = async (task) => {
  if (Platform.OS === 'web' || !task?.scheduledTime) return;

  const parts = task.scheduledTime.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute)) return;

  // Cancel any previous reminder for this task first
  await cancelTaskReminder(task._id);

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Task Reminder',
      body: task.title,
      data: { type: 'task_reminder', taskId: task._id, screen: 'PendingTasks' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_TASKS } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  const reminders = await getStoredReminders();
  reminders[task._id] = notifId;
  await saveStoredReminders(reminders);
};

/**
 * Cancel the scheduled reminder for a task (e.g. when completed or deleted).
 */
export const cancelTaskReminder = async (taskId) => {
  if (Platform.OS === 'web' || !taskId) return;

  const reminders = await getStoredReminders();
  const notifId = reminders[taskId];

  if (notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    } catch {}
    delete reminders[taskId];
    await saveStoredReminders(reminders);
  }
};

// ─── Smart reminder message pools ────────────────────────────────────────────
const STREAK_PROTECTION_MSGS = [
  "Don't break your streak! 🔥 One quick task before midnight.",
  "Your streak is at risk! 🔥 Tap to keep the fire alive.",
  "No activity yet today. Protect your streak now 🔥",
  "Streak check-in ⚠️ Complete a task before the day ends!",
];

const END_OF_DAY_MSGS = [
  "Day wrap-up 🌙 How did today go? Check your progress.",
  "Night check-in 📊 See what you've accomplished today.",
  "Before you sleep — did you keep the streak alive? 🌙",
  "End of day 📋 Your Feed is waiting for a recap.",
];

const MIDDAY_MSGS = [
  "Halfway through the day! Keep the momentum going 💪",
  "Midday check-in ✅ Any tasks you can knock out right now?",
  "Quick win time 🎯 Tackle one task while you're at it!",
  "You're doing great — keep building those habits ⚡",
  "Midday boost 🚀 One task = one step closer to your goal.",
];

/**
 * Cancel all previously scheduled notifications matching a given type,
 * then schedule a new daily one.
 */
const rescheduleDaily = async ({ type, title, body, hour, minute }) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content?.data?.type === type)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type, screen: 'Feed' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_GENERAL } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

/**
 * Schedule a daily 7 PM "streak at risk" reminder.
 * Designed to fire only when the user might not have completed anything yet.
 * (The app cannot know at schedule time — the reminder is unconditional.)
 */
export const scheduleStreakProtection = () =>
  rescheduleDaily({
    type: 'streak_protection',
    title: '🔥 Streak Alert',
    body: STREAK_PROTECTION_MSGS[Math.floor(Math.random() * STREAK_PROTECTION_MSGS.length)],
    hour: 19,
    minute: 0,
  });

/**
 * Schedule a daily 9 PM end-of-day summary nudge.
 */
export const scheduleEndOfDaySummary = () =>
  rescheduleDaily({
    type: 'end_of_day',
    title: '🌙 Day Summary',
    body: END_OF_DAY_MSGS[Math.floor(Math.random() * END_OF_DAY_MSGS.length)],
    hour: 21,
    minute: 0,
  });

/**
 * Schedule a daily midday motivation at a random minute between 12:00 – 13:59
 * so it doesn't feel robotic.
 */
export const scheduleMidDayBoost = () =>
  rescheduleDaily({
    type: 'midday_boost',
    title: '⚡ Midday Boost',
    body: MIDDAY_MSGS[Math.floor(Math.random() * MIDDAY_MSGS.length)],
    hour: 12 + Math.floor(Math.random() * 2),       // 12 or 13
    minute: Math.floor(Math.random() * 60),
  });

/**
 * Register (or refresh) all three smart reminders at once.
 * Call this on every app launch after permissions are granted.
 * Each function cancels its previous instance before rescheduling.
 */
export const registerSmartReminders = () =>
  Platform.OS !== 'web'
    ? Promise.all([scheduleStreakProtection(), scheduleEndOfDaySummary(), scheduleMidDayBoost()])
    : Promise.resolve();

/**
 * Show an immediate local notification for a new message.
 * `friend` must have { _id, name, username, avatar }.
 * Tapping the notification opens the Chat screen directly.
 */
export const showMessageNotification = async (friend, messageBody) => {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💬 ${friend.name || friend.username}`,
      body: messageBody,
      data: {
        type: 'new_message',
        screen: 'Chat',
        params: { friend },
      },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_MESSAGES } : {}),
    },
    trigger: null, // immediate
  });
};
