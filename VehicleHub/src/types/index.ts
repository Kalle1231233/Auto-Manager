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
export type VatRate = 0 | 7 | 19;
export type EmployeeRole = 'admin' | 'fahrer' | 'techniker' | 'fuhrparkleiter' | 'buchhalter' | 'sonstiges';
export type DocumentType = 'zulassung' | 'versicherung' | 'hauptuntersuchung' | 'fuehrerschein' | 'leasingvertrag' | 'kaufvertrag' | 'garantie' | 'sonstiges';

// ─── Fahrzeug ───────────────────────────────────────────────────────────────

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
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Einträge ────────────────────────────────────────────────────────────────

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
  doneByEmployeeId?: string;
  isBusinessExpense?: boolean;
  businessRatio?: number;
  vatRate?: VatRate;
  receiptNumber?: string;
  supplier?: string;
}

export interface TripEntry {
  id: string;
  vehicleId: string;
  driverEmployeeId?: string;
  date: string;
  startMileage: number;
  endMileage: number;
  distance: number;
  destination: string;
  purpose: string;
  isBusinessTrip: boolean;
  createdAt: string;
}

// ─── Profil & Team ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  role: EmployeeRole;
  email?: string;
  phone?: string;
  imageBase64?: string;
  companyName?: string;
  isOwner: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  imageBase64?: string;
  assignedVehicleIds: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Dokumente ───────────────────────────────────────────────────────────────

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  title: string;
  issueDate?: string;
  expiryDate?: string;
  provider?: string;
  policyNumber?: string;
  notes?: string;
  createdAt: string;
}

// ─── Geschäft ────────────────────────────────────────────────────────────────

export interface BusinessSettings {
  enabled: boolean;
  companyName?: string;
  vatId?: string;
  defaultVatRate: VatRate;
  defaultBusinessRatio: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  VehicleDetail: { vehicleId: string };
  AddVehicle: { vehicleId?: string };
  AddEntry: { vehicleId: string; category?: EntryCategory };
  AddTrip: { vehicleId: string };
  AddEmployee: { employeeId?: string };
  EmployeeDetail: { employeeId: string };
  AddDocument: { vehicleId: string; documentId?: string };
  EditProfile: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Vehicles: undefined;
  Stats: undefined;
  Business: undefined;
  Team: undefined;
};

// ─── Stats-Hilftypen ─────────────────────────────────────────────────────────

export interface VehicleStatus {
  tuev: { date?: string; daysUntil?: number; level: StatusLevel };
  service: { date?: string; daysUntil?: number; mileageUntil?: number; level: StatusLevel };
  lastWash: { date?: string; daysAgo?: number; level: StatusLevel };
  lastOilChange: { date?: string; mileage?: number; level: StatusLevel };
}

export interface MileageRecord {
  id: string; vehicleId: string; date: string; mileage: number; note?: string;
}
export interface CostStat { category: EntryCategory; total: number; count: number; }
export interface MonthlyStat { month: string; total: number; entries: number; }
