import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Calendar, Clock } from 'lucide-react-native';
import { Reminder } from '@/types';
import { StorageService } from '@/services/storage';
import { NotificationService } from '@/services/notifications';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const REMINDER_TEMPLATES = [
  'Feeding',
  'Vaccination',
  'Vet Visit', 
  'Grooming',
  'Walking',
  'Medication',
  'Bath Time',
  'Nail Clipping',
];

export default function AddReminderScreen() {
  const params = useLocalSearchParams();
  const petId = params.petId as string;

  let existingReminder: Reminder | null = null;
  if (params.reminder) {
    const parsedReminder = JSON.parse(params.reminder as string);
    existingReminder = {
      ...parsedReminder,
      date: parsedReminder.date ? new Date(parsedReminder.date) : new Date(),
      createdAt: parsedReminder.createdAt ? new Date(parsedReminder.createdAt) : new Date(),
      updatedAt: parsedReminder.updatedAt ? new Date(parsedReminder.updatedAt) : new Date(),
    };
  }

  const [title, setTitle] = useState(existingReminder?.title || '');
  const [description, setDescription] = useState(existingReminder?.description || '');
  const [date, setDate] = useState(existingReminder?.date || new Date());
  const [time, setTime] = useState(existingReminder?.time || '09:00');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Reminder title is required');
      return;
    }

    try {
      setLoading(true);
      
      // Get pet name for notification
      const pets = await StorageService.getPets();
      const pet = pets.find(p => p.id === petId);
      const petName = pet?.name || 'Your pet';

      const reminderData: Reminder = {
        id: existingReminder?.id || uuidv4(),
        petId,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        isCompleted: existingReminder?.isCompleted || false,
        createdAt: existingReminder?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Cancel existing notification if updating
      if (existingReminder?.notificationId) {
        await NotificationService.cancelNotification(existingReminder.notificationId);
      }

      // Schedule notification
      const notificationId = await NotificationService.scheduleReminderNotification(
        reminderData,
        petName
      );

      if (notificationId) {
        reminderData.notificationId = notificationId;
      }

      if (existingReminder) {
        await StorageService.updateReminder(existingReminder.id, reminderData);
      } else {
        await StorageService.addReminder(reminderData);
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: string) => {
    setTitle(template);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {existingReminder ? 'Edit Reminder' : 'Add Reminder'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          <Check size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quick Templates</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.templateSelector}
            >
              {REMINDER_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template}
                  style={[
                    styles.templateButton,
                    title === template && styles.templateButtonSelected,
                  ]}
                  onPress={() => selectTemplate(template)}
                >
                  <Text
                    style={[
                      styles.templateButtonText,
                      title === template && styles.templateButtonTextSelected,
                    ]}
                  >
                    {template}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter reminder title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter additional details (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.dateTimeInput}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(date, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            <View style={styles.dateButtons}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateChange(new Date())}
              >
                <Text style={styles.dateButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateChange(tomorrow);
                }}
              >
                <Text style={styles.dateButtonText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleDateChange(nextWeek);
                }}
              >
                <Text style={styles.dateButtonText}>Next Week</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity style={styles.dateTimeInput}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>{time}</Text>
            </TouchableOpacity>
            <View style={styles.timeButtons}>
              {['09:00', '12:00', '18:00', '20:00'].map((timeOption) => (
                <TouchableOpacity
                  key={timeOption}
                  style={[
                    styles.timeButton,
                    time === timeOption && styles.timeButtonSelected,
                  ]}
                  onPress={() => handleTimeChange(timeOption)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      time === timeOption && styles.timeButtonTextSelected,
                    ]}
                  >
                    {timeOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.timeInput}
              value={time}
              onChangeText={handleTimeChange}
              placeholder="HH:MM"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  templateSelector: {
    marginBottom: 16,
  },
  templateButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  templateButtonTextSelected: {
    color: '#FFFFFF',
  },
  dateTimeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  dateButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeButtons: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  timeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeButtonTextSelected: {
    color: '#FFFFFF',
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
});