import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../dataService';
import { User, Payment, ChitMonth, UpiDetails, ChitConfig } from '../types';
import { CheckCircleIcon, XCircleIcon, CrownIcon, KeyIcon } from './Icon';
import { calculateCurrentChitMonth } from '../dateUtils';
import PasswordValidation from './PasswordValidation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Modal from './Modal';
import { useToast } from '../ToastContext';

interface MemberDashboardProps {
  user: User;
}

type DashboardData = {
    user: User;
    payments: Payment[];
    chitMonths: ChitMonth[];
    upiDetails: UpiDetails;
    chitConfig: ChitConfig;
} | null;


const MemberDashboard: React.FC<MemberDashboardProps> = ({ user: initialUser }) => {
  const [data, setData] = useState<DashboardData>(null);
  const [loading, setLoading] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ current: '', new: '', confirm: '' });
  const toast = useToast();
  
  useEffect(() => {
    try {
      const dashboardData = dataService.getMemberDashboardData(initialUser.id);
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to load member data:", error);
    }
    setLoading(false);
  }, [initialUser.id]);
  
  const handleOpenSecurityModal = () => {
    setPasswordFields({ current: '', new: '', confirm: '' });
    setIsSecurityModalOpen(true);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFields.new !== passwordFields.confirm) {
        toast.addToast('New passwords do not match.', 'error');
        return;
    }
    const result = dataService.changeMemberPassword(initialUser.id, passwordFields.current, passwordFields.new);
    toast.addToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
        setTimeout(() => {
          setIsSecurityModalOpen(false);
        }, 1500);
    }
  }


  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 text-slate-800">Loading...</div>;
  }

  if (!data) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 text-slate-800">Could not load your data.</div>;
  }

  const { user, payments, chitMonths, upiDetails, chitConfig } = data;
  const currentMonth = calculateCurrentChitMonth(chitConfig.startDate, chitConfig.totalMonths);
  const currentPayment = payments.find(p => p.month === currentMonth);
  
  const paymentStatusData = useMemo(() => {
    if(!currentMonth) return { chartData: [] };
    const paymentsSoFar = payments.filter(p => p.month <= currentMonth);
    const paidCount = paymentsSoFar.filter(p => p.isPaid).length;
    const dueCount = paymentsSoFar.length - paidCount;

    const chartData = [
        { name: 'Paid', value: paidCount },
        { name: 'Due', value: dueCount }
    ];
    return { chartData };
  }, [payments, currentMonth]);

  const currentMonthInfo = chitMonths.find(m => m.month === currentMonth);
  const potentialPayout = currentMonthInfo ? currentMonthInfo.payoutAmount : 0;
  const COLORS = ['#2563eb', '#d1d5db']; // Blue for Paid, Gray for Due

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen text-slate-700">
      <div className="relative h-40 md:h-56 bg-cover bg-center rounded-2xl mb-8 flex items-end p-8" style={{backgroundImage: "url('https://images.unsplash.com/photo-1620421680929-8a8f1f5a7a4a?q=80&w=2832&auto=format&fit=crop')"}}>
         <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
         <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold font-lexend text-white drop-shadow-lg">Welcome, {user.name}!</h2>
            <p className="text-white/80 drop-shadow-md">Here is your Chitti summary and payment history.</p>
         </div>
       </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 text-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-lg mb-2">Present Month ({`Month ${currentMonth}`})</h3>
          {currentPayment ? (
            <>
              <p className="text-4xl font-bold">₹{currentPayment.amount.toLocaleString('en-IN')}</p>
              <p className={`mt-2 font-semibold ${currentPayment.isPaid ? 'text-green-300' : 'text-yellow-300'}`}>
                Status: {currentPayment.isPaid ? 'Paid' : 'Due'}
              </p>
            </>
          ) : (
             <p>No payment information for this month.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="font-bold text-md text-gray-600 mb-3">Your Chit Status</h3>
          {user.chitTakenMonth ? (
            <div className="text-center">
                <CrownIcon className="w-12 h-12 mx-auto text-amber-500 mb-2" />
                <p className="text-lg font-semibold text-slate-800">Took chit in Month {user.chitTakenMonth}</p>
                <p className="text-gray-500">Next pay: ₹{chitConfig.prizedContribution.toLocaleString('en-IN')}</p>
            </div>
          ) : (
            <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">Not taken yet</p>
                <p className="text-gray-500 mt-2">Payout this month: <span className="font-bold text-slate-800">₹{potentialPayout.toLocaleString('en-IN')}</span></p>
                <p className="text-gray-500">Monthly pay: ₹{chitConfig.baseContribution.toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>

         <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col justify-center border border-gray-200 lg:col-span-2">
           <h3 className="font-bold text-md text-gray-600 mb-1">Your Payment Status</h3>
           <p className="text-xs text-gray-400 -mt-1 mb-2">Up to Month {currentMonth}</p>
           <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                    <Pie data={paymentStatusData.chartData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5}>
                        {paymentStatusData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: "12px", bottom: -5}}/>
                </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-bold text-xl text-slate-800 mb-4">Your Payment History</h3>
            <div className="max-h-96 overflow-y-auto pr-2">
                <ul className="space-y-2">
                    {payments.sort((a,b) => a.month - b.month).map(p => (
                        <li key={p.month} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div>
                                <span className="font-semibold text-slate-800">Month {p.month}</span>
                                <span className="text-sm text-gray-500 ml-4">Amount: ₹{p.amount.toLocaleString('en-IN')}</span>
                            </div>
                            {p.isPaid ? (
                                <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="w-5 h-5 mr-2" /> Paid</span>
                            ) : (
                                <span className="flex items-center text-sm font-medium text-red-600"><XCircleIcon className="w-5 h-5 mr-2" /> Due</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center border border-gray-200">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Security</h3>
                <div className="flex flex-col items-center gap-4">
                    <KeyIcon className="w-12 h-12 text-blue-500"/>
                    <button onClick={handleOpenSecurityModal} className="bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-gray-300">
                        Change Password
                    </button>
                </div>
            </div>
             <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center border border-gray-200">
                <h3 className="font-bold text-lg text-slate-800 mb-4">How to Pay</h3>
                <img src={upiDetails.qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 rounded-lg mb-4 border-4 border-gray-200 object-cover"/>
                <p className="text-slate-800 font-semibold text-xl mt-2">{upiDetails.id}</p>
                <p className="text-gray-500 text-sm mt-2">Scan the QR or use the UPI ID to pay.</p>
                <p className="text-xs text-gray-400 mt-4 text-center">Payments are due between the 1st and 20th of each month.</p>
            </div>
        </div>
      </div>

      <Modal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title="Change Your Password">
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <input type="password" name="current" placeholder="Current Password" value={passwordFields.current} onChange={handlePasswordChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
              <div>
                <input type="password" name="new" placeholder="New Password" value={passwordFields.new} onChange={handlePasswordChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
                <PasswordValidation password={passwordFields.new} />
            </div>
            <input type="password" name="confirm" placeholder="Confirm New Password" value={passwordFields.confirm} onChange={handlePasswordChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-500 focus:border-blue-500" required />
            <div className="border-t border-gray-200 pt-4 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Update Password</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default MemberDashboard;
