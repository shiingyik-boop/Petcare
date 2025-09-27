export interface Pet {
  id: string;
  name: string;
  type: string;
  age: number;
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  petId: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  isCompleted: boolean;
  notificationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RootStackParamList = {
  PetTabs: undefined;
  AddPet: { pet?: Pet };
  PetDetails: { pet: Pet };
  AddReminder: { petId: string; reminder?: Reminder };
};

export type TabParamList = {
  Home: undefined;
  Settings: undefined;
};