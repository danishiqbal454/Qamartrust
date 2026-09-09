import type React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
}

export interface CategoryItem {
  id: number;
  name: string;
}

export interface BackupSchedule {
  full: {
    enabled: boolean;
    everyHours: number;
    everyMinutes: number;
  };
  runBetween: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  runOnDays: {
    sun: boolean;
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
  };
  firstFullBackupStart: string; // ISO format: YYYY-MM-DDTHH:mm
}

export interface SystemConfig {
  trustName: string;
  contactNumber: string;
  systemEmail: string;
  address: string;
  trustProfilePicture?: string;
  backupSchedule?: BackupSchedule;
}

export type Message = {
    id: number;
    text: string;
    timestamp: number;
    senderId: string; // user's email or a special ID
    attachment?: {
        type: 'image' | 'video' | 'document' | 'audio';
        name: string;
        url: string;
        size: number;
        fileType: string;
    };
    status?: 'sent' | 'delivered' | 'read';
};

export type UserRole = 'Super Admin' | 'Manager' | 'Staff';

export interface Admin {
    username: string;
    email: string;
    password: string;
    status: 'Active' | 'Inactive';
    role: UserRole;
    createdBy: string;
    createdAt: string;
}