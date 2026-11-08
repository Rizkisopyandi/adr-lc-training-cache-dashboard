import { DatabaseSourceConfig } from '../types/database';

export const EXECUTIVE_DATABASES: DatabaseSourceConfig[] = [
  {
    key: 'ptu',
    name: 'Pelatihan & Ujian (PTU)',
    codeName: 'PTU 2026',
    description: 'Master Database Pelatihan & Ujian Teknis ADR Learning Center',
    spreadsheetId: '1mvZxcYjGwQk5fuAnMGaywUBGGL5_C1eQNK08J04sKjs',
    defaultSheetName: 'DataBase',
    idColumnName: 'ID_Training',
    category: 'Core Training',
  },
  {
    key: 'pto',
    name: 'Pelatihan Toko & Operasional (PTO)',
    codeName: 'PTO 2026',
    description: 'Database Pelatihan Operasional Toko & Service Standards',
    spreadsheetId: '1gb0cMY9F4rw7YS0yeqTytOncxAvMuXubo9GgeE1bZSI',
    defaultSheetName: 'DataBase',
    idColumnName: 'ID_Training',
    category: 'Operations',
  },
  {
    key: 'otomasi',
    name: 'Sistem Otomasi Training',
    codeName: 'Otomasi',
    description: 'Data Integrasi Modul & Evaluasi Otomatisasi',
    spreadsheetId: '1WZ2SZ7nEV_orKrg3Ht8tOjf5E8UXLwi5NsgvoDHFjbY',
    defaultSheetName: 'DataBase',
    idColumnName: 'ID_Training',
    category: 'Automation',
  },
  {
    key: 'staff',
    name: 'Database Staff Internal',
    codeName: 'Staff ADR',
    description: 'Master Data Karyawan, Instruktur & Peserta Internal',
    spreadsheetId: '1qoYM88IRSU8gKuU_XeDP0Cbfg0Hwk2LDb3Xpd-zbp9c',
    defaultSheetName: 'Database_2026',
    idColumnName: 'No Und',
    category: 'Human Resources',
  },
  {
    key: 'eksternal',
    name: 'Pelatihan Eksternal & Mitra',
    codeName: 'Eksternal',
    description: 'Rekapitulasi Peserta Pelatihan Vendor & Mitra Eksternal',
    spreadsheetId: '150Na8hW2n6_lodveSTeP4W4hA0rCosY1jfPi9q7F6Fk',
    defaultSheetName: 'DataBase',
    idColumnName: 'No Und',
    category: 'Partnership',
  },
];

export const DATABASES = EXECUTIVE_DATABASES.map(db => ({
  id: db.key,
  name: db.name,
  spreadsheetId: db.spreadsheetId,
  description: db.description,
  category: db.category,
  defaultSheetName: db.defaultSheetName,
  allowedSheets: [
    {
      id: `${db.key}-database`,
      name: db.defaultSheetName,
      description: `Sheet ${db.defaultSheetName} untuk ${db.name}`,
      isDefault: true,
    }
  ]
}));

export const FORBIDDEN_TABS = [
  'USERS',
  'ROLES',
  'SESSIONS',
  'LOGIN_AUDIT',
  'CONFIG',
  'ADMIN_KEYS',
  'PASSWORDS',
  'AUTH',
  'SETTINGS',
];

export const DEFAULT_WEBAPP_URL_STORAGE_KEY = 'adr_lc_gas_webapp_override_meetdir_v1';
