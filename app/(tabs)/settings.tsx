import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Bell, Trash2, Info, Shield } from 'lucide-react-native';
import { StorageService } from '@/services/storage';
import { NotificationService } from '@/services/notifications';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all pets and reminders. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageService.savePets([]);
              await StorageService.saveReminders([]);
              await NotificationService.cancelAllNotifications();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (hasPermission) {
        Alert.alert('Success', 'Notification permissions are enabled');
      } else {
        Alert.alert('Error', 'Notification permissions are disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test notifications');
    }
  };

  const showAppInfo = () => {
    Alert.alert(
      'Pet Care Reminder',
      'Version 1.0.0\n\nA simple app to help you keep track of your pet care reminders.\n\nFeatures:\n• Pet profiles with photos\n• Custom reminders\n• Local notifications\n• Data stored locally on device',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleTestNotification}>
            <View style={styles.settingContent}>
              <Bell size={24} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Test Notifications</Text>
                <Text style={styles.settingDescription}>
                  Check if notification permissions are enabled
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleClearAllData}
            disabled={loading}
          >
            <View style={styles.settingContent}>
              <Trash2 size={24} color="#EF4444" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                  Clear All Data
                </Text>
                <Text style={styles.settingDescription}>
                  Remove all pets and reminders permanently
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showAppInfo}>
            <View style={styles.settingContent}>
              <Info size={24} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>App Information</Text>
                <Text style={styles.settingDescription}>
                  Version, features, and more
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pet Care Reminder v1.0.0</Text>
          <Text style={styles.footerSubText}>
            Made with ❤️ for pet lovers
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});