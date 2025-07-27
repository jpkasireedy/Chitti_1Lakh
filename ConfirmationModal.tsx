import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  confirmButtonColor = "bg-red-600 hover:bg-red-700",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-gray-600">{message}</p>
        <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
            <button 
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={`${confirmButtonColor} text-white font-bold py-2 px-4 rounded-lg transition-colors`}
            >
                {confirmButtonText}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
