import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Reminder } from '@/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return false;
        }

        return true;
      } else {
        console.log('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleReminderNotification(reminder: Reminder, petName: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('No notification permissions');
        return null;
      }

      // Parse the time string (HH:MM format)
      const [hours, minutes] = reminder.time.split(':').map(num => parseInt(num, 10));
      
      // Create notification date
      const notificationDate = new Date(reminder.date);
      notificationDate.setHours(hours, minutes, 0, 0);

      // Don't schedule notifications in the past
      if (notificationDate.getTime() <= Date.now()) {
        console.log('Cannot schedule notification in the past');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Pet Reminder: ${reminder.title}`,
          body: `${petName} - ${reminder.description}`,
          sound: 'default',
        },
        trigger: { date: notificationDate } as Notifications.NotificationTriggerInput,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}