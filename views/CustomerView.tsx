import React, { useState, useEffect, useRef } from 'react';
import { User, BankAccount, Transaction, TransactionReminder, Notification } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { CreditCard, Send, User as UserIcon, LogOut, History, Wallet, QrCode, ArrowDownCircle, ArrowUpCircle, Building2, AlertCircle, CalendarClock, Trash2, Bell, Check, X } from 'lucide-react';

interface CustomerViewProps {
  currentUser: User;
  accounts: BankAccount[];
  notifications: Notification[];
  onLogout: () => void;
  onUpdateProfile: (user: User) => void;
  onTransfer: (fromAccountId: string, toAccountNumber: string, amount: number, note: string) => void;
  onWithdraw: (fromAccountId: string, amount: number, description: string) => void;
  // Helper to simulate incoming money for demo
  onSimulateDeposit: (toAccountId: string, amount: number, type: 'DEPOSIT_ATM' | 'DEPOSIT_QR') => void; 
  transactions: Transaction[];
  reminders: TransactionReminder[];
  onAddReminder: (reminder: Omit<TransactionReminder, 'id' | 'createdDate'>) => void;
  onDeleteReminder: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: (userId: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  currentUser,
  accounts,
  notifications,
  onLogout,
  onUpdateProfile,
  onTransfer,
  onWithdraw,
  onSimulateDeposit,
  transactions,
  reminders,
  onAddReminder,
  onDeleteReminder,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'transfer' | 'deposit' | 'withdraw' | 'profile' | 'history' | 'reminders'>('home');
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '', note: '' });
  const [withdrawData, setWithdrawData] = useState({ amount: '', bankName: '', bankAccount: '', note: '' });
  const [profileData, setProfileData] = useState(currentUser);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  
  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const prevNotifCount = useRef(notifications.length);

  // Reminder State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderData, setReminderData] = useState({
      toAccountNumber: '',
      amount: '',
      frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      nextDueDate: '',
      description: ''
  });

  // Selected account for Transfer/Deposit/Withdraw operations
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  // Ensure selected account is valid, else fallback to first account
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Check balance for withdrawal
  const isInsufficientBalance = selectedAccount && withdrawData.amount ? Number(withdrawData.amount) > selectedAccount.balance : false;
  
  // Check balance for transfer
  const isInsufficientTransferBalance = selectedAccount && transferData.amount ? Number(transferData.amount) > selectedAccount.balance : false;

  // Notification Logic: Detect new notifications for Toast
  useEffect(() => {
      if (notifications.length > prevNotifCount.current) {
          const newNotif = notifications[0]; // Assuming new ones added to start
          if (!newNotif.isRead) {
              setLatestNotification(newNotif);
              // Auto hide toast after 5 seconds
              const timer = setTimeout(() => {
                  setLatestNotification(null);
              }, 5000);
              return () => clearTimeout(timer);
          }
      }
      prevNotifCount.current = notifications.length;
  }, [notifications]);

  // Filter transactions that involve any of the user's accounts
  const myRawTransactions = transactions.filter(t => 
    accounts.some(a => a.id === t.fromAccountId || a.id === t.toAccountId)
  );

  // Flatten transactions for display
  const historyItems = myRawTransactions.flatMap(t => {
        const items = [];
        const mySource = accounts.find(a => a.id === t.fromAccountId);
        const myDest = accounts.find(a => a.id === t.toAccountId);

        if (mySource) {
            let label = 'Chuyển tiền';
            if (t.type === 'WITHDRAW_ATM') label = 'Rút tiền ATM';
            if (t.type === 'WITHDRAW_EXTERNAL') label = 'Rút tiền';
            items.push({
                id: t.id + '_debit',
                originalDate: t.date,
                date: new Date(t.date).toLocaleDateString('vi-VN'),
                description: t.description,
                amount: -t.amount,
                typeLabel: label,
                accountNumber: mySource.accountNumber,
                isPositive: false
            });
        }
        
        if (myDest) {
            let label = 'Nhận tiền';
            if (t.type.includes('DEPOSIT')) label = 'Nạp tiền';
            if (t.type === 'TRANSFER') label = 'Nhận chuyển khoản';
            items.push({
                id: t.id + '_credit',
                originalDate: t.date,
                date: new Date(t.date).toLocaleDateString('vi-VN'),
                description: t.description,
                amount: t.amount,
                typeLabel: label,
                accountNumber: myDest.accountNumber,
                isPositive: true
            });
        }
        return items;
    }).sort((a, b) => new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime());


  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficientTransferBalance) return;
    setConfirmModalOpen(true);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccount) {
        if (isInsufficientBalance) {
            return;
        }
        onWithdraw(selectedAccount.id, Number(withdrawData.amount), `Rút về ${withdrawData.bankName} - ${withdrawData.bankAccount}: ${withdrawData.note}`);
        setWithdrawData({ amount: '', bankName: '', bankAccount: '', note: '' });
        // alert("Giao dịch rút tiền đã được gửi!"); // Removed alert to use notification system
        setActiveTab('history');
    }
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddReminder({
          userId: currentUser.id,
          toAccountNumber: reminderData.toAccountNumber,
          amount: Number(reminderData.amount),
          frequency: reminderData.frequency,
          nextDueDate: reminderData.nextDueDate,
          description: reminderData.description
      });
      setIsReminderModalOpen(false);
      setReminderData({ toAccountNumber: '', amount: '', frequency: 'MONTHLY', nextDueDate: '', description: '' });
  };

  const confirmTransfer = () => {
    if (selectedAccount && selectedAccount.isActive) {
      onTransfer(selectedAccount.id, transferData.toAccount, Number(transferData.amount), transferData.note);
      setTransferData({ toAccount: '', amount: '', note: '' });
      setConfirmModalOpen(false);
      setActiveTab('history');
    }
  };

  // Helper function for badges
  const getAccountTypeBadge = (type: string) => {
      switch(type) {
          case 'BUSINESS': return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold flex items-center"><Building2 size={12} className="mr-1"/> Doanh nghiệp</span>;
          case 'SAVINGS': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Tiết kiệm</span>;
          default: return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Thanh toán</span>;
      }
  };

  const getFrequencyLabel = (freq: string) => {
      switch(freq) {
          case 'DAILY': return 'Hàng ngày';
          case 'WEEKLY': return 'Hàng tuần';
          case 'MONTHLY': return 'Hàng tháng';
          default: return freq;
      }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Toast Notification */}
      {latestNotification && (
          <div className="fixed top-4 right-4 z-50 animate-bounce-in">
              <div className={`bg-white border-l-4 shadow-lg rounded-r-lg p-4 flex items-start max-w-sm ${latestNotification.type === 'SUCCESS' ? 'border-green-500' : latestNotification.type === 'ERROR' ? 'border-red-500' : 'border-blue-500'}`}>
                  <div className={`p-1 rounded-full mr-3 flex-shrink-0 ${latestNotification.type === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {latestNotification.type === 'SUCCESS' ? <Check size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm">{latestNotification.title}</h4>
                      <p className="text-gray-600 text-xs mt-1">{latestNotification.message}</p>
                      <button 
                        onClick={() => { onMarkAsRead(latestNotification.id); setLatestNotification(null); }}
                        className="text-xs text-blue-600 hover:underline mt-2"
                      >
                          Đánh dấu đã đọc
                      </button>
                  </div>
                  <button onClick={() => setLatestNotification(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                      <X size={14} />
                  </button>
              </div>
          </div>
      )}

      {/* Sidebar Mobile & Desktop */}
      <div className="bg-blue-900 text-white md:w-64 flex-shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-blue-700 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">VietBank</span>
          </div>
          
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('home')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <CreditCard size={18} /> <span>Tổng quan</span>
            </button>
            <button onClick={() => setActiveTab('transfer')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'transfer' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <Send size={18} /> <span>Chuyển khoản</span>
            </button>
            <button onClick={() => setActiveTab('reminders')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reminders' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <CalendarClock size={18} /> <span>Lịch nhắc nợ</span>
            </button>
            <button onClick={() => setActiveTab('deposit')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'deposit' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <ArrowDownCircle size={18} /> <span>Nạp tiền</span>
            </button>
            <button onClick={() => setActiveTab('withdraw')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'withdraw' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <ArrowUpCircle size={18} /> <span>Rút tiền</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <History size={18} /> <span>Lịch sử GD</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
              <UserIcon size={18} /> <span>Cá nhân</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-blue-800">
           <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-200 hover:text-white hover:bg-blue-800 rounded-lg">
             <LogOut size={20} />
             <span>Đăng xuất</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'home' && 'Tổng quan tài khoản'}
              {activeTab === 'transfer' && 'Chuyển khoản'}
              {activeTab === 'reminders' && 'Lịch nhắc nợ & Định kỳ'}
              {activeTab === 'deposit' && 'Nạp tiền vào tài khoản'}
              {activeTab === 'withdraw' && 'Rút tiền'}
              {activeTab === 'profile' && 'Thông tin cá nhân'}
              {activeTab === 'history' && 'Lịch sử giao dịch'}
            </h1>
            <p className="text-gray-500">Xin chào, {currentUser.name}</p>
          </div>
          <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                      <Bell size={24} />
                      {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
                              {unreadCount}
                          </span>
                      )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                              <h3 className="font-semibold text-gray-800">Thông báo</h3>
                              <button onClick={() => onMarkAllAsRead(currentUser.id)} className="text-xs text-blue-600 hover:underline">Đọc tất cả</button>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                              {notifications.length === 0 ? (
                                  <div className="p-6 text-center text-gray-500 text-sm">Không có thông báo mới</div>
                              ) : (
                                  notifications.map(notif => (
                                      <div 
                                        key={notif.id} 
                                        className={`p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                        onClick={() => onMarkAsRead(notif.id)}
                                      >
                                          <div className="flex justify-between items-start mb-1">
                                              <span className={`text-sm font-semibold ${notif.type === 'SUCCESS' ? 'text-green-600' : 'text-gray-800'}`}>{notif.title}</span>
                                              <span className="text-xs text-gray-400">{new Date(notif.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </header>

        {activeTab === 'home' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => (
              <div key={account.id} className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${account.isActive ? 'bg-white' : 'bg-gray-100'}`}>
                <div className={`absolute top-0 left-0 w-2 h-full ${account.type === 'BUSINESS' ? 'bg-purple-500' : account.type === 'SAVINGS' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex justify-between items-start mb-6 pl-4">
                  {getAccountTypeBadge(account.type)}
                  {!account.isActive && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Đã khóa</span>}
                </div>
                <div className="mb-2 pl-4">
                  <p className="text-sm text-gray-500">Số tài khoản</p>
                  <p className="text-xl font-mono tracking-wider font-semibold text-gray-800">{account.accountNumber}</p>
                </div>
                <div className="pl-4">
                  <p className="text-sm text-gray-500">Số dư hiện tại</p>
                  <p className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(account.balance)}</p>
                </div>
              </div>
            ))}
            
            {/* Quick Reminder View on Home */}
            <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                        <CalendarClock className="w-5 h-5 mr-2 text-blue-600"/> Nhắc nhở thanh toán sắp tới
                    </h3>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab('reminders')}>Xem tất cả</Button>
                </div>
                {reminders.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reminders.slice(0, 2).map(r => (
                             <div key={r.id} className="border p-4 rounded-lg flex justify-between items-center bg-blue-50 border-blue-100">
                                <div>
                                    <p className="font-semibold text-blue-900">{r.description}</p>
                                    <p className="text-sm text-blue-700">Đến: {r.toAccountNumber}</p>
                                    <p className="text-xs text-blue-500 mt-1">Lịch: {getFrequencyLabel(r.frequency)} - Ngày: {new Date(r.nextDueDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                     <span className="font-bold text-blue-800 block">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.amount)}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Chưa có lịch nhắc nhở nào.</p>
                )}
            </div>
          </div>
        )}

        {/* ... (Other tabs similar to previous implementation) ... */}
        {activeTab === 'reminders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Danh sách nhắc nợ / Thanh toán định kỳ</h3>
                            <Button onClick={() => setIsReminderModalOpen(true)}>
                                <CalendarClock size={16} className="mr-2" /> Tạo mới
                            </Button>
                        </div>
                        
                        {reminders.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Chưa có lịch nhắc nhở nào.</p>
                                <Button variant="ghost" className="mt-2 text-blue-600" onClick={() => setIsReminderModalOpen(true)}>Tạo lịch nhắc ngay</Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reminders.map(r => (
                                    <div key={r.id} className="flex flex-col md:flex-row justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-colors bg-white">
                                        <div className="flex items-start space-x-4 mb-3 md:mb-0 w-full md:w-auto">
                                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                                <CalendarClock size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{r.description}</h4>
                                                <div className="text-sm text-gray-500">Chuyển đến: <span className="font-mono">{r.toAccountNumber}</span></div>
                                                <div className="flex items-center space-x-3 mt-1 text-xs">
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{getFrequencyLabel(r.frequency)}</span>
                                                    <span className="text-gray-400">Tiếp theo: {new Date(r.nextDueDate).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full md:w-auto md:justify-end space-x-4">
                                            <span className="font-bold text-lg text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.amount)}
                                            </span>
                                            <button 
                                                onClick={() => onDeleteReminder(r.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa lịch nhắc"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>

                <div className="lg:col-span-1">
                     <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                         <h4 className="font-semibold text-blue-900 mb-2">Thông tin hữu ích</h4>
                         <p className="text-sm text-blue-700 mb-4">
                             Việc tạo lịch nhắc nợ giúp bạn không bao giờ quên thanh toán các hóa đơn định kỳ như tiền điện, nước, internet hoặc gửi tiết kiệm.
                         </p>
                         <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                             <li>Hệ thống sẽ thông báo khi đến hạn.</li>
                             <li>Bạn có thể thực hiện lệnh chuyển tiền nhanh từ thông báo.</li>
                             <li>Quản lý dễ dàng, hủy bất cứ lúc nào.</li>
                         </ul>
                     </div>
                </div>
            </div>
        )}

        {activeTab === 'deposit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border text-center">
                    <h3 className="text-lg font-semibold mb-4">Nạp tiền bằng mã QR</h3>
                    <div className="mb-4 flex justify-center">
                         <select 
                            className="p-2 border rounded-lg bg-gray-50"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                         >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.accountNumber} - {a.type}</option>
                            ))}
                         </select>
                    </div>
                    <div className="bg-gray-100 p-8 inline-block rounded-xl mb-4">
                        <QrCode size={160} className="text-gray-800"/>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Quét mã này từ ứng dụng ngân hàng khác hoặc ví điện tử để nạp tiền.</p>
                    
                    {/* Simulation Button for Demo */}
                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-400 mb-2">DEMO: Giả lập tiền vào</p>
                        <Button size="sm" variant="secondary" onClick={() => onSimulateDeposit(selectedAccountId, 500000, 'DEPOSIT_QR')}>
                            + 500k (QR)
                        </Button>
                        <Button size="sm" variant="secondary" className="ml-2" onClick={() => onSimulateDeposit(selectedAccountId, 2000000, 'DEPOSIT_ATM')}>
                            + 2tr (ATM)
                        </Button>
                    </div>
                </div>

                {/* Recent Deposit History */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="text-lg font-semibold mb-4">Lịch sử nạp tiền (ATM/QR)</h3>
                    <div className="space-y-4">
                        {myRawTransactions
                            .filter(t => t.toAccountId === selectedAccountId && (t.type === 'DEPOSIT_ATM' || t.type === 'DEPOSIT_QR' || t.type === 'DEPOSIT'))
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5)
                            .map(t => (
                            <div key={t.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{t.description}</p>
                                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-600 font-bold">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}</span>
                                    <div className="text-xs text-gray-400">{t.type === 'DEPOSIT_QR' ? 'QR Code' : 'ATM/Quầy'}</div>
                                </div>
                            </div>
                        ))}
                         {myRawTransactions.filter(t => t.toAccountId === selectedAccountId && (t.type.includes('DEPOSIT'))).length === 0 && (
                             <p className="text-gray-400 text-center text-sm">Chưa có giao dịch nạp tiền.</p>
                         )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'withdraw' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Withdrawal Form */}
                 <div className="bg-white p-8 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold mb-6">Rút tiền về tài khoản khác</h3>

                     {/* Visual Warning for Insufficient Balance */}
                    {isInsufficientBalance && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 animate-pulse">
                            <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-red-800">Số dư không đủ</h4>
                                <p className="text-sm text-red-600 mt-1">
                                    Số tiền bạn muốn rút ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(withdrawData.amount))}) 
                                    vượt quá số dư hiện tại của tài khoản ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAccount?.balance || 0)}).
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Từ tài khoản</label>
                            <select 
                                className="w-full p-2 border rounded-lg"
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.accountNumber} (SD: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(a.balance)})</option>
                                ))}
                            </select>
                        </div>
                        <Input 
                            label="Số tiền muốn rút"
                            type="number"
                            value={withdrawData.amount}
                            onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})}
                            required
                            error={isInsufficientBalance ? "Vượt quá số dư khả dụng" : undefined}
                            className={isInsufficientBalance ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Ngân hàng thụ hưởng"
                                placeholder="VD: Vietcombank"
                                value={withdrawData.bankName}
                                onChange={e => setWithdrawData({...withdrawData, bankName: e.target.value})}
                                required
                            />
                            <Input 
                                label="Số tài khoản nhận"
                                placeholder="Số TK"
                                value={withdrawData.bankAccount}
                                onChange={e => setWithdrawData({...withdrawData, bankAccount: e.target.value})}
                                required
                            />
                        </div>
                        <Input 
                            label="Nội dung"
                            value={withdrawData.note}
                            onChange={e => setWithdrawData({...withdrawData, note: e.target.value})}
                        />
                         <Button 
                            type="submit" 
                            fullWidth 
                            disabled={isInsufficientBalance || !withdrawData.amount}
                            variant={isInsufficientBalance ? "secondary" : "primary"}
                        >
                            {isInsufficientBalance ? "Số dư không đủ" : "Tạo lệnh rút"}
                        </Button>
                    </form>
                 </div>

                 {/* Withdrawal History (ATM) */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="text-lg font-semibold mb-4">Lịch sử rút tiền (ATM)</h3>
                     <div className="space-y-4">
                        {myRawTransactions
                            .filter(t => t.fromAccountId === selectedAccountId && (t.type === 'WITHDRAW_ATM'))
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5)
                            .map(t => (
                            <div key={t.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">Rút tiền mặt tại ATM</p>
                                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-red-600 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}</span>
                                </div>
                            </div>
                        ))}
                        {myRawTransactions.filter(t => t.fromAccountId === selectedAccountId && t.type === 'WITHDRAW_ATM').length === 0 && (
                             <p className="text-gray-400 text-center text-sm">Chưa có giao dịch rút ATM.</p>
                         )}
                    </div>
                 </div>
             </div>
        )}

        {activeTab === 'transfer' && (
           <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             {!selectedAccount || !selectedAccount.isActive ? (
               <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  Bạn cần chọn một tài khoản đang hoạt động để thực hiện giao dịch.
               </div>
             ) : (
                <>
                {isInsufficientTransferBalance && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 animate-pulse">
                        <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-red-800">Số dư không đủ</h4>
                            <p className="text-sm text-red-600 mt-1">
                                Số tiền chuyển ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(transferData.amount))}) 
                                vượt quá số dư hiện tại ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAccount.balance)}).
                            </p>
                        </div>
                    </div>
                )}
               <form onSubmit={handleTransferSubmit} className="space-y-6">
                 <div>
                    <label className="block text-sm text-gray-700 mb-1">Tài khoản nguồn</label>
                    <select 
                        className="w-full p-2 border rounded-lg bg-blue-50 border-blue-200 focus:ring-blue-500 focus:border-blue-500 font-mono text-blue-900"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.accountNumber} - Số dư: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(a.balance)}
                            </option>
                        ))}
                    </select>
                 </div>

                 <Input 
                    label="Số tài khoản thụ hưởng" 
                    placeholder="Nhập số tài khoản nhận"
                    value={transferData.toAccount}
                    onChange={e => setTransferData({...transferData, toAccount: e.target.value})}
                    required
                 />
                 <Input 
                    label="Số tiền chuyển (VND)" 
                    type="number"
                    placeholder="VD: 100000"
                    min={1000}
                    value={transferData.amount}
                    onChange={e => setTransferData({...transferData, amount: e.target.value})}
                    required
                    error={isInsufficientTransferBalance ? "Vượt quá số dư khả dụng" : undefined}
                    className={isInsufficientTransferBalance ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                 />
                 <Input 
                    label="Nội dung chuyển tiền" 
                    placeholder="Chuyển tiền..."
                    value={transferData.note}
                    onChange={e => setTransferData({...transferData, note: e.target.value})}
                 />
                 <Button 
                    type="submit" 
                    fullWidth 
                    disabled={!selectedAccount.isActive || isInsufficientTransferBalance}
                    variant={isInsufficientTransferBalance ? "secondary" : "primary"}
                 >
                    {isInsufficientTransferBalance ? "Số dư không đủ" : "Tiếp tục"}
                 </Button>
               </form>
               </>
             )}
           </div>
        )}

        {activeTab === 'history' && (
             <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Ngày</th>
                            <th className="p-4 font-medium">Tài khoản</th>
                            <th className="p-4 font-medium">Nội dung</th>
                            <th className="p-4 font-medium text-right">Số tiền</th>
                            <th className="p-4 font-medium">Loại</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {historyItems.length === 0 ? (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-400">Chưa có giao dịch nào</td></tr>
                        ) : (
                            historyItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-600">{item.date}</td>
                                    <td className="p-4 text-sm font-mono text-gray-800">{item.accountNumber}</td>
                                    <td className="p-4 font-medium text-gray-900">{item.description}</td>
                                    <td className={`p-4 text-right font-bold ${item.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.isPositive ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded text-xs 
                                            ${item.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.typeLabel}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={(e) => { e.preventDefault(); onUpdateProfile(profileData); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input 
                    label="Họ và tên" 
                    value={profileData.name}
                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                 />
                 <Input 
                    label="Số điện thoại" 
                    value={profileData.phone}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                 />
                 <Input 
                    label="CCCD/CMND" 
                    value={profileData.cccd}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                 />
                 <Input 
                    label="Email" 
                    value={profileData.email || ''}
                    onChange={e => setProfileData({...profileData, email: e.target.value})}
                 />
                 <div className="md:col-span-2">
                    <Input 
                        label="Địa chỉ" 
                        value={profileData.address || ''}
                        onChange={e => setProfileData({...profileData, address: e.target.value})}
                    />
                 </div>
              </div>
              <div className="pt-4 border-t flex justify-end">
                  <Button type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={confirmModalOpen} 
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận giao dịch"
      >
        <div className="space-y-4">
            <p className="text-gray-600">Bạn có chắc chắn muốn chuyển khoản?</p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Từ tài khoản:</span>
                    <span className="font-mono">{selectedAccount?.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Đến số TK:</span>
                    <span className="font-bold">{transferData.toAccount}</span>
                </div>
                <div className="flex justify-between">
                    <span>Số tiền:</span>
                    <span className="font-bold text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(transferData.amount))}</span>
                </div>
            </div>
            <div className="flex space-x-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => setConfirmModalOpen(false)}>Hủy</Button>
                <Button variant="primary" fullWidth onClick={confirmTransfer}>Xác nhận</Button>
            </div>
        </div>
      </Modal>

      {/* New Reminder Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Tạo lịch nhắc nợ / Định kỳ"
      >
          <form onSubmit={handleReminderSubmit} className="space-y-4">
              <Input 
                  label="Tên gợi nhớ"
                  placeholder="VD: Tiền nhà, Tiền điện..."
                  value={reminderData.description}
                  onChange={e => setReminderData({...reminderData, description: e.target.value})}
                  required
              />
              <Input 
                  label="Số tài khoản thụ hưởng"
                  value={reminderData.toAccountNumber}
                  onChange={e => setReminderData({...reminderData, toAccountNumber: e.target.value})}
                  required
              />
              <Input 
                  label="Số tiền (VND)"
                  type="number"
                  value={reminderData.amount}
                  onChange={e => setReminderData({...reminderData, amount: e.target.value})}
                  required
              />
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tần suất</label>
                  <select 
                      className="w-full border rounded-lg shadow-sm px-3 py-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      value={reminderData.frequency}
                      onChange={e => setReminderData({...reminderData, frequency: e.target.value as any})}
                  >
                      <option value="DAILY">Hàng ngày</option>
                      <option value="WEEKLY">Hàng tuần</option>
                      <option value="MONTHLY">Hàng tháng</option>
                  </select>
              </div>
              <Input 
                  label="Ngày bắt đầu / Ngày tiếp theo"
                  type="date"
                  value={reminderData.nextDueDate}
                  onChange={e => setReminderData({...reminderData, nextDueDate: e.target.value})}
                  required
              />
              <div className="pt-2">
                  <Button type="submit" fullWidth>Lưu lịch nhắc</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};