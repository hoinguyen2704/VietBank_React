export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  cccd: string;
  role: UserRole;
  address?: string;
  email?: string;
  isDeleted: boolean;
  // New fields for Staff/Admin
  department?: string;
  position?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  isActive: boolean;
  type: 'SAVINGS' | 'PAYMENT' | 'BUSINESS';
}

export interface Transaction {
  id: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'DEPOSIT_QR' | 'DEPOSIT_ATM' | 'WITHDRAW_ATM' | 'WITHDRAW_EXTERNAL';
  date: string;
  description: string;
}

export interface TransactionReminder {
  id: string;
  userId: string;
  toAccountNumber: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextDueDate: string;
  description: string;
  createdDate: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  accounts: BankAccount[];
  transactions: Transaction[];
  reminders: TransactionReminder[];
}