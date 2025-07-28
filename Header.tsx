import React, { useState } from 'react';
import { User } from '../types';
import { LogoutIcon, UserIcon } from './Icon';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../ToastContext';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onReset }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const toast = useToast();
  
  const handleResetConfirm = () => {
      onReset();
      toast.addToast('All demo data has been reset.', 'info');
  }

  return (
    <>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center text-slate-800 sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.103.501 0l4.25 2.833c.155.103.155.346 0 .45l-4.25 2.833c-.155.103-.346-.103-.501 0l-4.25-2.833a.25.25 0 010-.45l4.25-2.833z" />
            <path fillRule="evenodd" d="M9.5 18a8.5 8.5 0 100-17 8.5 8.5 0 000 17zm0-2a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl font-bold font-lexend text-slate-800">Chitti</h1>
          <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase">Demo</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Reset Demo Data"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Reset Data
          </button>
          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-sm text-slate-700">{user.name}</span>
          </div>
          <button onClick={onLogout} className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors" title="Logout">
              <LogoutIcon className="w-6 h-6"/>
          </button>
        </div>
      </header>
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset All Data?"
        message="Are you sure you want to reset all demo data? This action is irreversible and you will be logged out."
        confirmButtonText="Yes, Reset Data"
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};
