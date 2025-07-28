import React, { useState, useEffect, useCallback } from 'react';
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import MemberDashboard from "./MemberDashboard";
import { Header } from "./Header";
import { User, UserRole } from "./types";
import { dataService } from "./dataService";
import { ToastProvider } from "./ToastContext";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loggedInUserJSON = sessionStorage.getItem('chitti_user');
    if (loggedInUserJSON) {
        const loggedInUser = JSON.parse(loggedInUserJSON);
        // Ensure user data is fresh from the "DB"
        const freshUser = dataService.getUserById(loggedInUser.id);
        setUser(freshUser);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('chitti_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('chitti_user');
  };
  
  const handleReset = useCallback(() => {
      dataService.resetData();
      handleLogout();
  },[]);

  const AppContent: React.FC = () => {
    if (!user) {
      return <Login onLogin={handleLogin} />;
    }
  
    if (!user.approved || user.disabled) {
      const title = user.disabled ? "Account Disabled" : "Account Pending Approval";
      const message = user.disabled 
          ? "Your account has been disabled by the administrator. Please contact them for more information."
          : "Your account has not been approved by the administrator yet. Please wait for approval.";
  
      return (
          <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center text-slate-800 p-4">
              <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md border border-gray-200">
                  <h1 className="text-2xl font-bold text-yellow-600 mb-4">{title}</h1>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <button 
                      onClick={handleLogout}
                      className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                      Logout
                  </button>
              </div>
          </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={user} onLogout={handleLogout} onReset={handleReset}/>
        <main>
          {user.role === UserRole.ADMIN ? <AdminDashboard /> : <MemberDashboard user={user}/>}
        </main>
      </div>
    );
  }

  return (
    <ToastProvider>
       <AppContent />
    </ToastProvider>
  );
};

export default App;
