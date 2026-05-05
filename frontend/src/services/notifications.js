import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'task_reminder_ids'; // { [taskId]: notificationId }

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
    shouldPlaySound: false,
    shouldSetBadge: false,
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
      data: { type: 'daily_motivation' },
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
      data: { type: 'task_reminder', taskId: task._id },
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
