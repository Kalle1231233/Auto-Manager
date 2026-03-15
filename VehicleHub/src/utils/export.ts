import { Platform } from 'react-native';
import { Vehicle, VehicleEntry } from '../types';
import { CATEGORY_CONFIG } from '../constants/categories';
import { formatDate, formatCurrency, formatMileage } from './calculations';

export function generateCSV(vehicle: Vehicle, entries: VehicleEntry[]): string {
  const headers = [
    'Datum',
    'Kategorie',
    'Kilometerstand',
    'Kosten (€)',
    'Nächstes Datum',
    'Notiz',
  ];

  const rows = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(e => [
      formatDate(e.date),
      CATEGORY_CONFIG[e.category].label,
      e.mileage != null ? String(e.mileage) : '',
      e.cost != null ? e.cost.toFixed(2).replace('.', ',') : '',
      e.nextDueDate ? formatDate(e.nextDueDate) : '',
      e.note ? `"${e.note.replace(/"/g, '""')}"` : '',
    ]);

  const csvLines = [
    `# VehicleHub Export – ${vehicle.name} (${vehicle.brand} ${vehicle.model} ${vehicle.year})`,
    `# Kennzeichen: ${vehicle.licensePlate} | Stand: ${vehicle.mileage} km`,
    `# Exportiert am: ${formatDate(new Date().toISOString())}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
  ];

  return csvLines.join('\n');
}

export async function exportVehicleCSV(vehicle: Vehicle, entries: VehicleEntry[]) {
  const csv = generateCSV(vehicle, entries);
  const filename = `vehiclehub_${vehicle.licensePlate.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const FileSystem = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const fs = FileSystem as any;
    const docDir = fs.documentDirectory ?? fs.default?.documentDirectory;
    const writeFile = fs.writeAsStringAsync ?? fs.default?.writeAsStringAsync;
    const path = `${docDir}${filename}`;
    await writeFile(path, csv, { encoding: 'utf8' });
    const share = Sharing.default ?? Sharing;
    await (share as any).shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: `${vehicle.name} – Historie exportieren`,
    });
  } catch (e) {
    console.warn('Export error:', e);
  }
}
