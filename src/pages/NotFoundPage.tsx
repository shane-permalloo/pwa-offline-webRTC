import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
      <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/')}
        icon={<Home size={18} />}
      >
        <span className='ml-2'>Back to Home</span>
      </Button>
    </div>
  );
};

export default NotFoundPage;