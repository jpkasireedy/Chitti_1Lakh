import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { User, ChitConfig } from '../types';
import { CheckCircleIcon, XCircleIcon, CrownIcon, CogIcon, KeyIcon, UserPlusIcon, UserCogIcon, TrashIcon, InformationCircleIcon } from './Icon';
import { calculateCurrentChitMonth } from '../utils/dateUtils';
import PasswordValidation from './PasswordValidation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

const ActionPopover: React.FC<{ onPaid: () => void; onAssign: () => void; onClose: () => void; canAssign: boolean; }> = ({ onPaid, onAssign, canAssign }) => (
    <div className="absolute top-10 right-0 z-20 bg-white rounded-lg shadow-xl border border-gray-200 w-40 text-sm p-1">
        <button onClick={onPaid} className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md">Mark as Paid</button>
        {canAssign && <button onClick={onAssign} className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md">Assign Chit</button>}
    </div>
);

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState(dataService.getAdminDashboardData());
  const [unapprovedUsers, setUnapprovedUsers] = useState(dataService.getUnapprovedUsers());
  
  // Modal states
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isManageUserModalOpen, setIsManageUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{ isOpen: boolean, onConfirm: () => void, title: string, message: string, confirmText: string, confirmColor: string }>({ isOpen: false, onConfirm: () => {}, title: '', message: '', confirmText: 'Confirm', confirmColor: 'bg-red-600 hover:bg-red-700' });
  
  const [popoverState, setPopoverState] = useState<{ userId: string; month: number } | null>(null);

  // Form states
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [newUserDetails, setNewUserDetails] = useState({ name: '', username: '' });
  const [manageUserFields, setManageUserFields] = useState({ name: '', username: '' });
  const [newPassword, setNewPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [upiFields, setUpiFields] = useState({ id: dashboardData.upiDetails.id, qrCodeUrl: dashboardData.upiDetails.qrCodeUrl });
  const [configFields, setConfigFields] = useState<ChitConfig>(dashboardData.chitConfig);
  
  const toast = useToast();

  const refreshData = useCallback(() => {
    setDashboardData(dataService.getAdminDashboardData());
    setUnapprovedUsers(dataService.getUnapprovedUsers());
  }, []);
  
  const handleApproveUser = (userId: string) => {
      dataService.approveUser(userId);
      refreshData();
      toast.addToast('User approved successfully!', 'success');
  };

  const handleTogglePayment = (userId: string, month: number) => {
    dataService.togglePayment(userId, month);
    setPopoverState(null);
    refreshData();
  };

  const handleAssignChit = (userId: string, month: number) => {
    setConfirmationState({
        isOpen: true,
        onConfirm: () => {
            dataService.assignChit(userId, month);
            setPopoverState(null);
            refreshData();
            toast.addToast(`Chit for Month ${month} assigned successfully.`, 'success');
        },
        title: "Assign Chit?",
        message: `Are you sure you want to assign Month ${month} chit? This cannot be undone.`,
        confirmText: 'Yes, Assign',
        confirmColor: 'bg-blue-600 hover:bg-blue-700'
    });
  };
  
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverState && !(event.target as HTMLElement).closest('.action-popover-parent')) {
        setPopoverState(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popoverState]);

  const handleOpenManageUserModal = (user: User) => {
    setActiveUser(user);
    setManageUserFields({ name: user.name, username: user.username });
    setNewPassword('');
    setIsManageUserModalOpen(true);
  };
  
  const handleUpdateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (activeUser) {
        const result = dataService.updateMember(activeUser.id, manageUserFields);
        toast.addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            refreshData();
            setActiveUser(dataService.getUserById(activeUser.id) || null);
        }
      }
  };
  
  const handleSetPassword = () => {
      if(!activeUser) return;
      if (!newPassword) {
        toast.addToast('Password field cannot be empty.', 'error');
        return;
      }
      const result = dataService.adminSetMemberPassword(activeUser.id, newPassword);
      toast.addToast(result.message, result.success ? 'success' : 'error');
      if(result.success) setNewPassword('');
  };
  
  const handleToggleStatus = () => {
      if(!activeUser) return;
      const actionText = activeUser.disabled ? 'enable' : 'disable';
      setConfirmationState({
          isOpen: true,
          onConfirm: () => {
              dataService.toggleMemberStatus(activeUser.id);
              toast.addToast(`User account ${actionText}d.`, 'success');
              refreshData();
              setIsManageUserModalOpen(false);
          },
          title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Account?`,
          message: `Are you sure you want to ${actionText} this user's account? They will ${actionText === 'disable' ? 'not be able to' : 'be able to'} log in.`,
          confirmText: `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          confirmColor: 'bg-yellow-500 hover:bg-yellow-600'
      });
  };

  const handleDeleteUser = () => {
    if(!activeUser) return;
    setConfirmationState({
        isOpen: true,
        onConfirm: () => {
            dataService.deleteMember(activeUser.id);
            toast.addToast('User deleted successfully.', 'success');
            refreshData();
            setIsManageUserModalOpen(false);
        },
        title: `Delete ${activeUser.name}?`,
        message: "This is irreversible and will remove the user and all their payment history. Are you sure?",
        confirmText: 'Yes, Delete User',
        confirmColor: 'bg-red-600 hover:bg-red-700'
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      const result = dataService.createNewMember(newUserDetails.name, newUserDetails.username);
      toast.addToast(result.message, result.success ? 'success' : 'error');
      if(result.success) {
          refreshData();
          setNewUserDetails({ name: '', username: '' });
          setIsAddUserModalOpen(false);
      }
  };

  const handleUpiUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      dataService.updateUpiDetails(upiFields);
      refreshData();
      setIsUpiModalOpen(false);
      toast.addToast('UPI details updated successfully.', 'success');
  }

  const handleConfigUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      setConfirmationState({
          isOpen: true,
          onConfirm: () => {
              dataService.updateChitConfig(configFields);
              refreshData();
              setIsConfigModalOpen(false);
              toast.addToast('Configuration saved and data recalculated.', 'success');
          },
          title: "Save & Recalculate?",
          message: "Saving new configuration will reset and recalculate all payment and chit month data based on the new settings. Existing chit winner history will be lost. This is a major operation. Proceed?",
          confirmText: 'Yes, Save & Recalculate',
          confirmColor: 'bg-orange-500 hover:bg-orange-600'
      })
  }
  
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setConfigFields(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSecurityUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current') as string;
    const confirmPassword = formData.get('confirm') as string;

    if (adminNewPassword !== confirmPassword) {
        toast.addToast('New passwords do not match.', 'error');
        return;
    }

    const result = dataService.changeAdminPassword(currentPassword, adminNewPassword);
    toast.addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
        setAdminNewPassword('');
        setTimeout(() => setIsSecurityModalOpen(false), 1500);
    }
  };

  const currentChitMonth = calculateCurrentChitMonth(dashboardData.chitConfig.startDate, dashboardData.chitConfig.totalMonths);

  const paymentChartData = useMemo(() => {
    const { payments, chitConfig } = dashboardData;
    const memberCount = dataService.getUsers().length;
    const data = [];

    for (let m = 1; m <= chitConfig.totalMonths; m++) {
        const paidCount = payments.filter(p => p.month === m && p.isPaid).length;
        data.push({
            name: `Month ${m}`,
            Paid: paidCount,
            Due: memberCount - paidCount,
        });
    }
    return data;
  }, [dashboardData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen text-slate-700">
       <div className="relative h-40 md:h-56 bg-cover bg-center rounded-2xl mb-8 flex items-end p-8" style={{backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2940&auto=format&fit=crop')"}}>
         <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
         <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold font-lexend text-white drop-shadow-lg">Admin Dashboard</h2>
            <p className="text-white/80 drop-shadow-md">Oversee and manage the entire chitti fund.</p>
         </div>
       </div>

        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Pending User Approvals</h3>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                {unapprovedUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unapprovedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="font-semibold text-slate-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                                <button onClick={() => handleApproveUser(user.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded-md transition-colors">
                                    Approve
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500 flex flex-col items-center">
                        <InformationCircleIcon className="w-8 h-8 mb-2 text-gray-400"/>
                        No pending approvals.
                    </div>
                )}
            </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-md text-gray-600 mb-1">Total Members</h3>
                <p className="text-4xl font-bold text-blue-600">{dashboardData.users.length}</p>
                <p className="text-gray-500 mt-1 text-sm">{dashboardData.users.filter(u => u.approved).length} approved</p>
            </div>
             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-md text-gray-600 mb-1">Present Month Status</h3>
                 <p className="text-4xl font-bold text-blue-600">{`Month ${currentChitMonth}`}</p>
                <p className="text-gray-500 mt-1 text-sm">Payout: ₹{dashboardData.chitMonths.find(m => m.month === currentChitMonth)?.payoutAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-md text-gray-600 mb-1">Payment Details</h3>
                <p className="text-xl font-semibold text-slate-800 break-all">{dashboardData.upiDetails.id}</p>
                 <button onClick={() => setIsUpiModalOpen(true)} className="text-sm mt-1 font-semibold text-blue-600 hover:text-blue-700">Edit Details</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col items-center justify-center space-y-3">
                 <button onClick={() => setIsConfigModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-gray-300"><CogIcon className="w-5 h-5"/> Configure Chitti</button>
                <button onClick={() => setIsSecurityModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-gray-300"><KeyIcon className="w-5 h-5" /> Change Password</button>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <h3 className="font-bold text-xl text-slate-800 mb-4">Monthly Payment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="Paid" stackId="a" fill="#3b82f6" name="Paid" />
                    <Bar dataKey="Due" stackId="a" fill="#f59e0b" name="Due" />
                </BarChart>
            </ResponsiveContainer>
        </div>


        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-xl text-slate-800">Member Management</h3>
                 <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                     <UserPlusIcon className="w-5 h-5"/> Add Member
                 </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Member</th>
                            {dashboardData.chitMonths.map(m => (
                                <th key={m.month} scope="col" className="px-6 py-3 text-center">M{m.month}</th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboardData.users.map(user => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{user.name}</div>
                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                    {user.chitTakenMonth && (
                                        <div className="flex items-center text-xs text-amber-600 mt-1" title={`Took chit in Month ${user.chitTakenMonth}`}>
                                            <CrownIcon className="w-4 h-4 mr-1"/> Won in M{user.chitTakenMonth}
                                        </div>
                                    )}
                                     {!user.approved && <div className="text-xs text-red-500 mt-1">Pending approval</div>}
                                     {user.disabled && <div className="text-xs text-red-500 mt-1 font-semibold">Disabled</div>}
                                </td>
                                {dashboardData.chitMonths.map(m => {
                                    const payment = dashboardData.payments.find(p => p.userId === user.id && p.month === m.month);
                                    const isChitTakenThisMonth = m.takenByUserId !== null;
                                    const canTakeChit = !isChitTakenThisMonth && !user.chitTakenMonth && m.month === currentChitMonth;
                                    const isWinner = m.takenByUserId === user.id;

                                    return (
                                        <td key={`${user.id}-${m.month}`} className={`px-6 py-4 text-center transition-colors ${isWinner ? 'winner-cell' : ''}`}>
                                            {isWinner ? (
                                                <div className="flex flex-col items-center justify-center" title={`Winner of Month ${m.month}`}>
                                                    <CrownIcon className="w-6 h-6 text-amber-500" />
                                                </div>
                                            ) : payment ? (
                                                <div className="relative action-popover-parent">
                                                    {payment.isPaid ? (
                                                        <button onClick={() => handleTogglePayment(user.id, m.month)} title="Mark as Unpaid">
                                                            <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto" />
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <button onClick={(e) => { e.stopPropagation(); setPopoverState({ userId: user.id, month: m.month }); }} title="Actions">
                                                                <XCircleIcon className="w-6 h-6 text-red-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {popoverState?.userId === user.id && popoverState?.month === m.month && (
                                                        <ActionPopover 
                                                            onPaid={() => handleTogglePayment(user.id, m.month)}
                                                            onAssign={() => handleAssignChit(user.id, m.month)}
                                                            onClose={() => setPopoverState(null)}
                                                            canAssign={canTakeChit}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleOpenManageUserModal(user)}
                                        className="text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Manage User"
                                    >
                                        <UserCogIcon className="w-6 h-6 mx-auto" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <Modal isOpen={isUpiModalOpen} onClose={() => setIsUpiModalOpen(false)} title="Update Payment Details">
          <form onSubmit={handleUpiUpdate} className="space-y-4">
            <input type="text" placeholder="UPI ID" value={upiFields.id} onChange={e => setUpiFields({...upiFields, id: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <input type="text" placeholder="UPI QR Code URL" value={upiFields.qrCodeUrl} onChange={e => setUpiFields({...upiFields, qrCodeUrl: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <div className="border-t border-gray-200 pt-4 flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Changes</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Chit Configuration">
          <form onSubmit={handleConfigUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" name="startDate" value={configFields.startDate} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" name="totalMonths" placeholder="Total Months" value={configFields.totalMonths} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" name="baseContribution" placeholder="Base Contribution" value={configFields.baseContribution} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" name="prizedContribution" placeholder="Prized Contribution" value={configFields.prizedContribution} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" name="startingPayout" placeholder="Starting Payout" value={configFields.startingPayout} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" name="payoutIncrement" placeholder="Payout Increment" value={configFields.payoutIncrement} onChange={handleConfigChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-end">
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save & Recalculate</button>
            </div>
          </form>
        </Modal>
        
        <Modal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title="Change Admin Password">
          <form onSubmit={handleSecurityUpdate} className="space-y-4">
            <input type="password" name="current" placeholder="Current Password" className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <div>
              <input type="password" name="new" placeholder="New Password" value={adminNewPassword} onChange={e => setAdminNewPassword(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
              <PasswordValidation password={adminNewPassword}/>
            </div>
            <input type="password" name="confirm" placeholder="Confirm New Password" className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <div className="border-t border-gray-200 pt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Update Password</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Create New Member">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <input type="text" placeholder="Full Name" value={newUserDetails.name} onChange={e => setNewUserDetails({...newUserDetails, name: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <input type="text" placeholder="Username (for login)" value={newUserDetails.username} onChange={e => setNewUserDetails({...newUserDetails, username: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <div className="border-t border-gray-200 pt-4 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Member</button>
            </div>
          </form>
        </Modal>
        
        <Modal isOpen={isManageUserModalOpen} onClose={() => setIsManageUserModalOpen(false)} title={`Manage: ${activeUser?.name}`}>
          {activeUser && <div className="space-y-6">
            <form onSubmit={handleUpdateUser} className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                <h4 className="font-bold text-blue-800 mb-2">User Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" value={manageUserFields.name} onChange={e => setManageUserFields({...manageUserFields, name: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
                    <input type="text" placeholder="Username" value={manageUserFields.username} onChange={e => setManageUserFields({...manageUserFields, username: e.target.value})} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="text-right mt-3">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 text-sm rounded-lg transition-colors">Update Details</button>
                </div>
            </form>

            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                  <h4 className="font-bold text-orange-800 mb-2">Set New Password</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Temporary Password" className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" />
                        <button type="button" onClick={handleSetPassword} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-4 text-sm rounded-lg transition-colors whitespace-nowrap">Set Password</button>
                    </div>
                    <PasswordValidation password={newPassword} />
                  </div>
            </div>

            <div className="border-t pt-6 flex justify-between items-center">
                <button onClick={handleToggleStatus} className={`font-bold py-2 px-4 rounded-lg transition-colors text-sm ${activeUser.disabled ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}>
                    {activeUser.disabled ? 'Enable Account' : 'Disable Account'}
                </button>
                <button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Delete Member</button>
            </div>
          </div>}
        </Modal>
        
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
            onConfirm={confirmationState.onConfirm}
            title={confirmationState.title}
            message={confirmationState.message}
            confirmButtonText={confirmationState.confirmText}
            confirmButtonColor={confirmationState.confirmColor}
        />

    </div>
  );
};

export default AdminDashboard;
