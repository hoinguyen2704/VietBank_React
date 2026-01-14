import React, { useState } from 'react';
import { AppState, User, BankAccount, Transaction, UserRole, TransactionReminder } from './types';
import { INITIAL_USERS, INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_REMINDERS } from './constants';
import { CustomerView } from './views/CustomerView';
import { StaffView } from './views/StaffView';
import { AdminView } from './views/AdminView';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { Lock, Phone, UserPlus, ArrowRight, Shield } from 'lucide-react';

export default function App() {
  // --- Simulating Backend State ---
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [reminders, setReminders] = useState<TransactionReminder[]>(INITIAL_REMINDERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- Auth State ---
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Register State
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    cccd: '',
    password: '',
    confirmPassword: ''
  });

  // --- Logic ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.phone === loginPhone && u.password === loginPassword && !u.isDeleted);
    if (user) {
      setCurrentUser(user);
      setAuthError('');
    } else {
      setAuthError('Số điện thoại hoặc mật khẩu không đúng');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (registerData.password !== registerData.confirmPassword) {
        setAuthError('Mật khẩu xác nhận không khớp');
        return;
    }
    if (users.some(u => u.phone === registerData.phone)) {
        setAuthError('Số điện thoại này đã được đăng ký');
        return;
    }

    // Create User
    const newUserId = `u${Date.now()}`;
    const newUser: User = {
        id: newUserId,
        name: registerData.name,
        phone: registerData.phone,
        password: registerData.password,
        cccd: registerData.cccd,
        role: UserRole.CUSTOMER,
        isDeleted: false,
    };

    // Create Default Payment Account for new user
    const newAccount: BankAccount = {
        id: `a${Date.now()}`,
        userId: newUserId,
        accountNumber: `1900${Math.floor(100000 + Math.random() * 900000)}`, // Random 10 digit-ish number
        balance: 0,
        isActive: true,
        type: 'PAYMENT'
    };

    // Update State
    setUsers([...users, newUser]);
    setAccounts([...accounts, newAccount]);
    
    // Auto Login
    setCurrentUser(newUser);
    setAuthError('');
    setIsRegistering(false);
    // Reset form
    setRegisterData({ name: '', phone: '', cccd: '', password: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPhone('');
    setLoginPassword('');
    setAuthError('');
  };

  // Staff/Admin Actions
  const handleAddUser = (newUser: Omit<User, 'id' | 'isDeleted'>) => {
    const user: User = {
      ...newUser,
      id: `u${Date.now()}`,
      isDeleted: false,
    };
    setUsers([...users, user]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating self
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isDeleted: true } : u));
  };

  const handleAddAccount = (userId: string) => {
    const user = users.find(u => u.id === userId);
    // Logic: If user name contains "Công ty", default to Business, else Payment (Simplified for demo)
    const type = user?.name.toLowerCase().includes('công ty') ? 'BUSINESS' : 'PAYMENT';
    
    const newAccount: BankAccount = {
        id: `a${Date.now()}`,
        userId,
        accountNumber: `${type === 'BUSINESS' ? '88' : '19'}00${Math.floor(1000 + Math.random() * 9000)}`,
        balance: 0,
        isActive: true,
        type: type
    };
    setAccounts([...accounts, newAccount]);
  };

  const handleDeposit = (accountId: string, amount: number) => {
    if (amount <= 0 || isNaN(amount)) {
        alert("Số tiền nạp phải lớn hơn 0");
        return;
    }
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    if (!account.isActive) {
        alert("Tài khoản này đang bị khóa, không thể nạp tiền!");
        return;
    }

    setAccounts(accounts.map(a => a.id === accountId ? { ...a, balance: a.balance + amount } : a));
    
    const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        toAccountId: accountId,
        amount,
        type: 'DEPOSIT',
        date: new Date().toISOString(),
        description: 'Nộp tiền tại quầy'
    };
    setTransactions([newTransaction, ...transactions]);
  };

  // Logic for realtime Deposit simulation (QR/ATM)
  const handleSimulateDeposit = (accountId: string, amount: number, type: 'DEPOSIT_ATM' | 'DEPOSIT_QR') => {
      const account = accounts.find(a => a.id === accountId);
      if (!account || !account.isActive) {
          alert("Tài khoản không tồn tại hoặc đang bị khóa!");
          return;
      }
      setAccounts(accounts.map(a => a.id === accountId ? { ...a, balance: a.balance + amount } : a));
      const newTransaction: Transaction = {
          id: `t${Date.now()}`,
          toAccountId: accountId,
          amount,
          type: type,
          date: new Date().toISOString(),
          description: type === 'DEPOSIT_QR' ? 'Nhận tiền qua mã QR' : 'Nộp tiền mặt tại ATM'
      };
      setTransactions([newTransaction, ...transactions]);
      alert(`Đã nhận ${amount.toLocaleString()} VND vào tài khoản!`);
  };

  const handleToggleAccountStatus = (accountId: string) => {
    setAccounts(accounts.map(a => a.id === accountId ? { ...a, isActive: !a.isActive } : a));
  };

  // Customer Actions
  const handleTransfer = (fromAccountId: string, toAccountNumber: string, amount: number, note: string) => {
    if (amount <= 0 || isNaN(amount)) {
        alert("Số tiền chuyển phải lớn hơn 0!");
        return;
    }

    const sourceAccount = accounts.find(a => a.id === fromAccountId);
    const destAccount = accounts.find(a => a.accountNumber === toAccountNumber);

    if (!sourceAccount) {
        alert("Tài khoản nguồn không hợp lệ!");
        return;
    }
    if (!sourceAccount.isActive) {
        alert("Tài khoản nguồn đang bị khóa!");
        return;
    }
    if (sourceAccount.balance < amount) {
        alert("Số dư không đủ!");
        return;
    }
    if (!destAccount) {
        alert("Tài khoản thụ hưởng không tồn tại!");
        return;
    }
    if (!destAccount.isActive) {
        alert("Tài khoản thụ hưởng đang bị khóa hoặc không hoạt động!");
        return;
    }
    if (sourceAccount.id === destAccount.id) {
        alert("Không thể chuyển cho chính mình trong cùng tài khoản!");
        return;
    }

    // Process Transaction
    setAccounts(prev => prev.map(a => {
        if (a.id === sourceAccount.id) return { ...a, balance: a.balance - amount };
        if (a.id === destAccount.id) return { ...a, balance: a.balance + amount };
        return a;
    }));

    const transaction: Transaction = {
        id: `t${Date.now()}`,
        fromAccountId: sourceAccount.id,
        toAccountId: destAccount.id,
        amount,
        type: 'TRANSFER',
        date: new Date().toISOString(),
        description: note || `Chuyển tiền đến ${toAccountNumber}`
    };
    setTransactions([transaction, ...transactions]);
  };

  const handleWithdrawExternal = (fromAccountId: string, amount: number, description: string) => {
     if (amount <= 0 || isNaN(amount)) {
         alert("Số tiền rút phải lớn hơn 0!");
         return;
     }
     
     const account = accounts.find(a => a.id === fromAccountId);
     if (!account || !account.isActive) {
         alert("Tài khoản không hợp lệ hoặc đang bị khóa!");
         return;
     }
     
     if (account.balance < amount) {
         alert("Số dư không đủ!");
         return;
     }

     setAccounts(prev => prev.map(a => {
         if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
         return a;
     }));
     const transaction: Transaction = {
         id: `t${Date.now()}`,
         fromAccountId: fromAccountId,
         amount,
         type: 'WITHDRAW_EXTERNAL',
         date: new Date().toISOString(),
         description: description
     };
     setTransactions([transaction, ...transactions]);
  };

  const handleAddReminder = (reminder: Omit<TransactionReminder, 'id' | 'createdDate'>) => {
    const newReminder: TransactionReminder = {
      ...reminder,
      id: `r${Date.now()}`,
      createdDate: new Date().toISOString(),
    };
    setReminders([...reminders, newReminder]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  // --- Render ---

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all duration-300">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {isRegistering ? <UserPlus className="text-white w-8 h-8" /> : <Lock className="text-white w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập VNBank'}</h1>
            <p className="text-gray-500 text-sm mt-2">{isRegistering ? 'Tạo tài khoản mới và bắt đầu giao dịch' : 'Hệ thống Ngân hàng Lõi'}</p>
          </div>

          {authError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 mb-6 rounded-lg text-center border border-red-100 flex items-center justify-center">
                  <Shield size={14} className="mr-2"/> {authError}
              </div>
          )}

          {isRegistering ? (
             // --- REGISTER FORM ---
             <form onSubmit={handleRegister} className="space-y-4">
                <Input 
                    label="Họ và tên" 
                    placeholder="Nguyễn Văn A" 
                    value={registerData.name}
                    onChange={e => setRegisterData({...registerData, name: e.target.value})}
                    required
                />
                <Input 
                    label="Số điện thoại" 
                    type="tel" 
                    placeholder="09..." 
                    value={registerData.phone}
                    onChange={e => setRegisterData({...registerData, phone: e.target.value})}
                    required
                />
                <Input 
                    label="CCCD/CMND" 
                    placeholder="001..." 
                    value={registerData.cccd}
                    onChange={e => setRegisterData({...registerData, cccd: e.target.value})}
                    required
                />
                <Input 
                    label="Mật khẩu" 
                    type="password" 
                    placeholder="Tạo mật khẩu" 
                    value={registerData.password}
                    onChange={e => setRegisterData({...registerData, password: e.target.value})}
                    required
                />
                <Input 
                    label="Nhập lại mật khẩu" 
                    type="password" 
                    placeholder="Xác nhận mật khẩu" 
                    value={registerData.confirmPassword}
                    onChange={e => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    required
                />
                <Button type="submit" fullWidth className="py-3 text-lg mt-4">
                    Đăng ký ngay
                </Button>
             </form>
          ) : (
            // --- LOGIN FORM ---
            <form onSubmit={handleLogin} className="space-y-6">
                <Input 
                    label="Số điện thoại" 
                    type="tel" 
                    placeholder="Nhập số điện thoại" 
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    icon={<Phone size={18} />}
                />
                <Input 
                    label="Mật khẩu" 
                    type="password" 
                    placeholder="Nhập mật khẩu" 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                />
                <div className="flex justify-end">
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-800">Quên mật khẩu?</button>
                </div>
                <Button type="submit" fullWidth className="py-3 text-lg">
                    Đăng nhập <ArrowRight size={18} className="ml-2 inline-block"/>
                </Button>
            </form>
          )}

          {/* Toggle Login/Register */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            {isRegistering ? (
                <p className="text-gray-600">
                    Đã có tài khoản?{' '}
                    <button 
                        onClick={() => { setIsRegistering(false); setAuthError(''); }} 
                        className="text-blue-700 font-semibold hover:underline"
                    >
                        Đăng nhập
                    </button>
                </p>
            ) : (
                <p className="text-gray-600">
                    Chưa có tài khoản?{' '}
                    <button 
                        onClick={() => { setIsRegistering(true); setAuthError(''); }} 
                        className="text-blue-700 font-semibold hover:underline"
                    >
                        Đăng ký ngay
                    </button>
                </p>
            )}
          </div>

          {/* Quick Login Helper for Demo (Only on Login screen) */}
          {!isRegistering && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-400 text-center mb-3 uppercase font-bold tracking-wider">Tài khoản Demo</p>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => { setLoginPhone('0999999999'); setLoginPassword('123'); }}
                        className="p-2 text-xs bg-white hover:bg-indigo-50 hover:border-indigo-300 rounded text-indigo-700 border border-gray-200 transition-colors"
                    >
                        Admin
                    </button>
                    <button 
                        onClick={() => { setLoginPhone('0900000001'); setLoginPassword('123'); }}
                        className="p-2 text-xs bg-white hover:bg-blue-50 hover:border-blue-300 rounded text-gray-700 border border-gray-200 transition-colors"
                    >
                        Staff
                    </button>
                    <button 
                        onClick={() => { setLoginPhone('0900000002'); setLoginPassword('123'); }}
                        className="p-2 text-xs bg-white hover:bg-green-50 hover:border-green-300 rounded text-gray-700 border border-gray-200 transition-colors"
                    >
                        Khách
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
        {currentUser.role === UserRole.CUSTOMER && (
            <CustomerView 
                currentUser={currentUser}
                accounts={accounts.filter(a => a.userId === currentUser.id)}
                transactions={transactions}
                reminders={reminders.filter(r => r.userId === currentUser.id)}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateUser}
                onTransfer={handleTransfer}
                onWithdraw={handleWithdrawExternal}
                onSimulateDeposit={handleSimulateDeposit}
                onAddReminder={handleAddReminder}
                onDeleteReminder={handleDeleteReminder}
            />
        )}
        {currentUser.role === UserRole.STAFF && (
            <StaffView 
                currentUser={currentUser}
                users={users}
                accounts={accounts}
                onLogout={handleLogout}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddAccount={handleAddAccount}
                onDeposit={handleDeposit}
                onToggleAccountStatus={handleToggleAccountStatus}
            />
        )}
        {currentUser.role === UserRole.ADMIN && (
            <AdminView 
                currentUser={currentUser}
                users={users}
                accounts={accounts}
                transactions={transactions}
                reminders={reminders}
                onLogout={handleLogout}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddAccount={handleAddAccount}
                onDeposit={handleDeposit}
                onToggleAccountStatus={handleToggleAccountStatus}
                onDeleteReminder={handleDeleteReminder}
            />
        )}
    </>
  );
}