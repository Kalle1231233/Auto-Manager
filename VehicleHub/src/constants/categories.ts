import { EntryCategory } from '../types';

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORY_CONFIG: Record<EntryCategory, CategoryConfig> = {
  tuev: {
    label: 'TÜV',
    icon: 'shield-checkmark',
    color: '#1A73E8',
    bgColor: '#E8F0FE',
  },
  service: {
    label: 'Service',
    icon: 'construct',
    color: '#FF6D00',
    bgColor: '#FFF3E0',
  },
  oelwechsel: {
    label: 'Ölwechsel',
    icon: 'water',
    color: '#795548',
    bgColor: '#EFEBE9',
  },
  reifenwechsel: {
    label: 'Reifenwechsel',
    icon: 'ellipse',
    color: '#607D8B',
    bgColor: '#ECEFF1',
  },
  bremsen: {
    label: 'Bremsen',
    icon: 'stop-circle',
    color: '#F44336',
    bgColor: '#FFEBEE',
  },
  inspektion: {
    label: 'Inspektion',
    icon: 'search',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
  },
  batterie: {
    label: 'Batterie',
    icon: 'battery-charging',
    color: '#FFC107',
    bgColor: '#FFF8E1',
  },
  versicherung: {
    label: 'Versicherung',
    icon: 'document-text',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
  },
  steuer: {
    label: 'Kfz-Steuer',
    icon: 'cash',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  waesche: {
    label: 'Autowäsche',
    icon: 'sparkles',
    color: '#03A9F4',
    bgColor: '#E1F5FE',
  },
  sonstiges: {
    label: 'Sonstiges',
    icon: 'ellipsis-horizontal',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
  },
};

export const FUEL_TYPE_LABELS: Record<string, string> = {
  benzin: 'Benzin',
  diesel: 'Diesel',
  elektro: 'Elektro',
  hybrid: 'Hybrid',
  lpg: 'LPG',
  wasserstoff: 'Wasserstoff',
};

export const ALL_CATEGORIES: EntryCategory[] = [
  'tuev',
  'service',
  'oelwechsel',
  'reifenwechsel',
  'bremsen',
  'inspektion',
  'batterie',
  'versicherung',
  'steuer',
  'waesche',
  'sonstiges',
];
