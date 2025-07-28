import React, { useState } from 'react';
import { ... } from "../dataService";
import { User } from '../types';
import { EyeIcon, EyeOffIcon } from './Icon';
import { useToast } from '../ToastContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginType = 'admin' | 'member';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('member');
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user = dataService.authenticateUser(username, password);

    if (user) {
        if (user.disabled) {
            toast.addToast('Your account has been disabled by the administrator.', 'error');
            return;
        }
        if((loginType === 'admin' && user.role === 'ADMIN') || (loginType === 'member' && user.role === 'MEMBER')) {
            onLogin(user);
        } else {
            toast.addToast(`Please use the '${user.role.toLowerCase()}' login tab.`, 'error');
        }
    } else {
      toast.addToast('Invalid username or password.', 'error');
    }
  };
  
  const handleTabChange = (type: LoginType) => {
      setLoginType(type);
      setUsername('');
      setPassword('');
  }

  return (
    <div className="login-background min-h-screen flex flex-col items-center justify-center p-4 font-inter">
      <div className="absolute inset-0 bg-black/70"></div>
      <div className="w-full max-w-sm mx-auto z-10">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold font-lexend text-white drop-shadow-lg">Chitti</h1>
            <p className="text-white/80 mt-2 drop-shadow-md">Your Trusted Chit Fund Manager</p>
        </div>
        
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200">
            <div className="flex">
                <button 
                    onClick={() => handleTabChange('member')}
                    className={`flex-1 py-3 font-bold text-center rounded-tl-xl transition-all duration-300 ${loginType === 'member' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                    Member Login
                </button>
                <button 
                    onClick={() => handleTabChange('admin')}
                    className={`flex-1 py-3 font-bold text-center rounded-tr-xl transition-all duration-300 ${loginType === 'admin' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                    Admin Login
                </button>
            </div>
            
            <div className="p-8">
                <form onSubmit={handleLogin} noValidate>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            {loginType === 'admin' ? 'Admin Username' : 'Member Username'}
                        </label>
                        <input 
                            className="shadow-sm appearance-none border rounded w-full py-3 px-4 bg-gray-50 border-gray-300 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            id="username" 
                            type="text" 
                            placeholder={loginType === 'admin' ? 'admin' : 'e.g., member1'}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input 
                                className="shadow-sm appearance-none border rounded w-full py-3 px-4 bg-gray-50 border-gray-300 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                id="password" 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="******************"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="flex items-center text-gray-600">
                            <input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-100 border-gray-300 text-blue-600 focus:ring-blue-500 rounded" checked={showPassword} onChange={() => setShowPassword(!showPassword)}/>
                            <span className="ml-2 text-sm">Show Password</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 text-base" type="submit">
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
