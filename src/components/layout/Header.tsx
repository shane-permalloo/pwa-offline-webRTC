import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LogOut, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { syncStatus, triggerSync } = useSync();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary-800 text-white shadow-md">
      <div className="container mx-auto max-w-8xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="mr-2" size={24} />
          <h1 className="text-xl font-bold">Feedback Sync</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center mr-2">
              {syncStatus === 'offline' ? (
                <div className="flex items-center text-gray-300">
                  <WifiOff size={16} className="mr-2" />
                  <span className="text-sm">Offline</span>
                </div>
              ) : syncStatus === 'syncing' ? (
                <div className="flex items-center text-gray-300">
                  <RefreshCw size={16} className="mr-1 animate-spin" />
                  <span className="text-sm">Syncing...</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-300">
                  <Wifi size={16} className="mr-2" />
                  <span className="text-sm">Online</span>
                </div>
              )}
            </div>
            
            <div className="text-sm mr-4 hidden md:block">
              Welcome, <span className="font-semibold">{user.username}</span>
            </div>
            
            {syncStatus !== 'offline' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => triggerSync()}
                className="border-white text-white hover:bg-primary-700"
                icon={<RefreshCw size={16} />}
              >
                <span className="hidden sm:inline ml-2">Sync</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white text-white hover:bg-primary-700"
              icon={<LogOut size={16} />}
            >
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

