import React from 'react';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && <Header />}
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="container mx-auto px-4">
          Feedback Sync &copy; {new Date().getFullYear()} - PWA with offline mode
        </div>
      </footer>
    </div>
  );
};

export default Layout;