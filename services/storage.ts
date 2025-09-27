import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, Reminder } from '@/types';

const PETS_STORAGE_KEY = '@pets';
const REMINDERS_STORAGE_KEY = '@reminders';

export class StorageService {
  // Pet operations
  static async savePets(pets: Pet[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
    } catch (error) {
      console.error('Error saving pets:', error);
      throw error;
    }
  }

  static async getPets(): Promise<Pet[]> {
    try {
      const petsData = await AsyncStorage.getItem(PETS_STORAGE_KEY);
      if (!petsData) return [];
      
      const pets = JSON.parse(petsData);
      return pets.map((pet: any) => ({
        ...pet,
        createdAt: new Date(pet.createdAt),
        updatedAt: new Date(pet.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting pets:', error);
      return [];
    }
  }

  static async addPet(pet: Pet): Promise<Pet[]> {
    try {
      const pets = await this.getPets();
      const newPets = [...pets, pet];
      await this.savePets(newPets);
      return newPets;
    } catch (error) {
      console.error('Error adding pet:', error);
      throw error;
    }
  }

  static async updatePet(petId: string, updatedPet: Partial<Pet>): Promise<Pet[]> {
    try {
      const pets = await this.getPets();
      const petIndex = pets.findIndex(p => p.id === petId);
      
      if (petIndex === -1) {
        throw new Error('Pet not found');
      }

      pets[petIndex] = {
        ...pets[petIndex],
        ...updatedPet,
        updatedAt: new Date(),
      };

      await this.savePets(pets);
      return pets;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  static async deletePet(petId: string): Promise<Pet[]> {
    try {
      const pets = await this.getPets();
      const filteredPets = pets.filter(p => p.id !== petId);
      await this.savePets(filteredPets);
      
      // Also delete all reminders for this pet
      await this.deleteRemindersByPetId(petId);
      
      return filteredPets;
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  }

  // Reminder operations
  static async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  }

  static async getReminders(): Promise<Reminder[]> {
    try {
      const remindersData = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (!remindersData) return [];
      
      const reminders = JSON.parse(remindersData);
      return reminders.map((reminder: any) => ({
        ...reminder,
        date: new Date(reminder.date),
        createdAt: new Date(reminder.createdAt),
        updatedAt: new Date(reminder.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  static async getRemindersByPetId(petId: string): Promise<Reminder[]> {
    try {
      const allReminders = await this.getReminders();
      return allReminders.filter(reminder => reminder.petId === petId);
    } catch (error) {
      console.error('Error getting reminders by pet ID:', error);
      return [];
    }
  }

  static async addReminder(reminder: Reminder): Promise<Reminder[]> {
    try {
      const reminders = await this.getReminders();
      const newReminders = [...reminders, reminder];
      await this.saveReminders(newReminders);
      return newReminders;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  static async updateReminder(reminderId: string, updatedReminder: Partial<Reminder>): Promise<Reminder[]> {
    try {
      const reminders = await this.getReminders();
      const reminderIndex = reminders.findIndex(r => r.id === reminderId);
      
      if (reminderIndex === -1) {
        throw new Error('Reminder not found');
      }

      reminders[reminderIndex] = {
        ...reminders[reminderIndex],
        ...updatedReminder,
        updatedAt: new Date(),
      };

      await this.saveReminders(reminders);
      return reminders;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  static async deleteReminder(reminderId: string): Promise<Reminder[]> {
    try {
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(r => r.id !== reminderId);
      await this.saveReminders(filteredReminders);
      return filteredReminders;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  static async deleteRemindersByPetId(petId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(r => r.petId !== petId);
      await this.saveReminders(filteredReminders);
    } catch (error) {
      console.error('Error deleting reminders by pet ID:', error);
      throw error;
    }
  }
}