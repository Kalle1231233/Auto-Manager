import { VehicleEntry, TripEntry, VatRate } from '../types';
import { getYear } from 'date-fns';
import { parseISO } from 'date-fns';

export interface BusinessSummary {
  totalGross: number;
  totalNet: number;
  totalVat: number;
  deductibleGross: number;
  deductibleNet: number;
  deductibleVat: number;
  privateGross: number;
  entryCount: number;
  businessEntryCount: number;
}

export interface TripSummary {
  totalKm: number;
  businessKm: number;
  privateKm: number;
  businessRatio: number;
  tripCount: number;
  businessTripCount: number;
}

export function calcVat(gross: number, rate: VatRate): { net: number; vat: number } {
  if (rate === 0) return { net: gross, vat: 0 };
  const net = gross / (1 + rate / 100);
  return { net: parseFloat(net.toFixed(2)), vat: parseFloat((gross - net).toFixed(2)) };
}

export function calcBusinessAmount(gross: number, ratio: number): number {
  return parseFloat(((gross * ratio) / 100).toFixed(2));
}

export function getBusinessSummary(entries: VehicleEntry[]): BusinessSummary {
  let totalGross = 0;
  let totalNet = 0;
  let totalVat = 0;
  let deductibleGross = 0;
  let deductibleNet = 0;
  let deductibleVat = 0;
  let privateGross = 0;
  let businessEntryCount = 0;

  entries.forEach(e => {
    const gross = e.cost ?? 0;
    if (gross === 0) return;
    totalGross += gross;

    const { net, vat } = calcVat(gross, e.vatRate ?? 19);
    totalNet += net;
    totalVat += vat;

    if (e.isBusinessExpense) {
      businessEntryCount++;
      const ratio = e.businessRatio ?? 100;
      const busGross = calcBusinessAmount(gross, ratio);
      const { net: busNet, vat: busVat } = calcVat(busGross, e.vatRate ?? 19);
      deductibleGross += busGross;
      deductibleNet += busNet;
      deductibleVat += busVat;
      privateGross += gross - busGross;
    } else {
      privateGross += gross;
    }
  });

  return {
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalNet: parseFloat(totalNet.toFixed(2)),
    totalVat: parseFloat(totalVat.toFixed(2)),
    deductibleGross: parseFloat(deductibleGross.toFixed(2)),
    deductibleNet: parseFloat(deductibleNet.toFixed(2)),
    deductibleVat: parseFloat(deductibleVat.toFixed(2)),
    privateGross: parseFloat(privateGross.toFixed(2)),
    entryCount: entries.filter(e => e.cost != null && e.cost > 0).length,
    businessEntryCount,
  };
}

export function getTripSummary(trips: TripEntry[]): TripSummary {
  const totalKm = trips.reduce((s, t) => s + t.distance, 0);
  const businessKm = trips.filter(t => t.isBusinessTrip).reduce((s, t) => s + t.distance, 0);
  const businessTripCount = trips.filter(t => t.isBusinessTrip).length;

  return {
    totalKm,
    businessKm,
    privateKm: totalKm - businessKm,
    businessRatio: totalKm > 0 ? parseFloat(((businessKm / totalKm) * 100).toFixed(1)) : 0,
    tripCount: trips.length,
    businessTripCount,
  };
}

export function generateBusinessCSV(
  entries: VehicleEntry[],
  trips: TripEntry[],
  year: number,
  companyName?: string,
  vatId?: string
): string {
  const yearEntries = entries.filter(
    e => e.cost != null && e.cost > 0 && getYear(parseISO(e.date)) === year
  );
  const yearTrips = trips.filter(t => getYear(parseISO(t.date)) === year);
  const summary = getBusinessSummary(yearEntries);
  const tripSum = getTripSummary(yearTrips);

  const lines: string[] = [
    `# VehicleHub Geschäftsbericht ${year}`,
    companyName ? `# Unternehmen: ${companyName}` : '',
    vatId ? `# USt-ID: ${vatId}` : '',
    `# Erstellt am: ${new Date().toLocaleDateString('de-DE')}`,
    '',
    '## Zusammenfassung',
    `Gesamtausgaben (Brutto);${summary.totalGross.toFixed(2).replace('.', ',')} €`,
    `Gesamtausgaben (Netto);${summary.totalNet.toFixed(2).replace('.', ',')} €`,
    `Enthaltene MwSt;${summary.totalVat.toFixed(2).replace('.', ',')} €`,
    `Geschäftlich absetzbar (Brutto);${summary.deductibleGross.toFixed(2).replace('.', ',')} €`,
    `Absetzbare Vorsteuer;${summary.deductibleVat.toFixed(2).replace('.', ',')} €`,
    `Privater Anteil;${summary.privateGross.toFixed(2).replace('.', ',')} €`,
    '',
    '## Fahrtenprotokoll',
    `Gesamtkilometer;${tripSum.totalKm} km`,
    `Geschäftskilometer;${tripSum.businessKm} km`,
    `Privatkilometer;${tripSum.privateKm} km`,
    `Geschäftlicher Anteil;${tripSum.businessRatio}%`,
    '',
    '## Kostenbelege',
    'Datum;Lieferant;Kategorie;Beleg-Nr.;Brutto (€);Netto (€);MwSt (€);MwSt-Satz;Geschäftl. Anteil;Absetzbar (€);Notiz',
    ...yearEntries
      .filter(e => e.isBusinessExpense)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        const { net, vat } = calcVat(e.cost!, e.vatRate ?? 19);
        const ratio = e.businessRatio ?? 100;
        const deductible = calcBusinessAmount(e.cost!, ratio);
        return [
          new Date(e.date).toLocaleDateString('de-DE'),
          e.supplier ?? '',
          e.category,
          e.receiptNumber ?? '',
          e.cost!.toFixed(2).replace('.', ','),
          net.toFixed(2).replace('.', ','),
          vat.toFixed(2).replace('.', ','),
          `${e.vatRate ?? 19}%`,
          `${ratio}%`,
          deductible.toFixed(2).replace('.', ','),
          e.note ? `"${e.note.replace(/"/g, '""')}"` : '',
        ].join(';');
      }),
    '',
    '## Fahrtenprotokoll-Details',
    'Datum;Fahrzeug;Ziel;Zweck;Km;Typ',
    ...yearTrips
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => [
        new Date(t.date).toLocaleDateString('de-DE'),
        t.vehicleId,
        `"${t.destination}"`,
        `"${t.purpose}"`,
        t.distance,
        t.isBusinessTrip ? 'Geschäftlich' : 'Privat',
      ].join(';')),
  ].filter(l => l !== undefined);

  return lines.join('\n');
}
