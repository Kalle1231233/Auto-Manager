import { EmployeeRole, DocumentType } from '../types';

export const ROLE_CONFIG: Record<EmployeeRole, { label: string; icon: string; color: string }> = {
  admin: { label: 'Administrator', icon: 'shield', color: '#1A73E8' },
  fuhrparkleiter: { label: 'Fuhrparkleiter', icon: 'car-sport', color: '#FF6D00' },
  fahrer: { label: 'Fahrer', icon: 'person', color: '#34A853' },
  techniker: { label: 'Techniker', icon: 'construct', color: '#795548' },
  buchhalter: { label: 'Buchhalter', icon: 'calculator', color: '#9C27B0' },
  sonstiges: { label: 'Sonstiges', icon: 'ellipsis-horizontal', color: '#9E9E9E' },
};

export const ALL_ROLES: EmployeeRole[] = ['admin', 'fuhrparkleiter', 'fahrer', 'techniker', 'buchhalter', 'sonstiges'];

export const DOCUMENT_CONFIG: Record<DocumentType, { label: string; icon: string; color: string; bgColor: string }> = {
  zulassung: { label: 'Zulassung', icon: 'document-text', color: '#1A73E8', bgColor: '#E8F0FE' },
  versicherung: { label: 'Versicherung', icon: 'shield-checkmark', color: '#34A853', bgColor: '#E6F4EA' },
  hauptuntersuchung: { label: 'Hauptuntersuchung (TÜV)', icon: 'checkmark-circle', color: '#FF6D00', bgColor: '#FFF3E0' },
  fuehrerschein: { label: 'Führerschein', icon: 'card', color: '#9C27B0', bgColor: '#F3E5F5' },
  leasingvertrag: { label: 'Leasingvertrag', icon: 'receipt', color: '#00BCD4', bgColor: '#E0F7FA' },
  kaufvertrag: { label: 'Kaufvertrag', icon: 'cash', color: '#4CAF50', bgColor: '#E8F5E9' },
  garantie: { label: 'Garantie', icon: 'ribbon', color: '#FFC107', bgColor: '#FFF8E1' },
  sonstiges: { label: 'Sonstiges', icon: 'folder', color: '#9E9E9E', bgColor: '#F5F5F5' },
};

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'zulassung', 'versicherung', 'hauptuntersuchung', 'fuehrerschein',
  'leasingvertrag', 'kaufvertrag', 'garantie', 'sonstiges',
];
