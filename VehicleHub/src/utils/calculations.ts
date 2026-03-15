import { differenceInDays, parseISO, format, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { Vehicle, VehicleEntry, VehicleStatus, StatusLevel, EntryCategory } from '../types';

export function getDaysUntil(dateString?: string): number | undefined {
  if (!dateString) return undefined;
  const date = parseISO(dateString);
  if (!isValid(date)) return undefined;
  return differenceInDays(date, new Date());
}

export function getDaysAgo(dateString?: string): number | undefined {
  if (!dateString) return undefined;
  const date = parseISO(dateString);
  if (!isValid(date)) return undefined;
  return differenceInDays(new Date(), date);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '–';
  const date = parseISO(dateString);
  if (!isValid(date)) return '–';
  return format(date, 'dd.MM.yyyy', { locale: de });
}

export function formatRelativeDate(dateString?: string): string {
  if (!dateString) return '–';
  const daysAgo = getDaysAgo(dateString);
  if (daysAgo === undefined) return '–';
  if (daysAgo === 0) return 'Heute';
  if (daysAgo === 1) return 'Gestern';
  if (daysAgo < 7) return `Vor ${daysAgo} Tagen`;
  if (daysAgo < 30) return `Vor ${Math.floor(daysAgo / 7)} Wochen`;
  if (daysAgo < 365) return `Vor ${Math.floor(daysAgo / 30)} Monaten`;
  return `Vor ${Math.floor(daysAgo / 365)} Jahren`;
}

export function formatDaysUntil(days?: number): string {
  if (days === undefined) return '–';
  if (days < 0) return `${Math.abs(days)} Tage überfällig`;
  if (days === 0) return 'Heute fällig';
  if (days === 1) return 'Morgen fällig';
  if (days < 30) return `In ${days} Tagen`;
  if (days < 365) return `In ${Math.floor(days / 30)} Monaten`;
  return `In ${Math.floor(days / 365)} Jahren`;
}

export function getTuevStatus(daysUntil?: number): StatusLevel {
  if (daysUntil === undefined) return 'ok';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil < 14) return 'danger';
  if (daysUntil < 30) return 'warning';
  return 'ok';
}

export function getServiceStatus(daysUntil?: number, mileageUntil?: number): StatusLevel {
  const byDate = daysUntil !== undefined
    ? (daysUntil < 0 ? 'overdue' : daysUntil < 14 ? 'danger' : daysUntil < 30 ? 'warning' : 'ok')
    : 'ok';
  const byMileage = mileageUntil !== undefined
    ? (mileageUntil < 0 ? 'overdue' : mileageUntil < 500 ? 'danger' : mileageUntil < 2000 ? 'warning' : 'ok')
    : 'ok';
  const levels: StatusLevel[] = ['overdue', 'danger', 'warning', 'ok'];
  return levels[Math.min(levels.indexOf(byDate), levels.indexOf(byMileage))];
}

export function getWashStatus(daysAgo?: number): StatusLevel {
  if (daysAgo === undefined) return 'ok';
  if (daysAgo > 30) return 'warning';
  return 'ok';
}

export function computeVehicleStatus(vehicle: Vehicle, entries: VehicleEntry[]): VehicleStatus {
  const vehicleEntries = entries.filter(e => e.vehicleId === vehicle.id);

  const tuevDays = getDaysUntil(vehicle.tuevDate);
  const serviceDays = getDaysUntil(vehicle.nextServiceDate);
  const serviceMileageUntil = vehicle.nextServiceMileage
    ? vehicle.nextServiceMileage - vehicle.mileage
    : undefined;

  const washEntries = vehicleEntries
    .filter(e => e.category === 'waesche')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastWash = washEntries[0];
  const washDaysAgo = getDaysAgo(lastWash?.date);

  const oilEntries = vehicleEntries
    .filter(e => e.category === 'oelwechsel')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastOil = oilEntries[0];

  return {
    tuev: {
      date: vehicle.tuevDate,
      daysUntil: tuevDays,
      level: getTuevStatus(tuevDays),
    },
    service: {
      date: vehicle.nextServiceDate,
      daysUntil: serviceDays,
      mileageUntil: serviceMileageUntil,
      level: getServiceStatus(serviceDays, serviceMileageUntil),
    },
    lastWash: {
      date: lastWash?.date,
      daysAgo: washDaysAgo,
      level: getWashStatus(washDaysAgo),
    },
    lastOilChange: {
      date: lastOil?.date,
      mileage: lastOil?.mileage,
      level: 'ok',
    },
  };
}

export function getStatusColor(level: StatusLevel): string {
  switch (level) {
    case 'ok': return '#34A853';
    case 'warning': return '#FBBC04';
    case 'danger': return '#EA4335';
    case 'overdue': return '#C62828';
  }
}

export function getStatusBgColor(level: StatusLevel): string {
  switch (level) {
    case 'ok': return '#E6F4EA';
    case 'warning': return '#FEF7E0';
    case 'danger': return '#FCE8E6';
    case 'overdue': return '#FFCDD2';
  }
}

export function getUrgentWarnings(vehicle: Vehicle, entries: VehicleEntry[]): string[] {
  const status = computeVehicleStatus(vehicle, entries);
  const warnings: string[] = [];

  if (status.tuev.level === 'overdue') {
    warnings.push(`TÜV ist ${Math.abs(status.tuev.daysUntil!)} Tage überfällig!`);
  } else if (status.tuev.level === 'danger') {
    warnings.push(`TÜV läuft in ${status.tuev.daysUntil} Tagen ab`);
  } else if (status.tuev.level === 'warning') {
    warnings.push(`TÜV in ${status.tuev.daysUntil} Tagen`);
  }

  if (status.service.level !== 'ok') {
    if (status.service.daysUntil !== undefined && status.service.daysUntil < 30) {
      warnings.push(`Service in ${status.service.daysUntil} Tagen fällig`);
    }
    if (status.service.mileageUntil !== undefined && status.service.mileageUntil < 2000) {
      warnings.push(`Service in ${status.service.mileageUntil} km fällig`);
    }
  }

  return warnings;
}

export function getLastEntryByCategory(
  vehicleId: string,
  category: EntryCategory,
  entries: VehicleEntry[]
): VehicleEntry | undefined {
  return entries
    .filter(e => e.vehicleId === vehicleId && e.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatMileage(km?: number): string {
  if (km === undefined) return '–';
  return new Intl.NumberFormat('de-DE').format(km) + ' km';
}
