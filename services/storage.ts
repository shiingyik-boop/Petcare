import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, Reminder } from '@/types';

const PETS_STORAGE_KEY = '@pets';
const REMINDERS_STORAGE_KEY = '@reminders';

export class StorageService {
  // Pet operations
  static async savePets(pets: Pet[]): Promise<void> {
    try {
      const serializedPets = pets.map(pet => ({
        ...pet,
        createdAt: pet.createdAt instanceof Date ? pet.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: pet.updatedAt instanceof Date ? pet.updatedAt.toISOString() : new Date().toISOString(),
      }));
      await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(serializedPets));
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

      if (!Array.isArray(pets)) {
        console.warn('Pets data is not an array, clearing storage');
        await AsyncStorage.removeItem(PETS_STORAGE_KEY);
        return [];
      }

      return pets.map((pet: any) => ({
        ...pet,
        id: pet.id || '',
        name: pet.name || '',
        type: pet.type || '',
        age: pet.age || 0,
        createdAt: pet.createdAt ? new Date(pet.createdAt) : new Date(),
        updatedAt: pet.updatedAt ? new Date(pet.updatedAt) : new Date(),
      }));
    } catch (error) {
      console.error('Error getting pets, clearing corrupted data:', error);
      await AsyncStorage.removeItem(PETS_STORAGE_KEY);
      return [];
    }
  }

  static async addPet(pet: Pet): Promise<Pet[]> {
    try {
      const pets = await this.getPets();
      const petWithDates = {
        ...pet,
        createdAt: pet.createdAt || new Date(),
        updatedAt: pet.updatedAt || new Date(),
      };
      const newPets = [...pets, petWithDates];
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
        createdAt: pets[petIndex].createdAt || new Date(),
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
      const serializedReminders = reminders.map(reminder => ({
        ...reminder,
        date: reminder.date instanceof Date ? reminder.date.toISOString() : new Date().toISOString(),
        createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt.toISOString() : new Date().toISOString(),
      }));
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(serializedReminders));
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

      if (!Array.isArray(reminders)) {
        console.warn('Reminders data is not an array, clearing storage');
        await AsyncStorage.removeItem(REMINDERS_STORAGE_KEY);
        return [];
      }

      return reminders.map((reminder: any) => ({
        ...reminder,
        id: reminder.id || '',
        petId: reminder.petId || '',
        title: reminder.title || '',
        description: reminder.description || '',
        time: reminder.time || '09:00',
        isCompleted: reminder.isCompleted || false,
        date: reminder.date ? new Date(reminder.date) : new Date(),
        createdAt: reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
        updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : new Date(),
      }));
    } catch (error) {
      console.error('Error getting reminders, clearing corrupted data:', error);
      await AsyncStorage.removeItem(REMINDERS_STORAGE_KEY);
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
      const reminderWithDates = {
        ...reminder,
        date: reminder.date || new Date(),
        createdAt: reminder.createdAt || new Date(),
        updatedAt: reminder.updatedAt || new Date(),
      };
      const newReminders = [...reminders, reminderWithDates];
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
        date: updatedReminder.date || reminders[reminderIndex].date || new Date(),
        createdAt: reminders[reminderIndex].createdAt || new Date(),
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