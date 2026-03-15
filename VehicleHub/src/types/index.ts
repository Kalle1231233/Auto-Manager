export type FuelType = 'benzin' | 'diesel' | 'elektro' | 'hybrid' | 'lpg' | 'wasserstoff';
export type EntryCategory =
  | 'tuev'
  | 'service'
  | 'oelwechsel'
  | 'reifenwechsel'
  | 'bremsen'
  | 'inspektion'
  | 'batterie'
  | 'versicherung'
  | 'steuer'
  | 'waesche'
  | 'sonstiges';

export type StatusLevel = 'ok' | 'warning' | 'danger' | 'overdue';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  fuelType: FuelType;
  color: string;
  vin?: string;
  imageBase64?: string;
  tuevDate?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEntry {
  id: string;
  vehicleId: string;
  category: EntryCategory;
  date: string;
  mileage?: number;
  cost?: number;
  note?: string;
  nextDueDate?: string;
  nextDueMileage?: number;
  createdAt: string;
}

export interface VehicleStatus {
  tuev: {
    date?: string;
    daysUntil?: number;
    level: StatusLevel;
  };
  service: {
    date?: string;
    daysUntil?: number;
    mileageUntil?: number;
    level: StatusLevel;
  };
  lastWash: {
    date?: string;
    daysAgo?: number;
    level: StatusLevel;
  };
  lastOilChange: {
    date?: string;
    mileage?: number;
    level: StatusLevel;
  };
}

export type RootStackParamList = {
  MainTabs: undefined;
  VehicleDetail: { vehicleId: string };
  AddVehicle: { vehicleId?: string };
  AddEntry: { vehicleId: string; category?: EntryCategory };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Vehicles: undefined;
  Stats: undefined;
  Settings: undefined;
};

export interface MileageRecord {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  note?: string;
}

export interface CostStat {
  category: EntryCategory;
  total: number;
  count: number;
}

export interface MonthlyStat {
  month: string;
  total: number;
  entries: number;
}
