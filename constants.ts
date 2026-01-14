import { User, BankAccount, Transaction, UserRole, TransactionReminder } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Quản Trị Viên Hệ Thống',
    phone: '0999999999',
    password: '123',
    cccd: '001099999999',
    role: UserRole.ADMIN,
    isDeleted: false,
    email: 'admin@vnbank.com',
  },
  {
    id: 'u1',
    name: 'Nguyễn Văn Staff',
    phone: '0900000001',
    password: '123',
    cccd: '001090000001',
    role: UserRole.STAFF,
    isDeleted: false,
    department: 'Chi nhánh Hà Nội',
    position: 'Giao dịch viên',
  },
  {
    id: 'u2',
    name: 'Trần Thị Khách',
    phone: '0900000002',
    password: '123',
    cccd: '001090000002',
    role: UserRole.CUSTOMER,
    address: '123 Đường Láng, Hà Nội',
    email: 'khach@example.com',
    isDeleted: false,
  },
  {
    id: 'u3',
    name: 'Công ty TNHH ABC',
    phone: '0900000003',
    password: '123',
    cccd: '001090000003',
    role: UserRole.CUSTOMER,
    address: 'Khu Công Nghiệp X',
    isDeleted: false,
  },
];

export const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: 'a1',
    userId: 'u2',
    accountNumber: '19001001',
    balance: 5000000,
    isActive: true,
    type: 'PAYMENT',
  },
  {
    id: 'a2',
    userId: 'u2',
    accountNumber: '19009999',
    balance: 20000000,
    isActive: true,
    type: 'SAVINGS',
  },
  {
    id: 'a3',
    userId: 'u3',
    accountNumber: '88880001',
    balance: 150000000,
    isActive: true,
    type: 'BUSINESS',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    toAccountId: 'a1',
    amount: 5000000,
    type: 'DEPOSIT',
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    description: 'Nạp tiền lần đầu',
  },
  {
    id: 't2',
    toAccountId: 'a1',
    amount: 200000,
    type: 'DEPOSIT_ATM',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Nộp tiền mặt tại ATM Nguyễn Chí Thanh',
  },
  {
    id: 't3',
    fromAccountId: 'a1',
    amount: 500000,
    type: 'WITHDRAW_ATM',
    date: new Date().toISOString(),
    description: 'Rút tiền ATM',
  },
];

export const INITIAL_REMINDERS: TransactionReminder[] = [
  {
    id: 'r1',
    userId: 'u2',
    toAccountNumber: '19009999',
    amount: 1000000,
    frequency: 'MONTHLY',
    nextDueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    description: 'Tiết kiệm hàng tháng',
    createdDate: new Date().toISOString(),
  },
  {
    id: 'r2',
    userId: 'u2',
    toAccountNumber: '9876543210',
    amount: 500000,
    frequency: 'MONTHLY',
    nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    description: 'Tiền điện',
    createdDate: new Date().toISOString(),
  }
];