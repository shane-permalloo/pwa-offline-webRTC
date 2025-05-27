import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { FeedbackItem } from '../types';
import { useFeedback } from '../contexts/FeedbackContext';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackForm from '../components/feedback/FeedbackForm';

const HomePage: React.FC = () => {
  const { error } = useFeedback();
  const { syncStatus } = useSync();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | undefined>(undefined);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    // Log user info to help debug
    console.log("HomePage rendered with user:", user);
  }, [user]);

  const handleEdit = (feedbackItem: FeedbackItem) => {
    setEditingFeedback(feedbackItem);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingFeedback(undefined);
  };

  // Wrap the component rendering in error boundary
  try {
    return (
      <div className="container mx-auto px-4 py-6 max-w-8xl">
        {pageError && (
          <div className="mb-6 p-4 bg-error-50 text-error-800 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <p>Error: {pageError}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error-50 text-error-800 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {syncStatus === 'offline' && (
          <div className="mb-6 p-4 bg-warning-50 text-warning-800 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <p>You're currently offline. Your changes will be synchronized when you're back online.</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Customer Feedback</h1>
          <Button
            variant="primary"
            onClick={() => setIsFormOpen(true)}
            icon={<Plus size={18} />}
          >
            <span className='ml-2'>Add Feedback</span>
          </Button>
        </div>

        {isFormOpen ? (
          <div className="mb-6">
            <FeedbackForm
              feedbackItem={editingFeedback}
              onCancel={handleClose}
            />
          </div>
        ) : null}

        <FeedbackList onEdit={handleEdit} />
      </div>
    );
  } catch (err) {
    // Catch any rendering errors
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error("Error rendering HomePage:", err);
    setPageError(errorMessage);
    
    return (
      <div className="container mx-auto px-4 py-6 max-w-8xl">
        <div className="p-4 bg-error-50 text-error-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }
};

export default HomePage;
