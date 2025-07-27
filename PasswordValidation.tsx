import React from 'react';
import { validatePassword } from '../utils/validation';
import { CheckCircleIcon, XCircleIcon } from './Icon';

interface PasswordValidationProps {
  password?: string;
}

const ValidationItem: React.FC<{isValid: boolean; text: string}> = ({ isValid, text }) => (
    <li className={`flex items-center text-sm transition-colors ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
        {isValid 
            ? <CheckCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" /> 
            : <XCircleIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
        }
        {text}
    </li>
);

const PasswordValidation: React.FC<PasswordValidationProps> = ({ password = '' }) => {
  const validation = validatePassword(password);

  return (
    <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <ul className="space-y-1">
            <ValidationItem isValid={validation.length} text="5 to 12 characters long" />
            <ValidationItem isValid={validation.uppercase} text="Contains an uppercase letter" />
            <ValidationItem isValid={validation.lowercase} text="Contains a lowercase letter" />
            <ValidationItem isValid={validation.number} text="Contains a number" />
            <ValidationItem isValid={validation.specialChar} text="Contains a special character (@ or #)" />
        </ul>
    </div>
  );
};

export default PasswordValidation;
