
export enum AppTab {
  HASH = 'HASH',
  ENCRYPT = 'ENCRYPT',
  PFX = 'PFX',
  ARCHIVE = 'ARCHIVE',
  ASSISTANT = 'ASSISTANT',
  HISTORY = 'HISTORY',
  INTEGRATION = 'INTEGRATION',
  CONFIG = 'CONFIG'
}

export type Language = 'en' | 'it';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'local' | 'google-workspace';
  role?: 'admin' | 'user';
}

export interface WorkspaceConfig {
  domain: string;
  clientId: string;
  discoveryUrl: string;
  autoProvision: boolean;
}

export interface SecurityTip {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface HistoryItem {
  id: string;
  user_name?: string; // Populated by JOIN in SQL
  type: 'hash' | 'encrypt' | 'decrypt' | 'pfx-gen';
  original: string; // Maps to original_text
  result: string;   // Maps to result_text
  timestamp: number;
}

export interface CertRecord {
  id: string;
  user_id?: string;
  clientName: string;      // Maps to client_name
  domain: string;          // Maps to domain
  expirationDate: string;  // Maps to expiration_date (YYYY-MM-DD)
  type: 'PEM' | 'PFX' | 'KEY';
  fileName: string;        // Maps to file_name
  content: string;         // Base64 or Text
  notes?: string;
  timestamp: number;
}
