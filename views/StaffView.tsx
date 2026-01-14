import React, { useState } from 'react';
import { User, BankAccount, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Users, Search, Plus, Edit, Trash2, Ban, CheckCircle, DollarSign, Wallet, Building2 } from 'lucide-react';

interface StaffViewProps {
  currentUser: User;
  users: User[];
  accounts: BankAccount[];
  onLogout: () => void;
  onAddUser: (user: Omit<User, 'id' | 'isDeleted'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddAccount: (userId: string) => void;
  onDeposit: (accountId: string, amount: number) => void;
  onToggleAccountStatus: (accountId: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  currentUser,
  users,
  accounts,
  onLogout,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddAccount,
  onDeposit,
  onToggleAccountStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAccountId, setDepositAccountId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  // New User Form State
  const [newUser, setNewUser] = useState({ name: '', phone: '', cccd: '', password: '123' });

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.role === UserRole.CUSTOMER && !u.isDeleted &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.phone.includes(searchTerm) ||
     u.cccd.includes(searchTerm))
  );

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({ ...newUser, role: UserRole.CUSTOMER });
    setIsAddUserOpen(false);
    setNewUser({ name: '', phone: '', cccd: '', password: '123' });
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

  // Helper for Account Badges
  const getAccountTypeLabel = (type: string) => {
    switch(type) {
        case 'BUSINESS': return 'Tài khoản Doanh nghiệp';
        case 'SAVINGS': return 'Tài khoản Tiết kiệm';
        default: return 'Tài khoản Thanh toán';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">VNBank Staff Portal</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-right">
                 <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                 <div className="text-xs text-gray-500">{currentUser.position} - {currentUser.department}</div>
             </div>
             <Button variant="secondary" onClick={onLogout} className="text-sm">Đăng xuất</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        {/* Left Col: Customer List */}
        <div className="w-1/3 flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Khách hàng</h2>
                <Button size="sm" onClick={() => setIsAddUserOpen(true)}><Plus size={16} /></Button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Tìm theo Tên, SĐT, CCCD..." 
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{user.phone}</span>
                    <span>{user.cccd}</span>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy khách hàng.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="w-2/3">
           {selectedUser ? (
             <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                            <p className="text-gray-500">Khách hàng từ 2024</p>
                        </div>
                        <div className="flex space-x-2">
                             <Button variant="secondary" onClick={() => alert("Tính năng chỉnh sửa đang phát triển")}>
                                <Edit size={16} className="mr-2" /> Sửa
                             </Button>
                             <Button variant="danger" onClick={() => { 
                                 if(window.confirm('Xóa khách hàng này?')) {
                                     onDeleteUser(selectedUser.id);
                                     setSelectedUser(null);
                                 }
                             }}>
                                <Trash2 size={16} className="mr-2" /> Xóa
                             </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500">Số điện thoại</span>
                            <span className="font-medium">{selectedUser.phone}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">CCCD/CMND</span>
                            <span className="font-medium">{selectedUser.cccd}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-gray-500">Địa chỉ</span>
                            <span className="font-medium">{selectedUser.address || 'Chưa cập nhật'}</span>
                        </div>
                    </div>
                </div>

                {/* Accounts Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Wallet className="w-5 h-5 mr-2 text-gray-600" /> Tài khoản ngân hàng
                        </h3>
                        <Button size="sm" variant="secondary" onClick={() => onAddAccount(selectedUser.id)}>
                            <Plus size={16} className="mr-1" /> Thêm tài khoản
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {accounts.filter(a => a.userId === selectedUser.id).map(account => (
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
                        {accounts.filter(a => a.userId === selectedUser.id).length === 0 && (
                            <p className="text-gray-500 text-center py-4 text-sm">Khách hàng chưa có tài khoản.</p>
                        )}
                    </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Users size={64} className="mb-4 opacity-20" />
                <p>Chọn một khách hàng để xem chi tiết</p>
             </div>
           )}
        </div>
      </main>

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Thêm khách hàng mới">
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
            <Input label="Họ và tên" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
            <Input label="Số điện thoại" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} required />
            <Input label="CCCD/CMND" value={newUser.cccd} onChange={e => setNewUser({...newUser, cccd: e.target.value})} required />
            <Input label="Mật khẩu mặc định" value={newUser.password} readOnly className="bg-gray-100" />
            <div className="pt-2">
                <Button type="submit" fullWidth>Tạo khách hàng</Button>
            </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title="Nạp tiền vào tài khoản">
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