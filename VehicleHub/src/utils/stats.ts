import { VehicleEntry, CostStat, MonthlyStat, EntryCategory } from '../types';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export function getCostsByCategory(entries: VehicleEntry[]): CostStat[] {
  const map = new Map<EntryCategory, { total: number; count: number }>();
  entries.forEach(e => {
    if (e.cost == null) return;
    const existing = map.get(e.category) ?? { total: 0, count: 0 };
    map.set(e.category, { total: existing.total + e.cost, count: existing.count + 1 });
  });
  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyStats(entries: VehicleEntry[], year: number): MonthlyStat[] {
  const months: MonthlyStat[] = Array.from({ length: 12 }, (_, i) => ({
    month: format(new Date(year, i, 1), 'MMM', { locale: de }),
    total: 0,
    entries: 0,
  }));

  entries.forEach(e => {
    const date = parseISO(e.date);
    if (getYear(date) !== year) return;
    const m = getMonth(date);
    months[m].total += e.cost ?? 0;
    months[m].entries += 1;
  });

  return months;
}

export function getYearlyCosts(entries: VehicleEntry[]): { year: number; total: number; count: number }[] {
  const map = new Map<number, { total: number; count: number }>();
  entries.forEach(e => {
    const year = getYear(parseISO(e.date));
    const existing = map.get(year) ?? { total: 0, count: 0 };
    map.set(year, { total: existing.total + (e.cost ?? 0), count: existing.count + 1 });
  });
  return Array.from(map.entries())
    .map(([year, { total, count }]) => ({ year, total, count }))
    .sort((a, b) => b.year - a.year);
}

export function getTotalCost(entries: VehicleEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);
}

export function getAvgMonthlyCost(entries: VehicleEntry[], year: number): number {
  const monthly = getMonthlyStats(entries, year);
  const activeMonths = monthly.filter(m => m.total > 0).length;
  if (activeMonths === 0) return 0;
  const total = monthly.reduce((s, m) => s + m.total, 0);
  return total / activeMonths;
}

export function getMileageHistory(entries: VehicleEntry[]): { date: string; mileage: number }[] {
  return entries
    .filter(e => e.mileage != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({ date: e.date, mileage: e.mileage! }));
}

export function getAvailableYears(entries: VehicleEntry[]): number[] {
  const years = new Set(entries.map(e => getYear(parseISO(e.date))));
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  return Array.from(years).sort((a, b) => b - a);
}
