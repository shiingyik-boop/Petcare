import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Edit, Calendar, Clock, Trash2 } from 'lucide-react-native';
import { Pet, Reminder } from '@/types';
import { StorageService } from '@/services/storage';
import { NotificationService } from '@/services/notifications';
import { format, isAfter, startOfDay } from 'date-fns';

export default function PetDetailsScreen() {
  const params = useLocalSearchParams();
  const pet = JSON.parse(params.pet as string) as Pet;
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const petReminders = await StorageService.getRemindersByPetId(pet.id);
      // Sort reminders by date and time
      const sortedReminders = petReminders.sort((a, b) => {
        const dateA = new Date(a.date);
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        dateA.setHours(hoursA, minutesA);
        
        const dateB = new Date(b.date);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        dateB.setHours(hoursB, minutesB);
        
        return dateA.getTime() - dateB.getTime();
      });
      setReminders(sortedReminders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel notification if it exists
              if (reminder.notificationId) {
                await NotificationService.cancelNotification(reminder.notificationId);
              }
              
              await StorageService.deleteReminder(reminder.id);
              loadReminders();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const toggleReminderCompletion = async (reminder: Reminder) => {
    try {
      await StorageService.updateReminder(reminder.id, {
        isCompleted: !reminder.isCompleted,
      });
      loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const isReminderOverdue = (reminder: Reminder) => {
    if (reminder.isCompleted) return false;
    
    const reminderDate = new Date(reminder.date);
    const [hours, minutes] = reminder.time.split(':').map(Number);
    reminderDate.setHours(hours, minutes);
    
    return reminderDate.getTime() < Date.now();
  };

  const renderReminderCard = ({ item: reminder }: { item: Reminder }) => {
    const isOverdue = isReminderOverdue(reminder);
    
    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          reminder.isCompleted && styles.reminderCardCompleted,
          isOverdue && styles.reminderCardOverdue,
        ]}
        onPress={() => toggleReminderCompletion(reminder)}
      >
        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={[
              styles.reminderTitle,
              reminder.isCompleted && styles.reminderTitleCompleted,
            ]}>
              {reminder.title}
            </Text>
            <TouchableOpacity
              style={styles.deleteReminderButton}
              onPress={() => handleDeleteReminder(reminder)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
          
          {reminder.description ? (
            <Text style={[
              styles.reminderDescription,
              reminder.isCompleted && styles.reminderDescriptionCompleted,
            ]}>
              {reminder.description}
            </Text>
          ) : null}
          
          <View style={styles.reminderDateTime}>
            <View style={styles.dateTimeItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(reminder.date, 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.dateTimeText}>{reminder.time}</Text>
            </View>
          </View>

          {isOverdue && !reminder.isCompleted && (
            <Text style={styles.overdueText}>Overdue</Text>
          )}
          
          {reminder.isCompleted && (
            <Text style={styles.completedText}>Completed</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Calendar size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No reminders yet</Text>
      <Text style={styles.emptyDescription}>
        Add your first reminder for {pet.name}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{pet.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({ pathname: '/add-pet', params: { pet: JSON.stringify(pet) } })}
        >
          <Edit size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.petInfo}>
        {pet.imageUri ? (
          <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.petInitial}>{pet.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.petDetails}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petMeta}>
            {pet.type} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
          </Text>
        </View>
      </View>

      <View style={styles.remindersSection}>
        <View style={styles.remindersHeader}>
          <Text style={styles.remindersTitle}>Reminders</Text>
          <TouchableOpacity
            style={styles.addReminderButton}
            onPress={() => router.push({ pathname: '/add-reminder', params: { petId: pet.id } })}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={reminders}
          renderItem={renderReminderCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyState}
        />
      </View>
    </View>
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
  editButton: {
    padding: 8,
  },
  petInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  petMeta: {
    fontSize: 16,
    color: '#6B7280',
  },
  remindersSection: {
    flex: 1,
    padding: 20,
  },
  remindersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remindersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addReminderButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderCardCompleted: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  reminderCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  deleteReminderButton: {
    padding: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  reminderDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  reminderDateTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  overdueText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});