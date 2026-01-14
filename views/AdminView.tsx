import React, { useState } from 'react';
import { User, UserRole, TransactionReminder, BankAccount, Transaction } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Users, Briefcase, Plus, Trash2, Edit, ShieldCheck, Database, CalendarClock, UserCheck, Search, Wallet, Building2, DollarSign, Ban, CheckCircle, LayoutDashboard, TrendingUp, Activity, PieChart } from 'lucide-react';

interface AdminViewProps {
  currentUser: User;
  users: User[];
  accounts: BankAccount[];
  transactions: Transaction[];
  reminders: TransactionReminder[];
  onLogout: () => void;
  onAddUser: (user: Omit<User, 'id' | 'isDeleted'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddAccount: (userId: string) => void;
  onDeposit: (accountId: string, amount: number) => void;
  onToggleAccountStatus: (accountId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  users,
  accounts,
  transactions,
  reminders,
  onLogout,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onDeleteReminder,
  onAddAccount,
  onDeposit,
  onToggleAccountStatus
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'customers' | 'departments' | 'system'>('dashboard');
  
  // Staff State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '', phone: '', cccd: '', password: '123', department: '', position: ''
  });

  // Edit Staff State
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffData, setEditStaffData] = useState({
    name: '', phone: '', cccd: '', department: '', position: ''
  });

  // Customer Management State
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', cccd: '', password: '123' });
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAccountId, setDepositAccountId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const staffUsers = users.filter(u => u.role === UserRole.STAFF && !u.isDeleted);
  
  // Filter customers
  const filteredCustomers = users.filter(u => 
    u.role === UserRole.CUSTOMER && !u.isDeleted &&
    (u.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
     u.phone.includes(customerSearchTerm) ||
     u.cccd.includes(customerSearchTerm))
  );

  // --- ANALYTICS CALCULATIONS ---
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalCustomers = users.filter(u => u.role === UserRole.CUSTOMER && !u.isDeleted).length;
  const totalStaff = users.filter(u => u.role === UserRole.STAFF && !u.isDeleted).length;
  const totalTransactionsCount = transactions.length;

  // Account Type Distribution
  const paymentAccountsCount = accounts.filter(a => a.type === 'PAYMENT').length;
  const savingsAccountsCount = accounts.filter(a => a.type === 'SAVINGS').length;
  const businessAccountsCount = accounts.filter(a => a.type === 'BUSINESS').length;
  const totalAccountsCount = accounts.length || 1; // Avoid divide by zero

  // Transaction Types (Simplified Bar Data)
  const depositCount = transactions.filter(t => t.type.includes('DEPOSIT')).length;
  const withdrawCount = transactions.filter(t => t.type.includes('WITHDRAW')).length;
  const transferCount = transactions.filter(t => t.type === 'TRANSFER').length;
  const maxTransCount = Math.max(depositCount, withdrawCount, transferCount) || 1;

  // Top Potential Customers Logic
  // 1. Map Account IDs to User IDs
  const accountOwnerMap: Record<string, string> = {};
  accounts.forEach(a => { accountOwnerMap[a.id] = a.userId; });

  // 2. Count Transactions per User
  const userTransactionCounts: Record<string, number> = {};
  transactions.forEach(t => {
      const fromUser = t.fromAccountId ? accountOwnerMap[t.fromAccountId] : null;
      const toUser = t.toAccountId ? accountOwnerMap[t.toAccountId] : null;

      if (fromUser) userTransactionCounts[fromUser] = (userTransactionCounts[fromUser] || 0) + 1;
      if (toUser && toUser !== fromUser) userTransactionCounts[toUser] = (userTransactionCounts[toUser] || 0) + 1;
  });

  // 3. Sort and Get Top 5
  const topCustomers = Object.entries(userTransactionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([userId, count]) => {
          const user = users.find(u => u.id === userId);
          // Calculate total balance for this user
          const userBalance = accounts.filter(a => a.userId === userId).reduce((s, a) => s + a.balance, 0);
          return {
              user,
              count,
              balance: userBalance
          };
      })
      .filter(item => item.user); // Filter out unknown users


  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({ 
        ...newStaff, 
        role: UserRole.STAFF,
    });
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', phone: '', cccd: '', password: '123', department: '', position: '' });
  };

  const handleOpenEditStaff = (staff: User) => {
    setEditingStaffId(staff.id);
    setEditStaffData({
        name: staff.name,
        phone: staff.phone,
        cccd: staff.cccd,
        department: staff.department || '',
        position: staff.position || ''
    });
    setIsEditStaffOpen(true);
  };

  const handleEditStaffSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStaffId) return;

      const originalUser = users.find(u => u.id === editingStaffId);
      if (!originalUser) return;

      const updatedUser: User = {
          ...originalUser,
          name: editStaffData.name,
          phone: editStaffData.phone,
          cccd: editStaffData.cccd,
          department: editStaffData.department,
          position: editStaffData.position
      };

      onUpdateUser(updatedUser);
      setIsEditStaffOpen(false);
      setEditingStaffId(null);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
        ...newCustomer,
        role: UserRole.CUSTOMER
    });
    setIsAddCustomerOpen(false);
    setNewCustomer({ name: '', phone: '', cccd: '', password: '123' });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (depositAccountId) {
          onDeposit(depositAccountId, Number(depositAmount));
          setIsDepositOpen(false);
          setDepositAmount('');
          setDepositAccountId(null);
      }
  };

  const getOwnerName = (userId: string) => {
      const u = users.find(user => user.id === userId);
      return u ? u.name : 'Unknown User';
  };

  const getAccountTypeLabel = (type: string) => {
      switch(type) {
          case 'BUSINESS': return 'Tài khoản Doanh nghiệp';
          case 'SAVINGS': return 'Tài khoản Tiết kiệm';
          default: return 'Tài khoản Thanh toán';
      }
  };

  // Helper for Donut Chart Slices
  const createDonutSlice = (percent: number, color: string, offset: number) => {
    const circumference = 2 * Math.PI * 15.9155; // Radius approx 16
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -1 * (offset / 100) * circumference;
    return (
      <circle
        r="15.9155"
        cx="50%"
        cy="50%"
        fill="transparent"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
       {/* Header */}
       <header className="bg-white shadow-sm z-10 sticky top-0 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-700 p-2 rounded-lg">
                <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">VNBank Admin</span>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm text-gray-600">Admin: {currentUser.name}</span>
             <Button variant="secondary" onClick={onLogout} className="text-sm">Đăng xuất</Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
              <nav className="p-4 space-y-1">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                      <LayoutDashboard size={18} /> <span>Dashboard</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('staff')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                      <Users size={18} /> <span>Quản lý Nhân viên</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('customers')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'customers' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                      <UserCheck size={18} /> <span>Quản lý Khách hàng</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('departments')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'departments' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                      <Briefcase size={18} /> <span>Phòng ban & Vị trí</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('system')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                      <Database size={18} /> <span>Quản lý Dữ liệu</span>
                  </button>
              </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 p-8">
              {activeTab === 'dashboard' && (
                  <div className="space-y-8">
                      {/* 1. Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Customers Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-15 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                                            <UserCheck size={24} className="text-white" />
                                        </div>
                                        <span className="flex items-center text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                                            <TrendingUp size={12} className="mr-1" /> +12%
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-blue-100 text-sm font-medium tracking-wide opacity-90">Tổng Khách hàng</p>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight">{totalCustomers}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-2xl shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-15 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                                            <Users size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-purple-100 text-sm font-medium tracking-wide opacity-90">Tổng Nhân viên</p>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight">{totalStaff}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Assets Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-15 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                                            <Wallet size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-emerald-100 text-sm font-medium tracking-wide opacity-90">Tổng Tài sản</p>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight">{new Intl.NumberFormat('vi-VN', { notation: "compact", maximumFractionDigits: 1 }).format(totalBalance)}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-15 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                                            <Activity size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-orange-100 text-sm font-medium tracking-wide opacity-90">Tổng Giao dịch</p>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight">{totalTransactionsCount}</h3>
                                    </div>
                                </div>
                            </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* 2. Charts Section */}
                          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <h3 className="font-semibold text-lg text-gray-800 mb-6 flex items-center">
                                  <PieChart size={18} className="mr-2 text-indigo-600" /> Cơ cấu Tài khoản
                              </h3>
                              <div className="relative w-48 h-48 mx-auto mb-6">
                                  <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                                      {/* Background Circle */}
                                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f3f4f6" strokeWidth="6"></circle>
                                      
                                      {/* Slices */}
                                      {createDonutSlice((paymentAccountsCount / totalAccountsCount) * 100, '#3b82f6', 0)} 
                                      {createDonutSlice((savingsAccountsCount / totalAccountsCount) * 100, '#10b981', (paymentAccountsCount / totalAccountsCount) * 100)}
                                      {createDonutSlice((businessAccountsCount / totalAccountsCount) * 100, '#8b5cf6', ((paymentAccountsCount + savingsAccountsCount) / totalAccountsCount) * 100)}
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                                      <span className="text-xs text-gray-400">Tổng</span>
                                      <span className="text-xl font-bold text-gray-800">{totalAccountsCount}</span>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Thanh toán</div>
                                      <span className="font-semibold">{paymentAccountsCount}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Tiết kiệm</div>
                                      <span className="font-semibold">{savingsAccountsCount}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>Doanh nghiệp</div>
                                      <span className="font-semibold">{businessAccountsCount}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <h3 className="font-semibold text-lg text-gray-800 mb-6 flex items-center">
                                  <TrendingUp size={18} className="mr-2 text-indigo-600" /> Phân loại Giao dịch
                              </h3>
                              <div className="flex items-end justify-around h-64 border-b border-gray-100 pb-4">
                                  <div className="flex flex-col items-center w-1/4 group">
                                      <div className="text-xs text-gray-500 mb-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{depositCount} lượt</div>
                                      <div className="w-16 bg-green-100 rounded-t-lg relative group-hover:bg-green-200 transition-colors" style={{ height: `${(depositCount / maxTransCount) * 100}%`, minHeight: '24px' }}>
                                          <div className="absolute bottom-0 w-full bg-green-500 rounded-t-lg transition-all duration-500" style={{ height: '30%' }}></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600 mt-3">Nạp tiền</span>
                                  </div>
                                  <div className="flex flex-col items-center w-1/4 group">
                                      <div className="text-xs text-gray-500 mb-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{transferCount} lượt</div>
                                      <div className="w-16 bg-blue-100 rounded-t-lg relative group-hover:bg-blue-200 transition-colors" style={{ height: `${(transferCount / maxTransCount) * 100}%`, minHeight: '24px' }}>
                                           <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all duration-500" style={{ height: '30%' }}></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600 mt-3">Chuyển khoản</span>
                                  </div>
                                  <div className="flex flex-col items-center w-1/4 group">
                                      <div className="text-xs text-gray-500 mb-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{withdrawCount} lượt</div>
                                      <div className="w-16 bg-red-100 rounded-t-lg relative group-hover:bg-red-200 transition-colors" style={{ height: `${(withdrawCount / maxTransCount) * 100}%`, minHeight: '24px' }}>
                                           <div className="absolute bottom-0 w-full bg-red-500 rounded-t-lg transition-all duration-500" style={{ height: '30%' }}></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600 mt-3">Rút tiền</span>
                                  </div>
                              </div>
                              <p className="text-center text-xs text-gray-400 mt-4">Biểu đồ thể hiện tỷ trọng số lượng giao dịch trong hệ thống.</p>
                          </div>
                      </div>

                      {/* 3. Top Potential Customers */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                               <h3 className="font-semibold text-lg flex items-center text-gray-800">
                                   <UserCheck size={18} className="mr-2 text-indigo-600" /> Top Khách hàng Tiềm năng
                               </h3>
                               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Theo tần suất giao dịch</span>
                           </div>
                           <table className="w-full text-left">
                               <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                   <tr>
                                       <th className="p-4 font-medium w-10">#</th>
                                       <th className="p-4 font-medium">Khách hàng</th>
                                       <th className="p-4 font-medium">Số điện thoại</th>
                                       <th className="p-4 font-medium text-right">Tổng tài sản</th>
                                       <th className="p-4 font-medium text-center">Số giao dịch</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                   {topCustomers.map((item, index) => (
                                       <tr key={item.user!.id} className="hover:bg-gray-50">
                                           <td className="p-4 text-gray-400 font-mono text-sm">{index + 1}</td>
                                           <td className="p-4">
                                               <div className="font-medium text-gray-900">{item.user!.name}</div>
                                               <div className="text-xs text-gray-500">{item.user!.email || 'Chưa cập nhật email'}</div>
                                           </td>
                                           <td className="p-4 text-sm text-gray-600">{item.user!.phone}</td>
                                           <td className="p-4 text-right font-medium text-green-700">
                                               {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.balance)}
                                           </td>
                                           <td className="p-4 text-center">
                                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                   {item.count}
                                               </span>
                                           </td>
                                       </tr>
                                   ))}
                                   {topCustomers.length === 0 && (
                                       <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có dữ liệu giao dịch.</td></tr>
                                   )}
                               </tbody>
                           </table>
                      </div>
                  </div>
              )}

              {activeTab === 'staff' && (
                  <div>
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-900">Danh sách Nhân viên</h2>
                          <Button onClick={() => setIsAddStaffOpen(true)}>
                              <Plus size={16} className="mr-2" /> Thêm Nhân viên
                          </Button>
                      </div>

                      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                          <table className="w-full text-left">
                              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                  <tr>
                                      <th className="p-4 font-medium">Họ tên</th>
                                      <th className="p-4 font-medium">Thông tin liên hệ</th>
                                      <th className="p-4 font-medium">Phòng ban</th>
                                      <th className="p-4 font-medium">Vị trí</th>
                                      <th className="p-4 font-medium text-right">Thao tác</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {staffUsers.map(staff => (
                                      <tr key={staff.id} className="hover:bg-gray-50">
                                          <td className="p-4 font-medium text-gray-900">{staff.name}</td>
                                          <td className="p-4 text-gray-600 text-sm">
                                              <div>{staff.phone}</div>
                                              <div className="text-xs text-gray-400">{staff.cccd}</div>
                                          </td>
                                          <td className="p-4 text-gray-600">{staff.department || '-'}</td>
                                          <td className="p-4">
                                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{staff.position || 'Staff'}</span>
                                          </td>
                                          <td className="p-4 text-right">
                                              <div className="flex items-center justify-end space-x-2">
                                                  <button onClick={() => handleOpenEditStaff(staff)} className="text-blue-500 hover:text-blue-700 p-2" title="Sửa thông tin">
                                                      <Edit size={16} />
                                                  </button>
                                                  <button onClick={() => onDeleteUser(staff.id)} className="text-red-500 hover:text-red-700 p-2" title="Xóa nhân viên">
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                                  {staffUsers.length === 0 && (
                                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có nhân viên nào.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {activeTab === 'customers' && (
                  <div className="flex gap-6 h-[calc(100vh-8rem)]">
                       {/* Left Col: Customer List */}
                        <div className="w-1/3 flex flex-col space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-semibold text-gray-800">Tra cứu Khách hàng</h2>
                                    <Button size="sm" onClick={() => setIsAddCustomerOpen(true)}><Plus size={16} /></Button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                    type="text" 
                                    placeholder="Tìm theo Tên, SĐT, CCCD..." 
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={customerSearchTerm}
                                    onChange={e => setCustomerSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col border border-gray-200">
                                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {filteredCustomers.map(user => (
                                    <div 
                                    key={user.id}
                                    onClick={() => setSelectedCustomer(user)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedCustomer?.id === user.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'hover:bg-gray-50 border-transparent'}`}
                                    >
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                        <span>{user.phone}</span>
                                        <span>{user.cccd}</span>
                                    </div>
                                    </div>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy khách hàng.</div>
                                )}
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Details */}
                        <div className="w-2/3 h-full overflow-y-auto">
                           {selectedCustomer ? (
                             <div className="space-y-6">
                                {/* Customer Info Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                                            <p className="text-gray-500 flex items-center mt-1"><UserCheck size={14} className="mr-1"/> Khách hàng</p>
                                        </div>
                                        <div className="flex space-x-2">
                                             <Button variant="secondary" onClick={() => alert("Tính năng chỉnh sửa đang phát triển")}>
                                                <Edit size={16} className="mr-2" /> Sửa
                                             </Button>
                                             <Button variant="danger" onClick={() => { 
                                                 if(window.confirm('Xóa khách hàng này?')) {
                                                     onDeleteUser(selectedCustomer.id);
                                                     setSelectedCustomer(null);
                                                 }
                                             }}>
                                                <Trash2 size={16} className="mr-2" /> Xóa
                                             </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <span className="block text-gray-500 text-xs uppercase">Số điện thoại</span>
                                            <span className="font-medium text-base">{selectedCustomer.phone}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs uppercase">CCCD/CMND</span>
                                            <span className="font-medium text-base">{selectedCustomer.cccd}</span>
                                        </div>
                                        <div className="col-span-2 border-t pt-2 mt-2">
                                            <span className="block text-gray-500 text-xs uppercase">Địa chỉ</span>
                                            <span className="font-medium">{selectedCustomer.address || 'Chưa cập nhật'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Accounts Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold flex items-center">
                                            <Wallet className="w-5 h-5 mr-2 text-gray-600" /> Tài khoản ngân hàng
                                        </h3>
                                        <Button size="sm" variant="secondary" onClick={() => onAddAccount(selectedCustomer.id)}>
                                            <Plus size={16} className="mr-1" /> Thêm tài khoản
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {accounts.filter(a => a.userId === selectedCustomer.id).map(account => (
                                            <div key={account.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono font-bold text-lg text-gray-800">{account.accountNumber}</span>
                                                        {!account.isActive && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">Bị khóa</span>}
                                                        {account.type === 'BUSINESS' && <Building2 size={16} className="text-purple-600"/>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{getAccountTypeLabel(account.type)}</div>
                                                    <div className="text-green-600 font-semibold mt-1">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(account.balance)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button 
                                                        onClick={() => { setDepositAccountId(account.id); setIsDepositOpen(true); }}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg tooltip"
                                                        title="Nạp tiền"
                                                    >
                                                        <DollarSign size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => onToggleAccountStatus(account.id)}
                                                        className={`p-2 rounded-lg ${account.isActive ? 'text-orange-600 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                                                        title={account.isActive ? "Khóa tài khoản" : "Mở khóa"}
                                                    >
                                                        {account.isActive ? <Ban size={20} /> : <CheckCircle size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {accounts.filter(a => a.userId === selectedCustomer.id).length === 0 && (
                                            <p className="text-gray-500 text-center py-4 text-sm">Khách hàng chưa có tài khoản.</p>
                                        )}
                                    </div>
                                </div>
                             </div>
                           ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                <UserCheck size={64} className="mb-4 opacity-20" />
                                <p>Chọn một khách hàng để xem chi tiết</p>
                             </div>
                           )}
                        </div>
                  </div>
              )}

              {activeTab === 'departments' && (
                  <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Cấu trúc tổ chức</h2>
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <h3 className="font-semibold text-lg mb-4">Phòng ban</h3>
                              <ul className="space-y-2 text-gray-600">
                                  <li className="p-3 bg-gray-50 rounded-lg flex justify-between">Chi nhánh Hà Nội <span className="text-xs bg-gray-200 px-2 py-1 rounded">Mặc định</span></li>
                                  <li className="p-3 bg-gray-50 rounded-lg flex justify-between">Chi nhánh TP.HCM <span className="text-xs bg-gray-200 px-2 py-1 rounded">Mặc định</span></li>
                                  <li className="p-3 bg-gray-50 rounded-lg flex justify-between">Khối Công nghệ <span className="text-xs bg-gray-200 px-2 py-1 rounded">Mặc định</span></li>
                              </ul>
                              <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                                  * Chức năng thêm/sửa phòng ban đang được phát triển.
                              </div>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <h3 className="font-semibold text-lg mb-4">Vị trí công việc</h3>
                              <ul className="space-y-2 text-gray-600">
                                  <li className="p-3 bg-gray-50 rounded-lg">Giao dịch viên</li>
                                  <li className="p-3 bg-gray-50 rounded-lg">Kiểm soát viên</li>
                                  <li className="p-3 bg-gray-50 rounded-lg">Giám đốc chi nhánh</li>
                                  <li className="p-3 bg-gray-50 rounded-lg">Chuyên viên tín dụng</li>
                              </ul>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'system' && (
                  <div>
                       <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản trị Dữ liệu Hệ thống</h2>
                       
                       {/* Reminders Monitoring */}
                       <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                               <h3 className="font-semibold text-lg flex items-center">
                                   <CalendarClock className="w-5 h-5 mr-2 text-indigo-600"/> 
                                   Toàn bộ Lịch nhắc nợ (Toàn hệ thống)
                               </h3>
                               <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{reminders.length} bản ghi</span>
                           </div>
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                  <tr>
                                      <th className="p-4 font-medium">Khách hàng</th>
                                      <th className="p-4 font-medium">Mô tả</th>
                                      <th className="p-4 font-medium">Đến số TK</th>
                                      <th className="p-4 font-medium">Tần suất</th>
                                      <th className="p-4 font-medium text-right">Số tiền</th>
                                      <th className="p-4 font-medium text-right">Thao tác</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {reminders.map(rem => (
                                      <tr key={rem.id} className="hover:bg-gray-50">
                                          <td className="p-4 text-sm font-medium text-gray-900">{getOwnerName(rem.userId)}</td>
                                          <td className="p-4 text-sm text-gray-600">{rem.description}</td>
                                          <td className="p-4 text-sm font-mono text-gray-600">{rem.toAccountNumber}</td>
                                          <td className="p-4 text-sm">
                                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">{rem.frequency}</span>
                                          </td>
                                          <td className="p-4 text-sm text-right font-medium">
                                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rem.amount)}
                                          </td>
                                          <td className="p-4 text-right">
                                              <button onClick={() => onDeleteReminder(rem.id)} className="text-red-500 hover:text-red-700 p-2" title="Xóa lịch này">
                                                  <Trash2 size={16} />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                                  {reminders.length === 0 && (
                                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">Không có dữ liệu lịch nhắc.</td></tr>
                                  )}
                              </tbody>
                          </table>
                       </div>
                  </div>
              )}
          </main>
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} title="Thêm Nhân viên mới">
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
            <Input label="Họ và tên" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} required />
            <Input label="Số điện thoại" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} required />
            <Input label="CCCD/CMND" value={newStaff.cccd} onChange={e => setNewStaff({...newStaff, cccd: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Phòng ban" 
                    placeholder="VD: Chi nhánh HN"
                    value={newStaff.department} 
                    onChange={e => setNewStaff({...newStaff, department: e.target.value})} 
                />
                <Input 
                    label="Vị trí" 
                    placeholder="VD: Giao dịch viên"
                    value={newStaff.position} 
                    onChange={e => setNewStaff({...newStaff, position: e.target.value})} 
                />
            </div>
            <Input label="Mật khẩu khởi tạo" value={newStaff.password} readOnly className="bg-gray-100" />
            <div className="pt-2">
                <Button type="submit" fullWidth>Tạo nhân viên</Button>
            </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={isEditStaffOpen} onClose={() => setIsEditStaffOpen(false)} title="Cập nhật thông tin nhân viên">
        <form onSubmit={handleEditStaffSubmit} className="space-y-4">
            <Input label="Họ và tên" value={editStaffData.name} onChange={e => setEditStaffData({...editStaffData, name: e.target.value})} required />
            <Input label="Số điện thoại" value={editStaffData.phone} onChange={e => setEditStaffData({...editStaffData, phone: e.target.value})} required />
            <Input label="CCCD/CMND" value={editStaffData.cccd} onChange={e => setEditStaffData({...editStaffData, cccd: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Phòng ban" 
                    placeholder="VD: Chi nhánh HN"
                    value={editStaffData.department} 
                    onChange={e => setEditStaffData({...editStaffData, department: e.target.value})} 
                />
                <Input 
                    label="Vị trí" 
                    placeholder="VD: Giao dịch viên"
                    value={editStaffData.position} 
                    onChange={e => setEditStaffData({...editStaffData, position: e.target.value})} 
                />
            </div>
            <div className="pt-2">
                <Button type="submit" fullWidth>Lưu thay đổi</Button>
            </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="Thêm Khách hàng mới">
        <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
            <Input label="Họ và tên" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
            <Input label="Số điện thoại" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} required />
            <Input label="CCCD/CMND" value={newCustomer.cccd} onChange={e => setNewCustomer({...newCustomer, cccd: e.target.value})} required />
            <Input label="Mật khẩu mặc định" value={newCustomer.password} readOnly className="bg-gray-100" />
            <div className="pt-2">
                <Button type="submit" fullWidth>Tạo khách hàng</Button>
            </div>
        </form>
      </Modal>

       {/* Deposit Modal */}
       <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title="Nạp tiền vào tài khoản (Admin)">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                Đang nạp tiền vào tài khoản: <span className="font-mono font-bold">{accounts.find(a => a.id === depositAccountId)?.accountNumber}</span>
            </p>
            <Input 
                label="Số tiền (VND)" 
                type="number" 
                min={1000} 
                step={1000}
                value={depositAmount} 
                onChange={e => setDepositAmount(e.target.value)} 
                required 
                autoFocus
            />
            <div className="pt-2">
                <Button type="submit" fullWidth>Xác nhận nạp tiền</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};