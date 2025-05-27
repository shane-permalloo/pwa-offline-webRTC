import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeedbackItem, IssueType } from '../types';
import { feedbackService } from '../services/feedbackService';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';
import { syncEvents } from '../services/syncService';

interface FeedbackContextType {
  feedbackItems: FeedbackItem[];
  isLoading: boolean;
  error: string | null;
  createFeedback: (type: IssueType, title: string, description: string) => Promise<void>;
  updateFeedback: (id: string, updates: { type?: IssueType; title?: string; description?: string }) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  toggleUpvote: (id: string) => Promise<void>;
  refreshFeedback: () => Promise<void>;
  userCanEdit: (feedbackItem: FeedbackItem) => boolean;
  hasUpvoted: (feedbackItem: FeedbackItem) => boolean;
}

const FeedbackContext = createContext<FeedbackContextType>({
  feedbackItems: [],
  isLoading: false,
  error: null,
  createFeedback: async () => {},
  updateFeedback: async () => {},
  deleteFeedback: async () => {},
  toggleUpvote: async () => {},
  refreshFeedback: async () => {},
  userCanEdit: () => false,
  hasUpvoted: () => false,
});

export const useFeedback = () => useContext(FeedbackContext);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { syncStatus } = useSync();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshFeedback();
      
      const unsubscribe = syncEvents.subscribe('data-received', () => {
        refreshFeedback();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user, syncStatus]);

  const refreshFeedback = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await feedbackService.getAllFeedback();
      items.sort((a, b) => {
        // Sort by upvotes first, then by date
        const upvoteDiff = b.upvotes.length - a.upvotes.length;
        if (upvoteDiff !== 0) return upvoteDiff;
        return b.createdAt - a.createdAt;
      });
      setFeedbackItems(items);
    } catch (err) {
      setError('Failed to load feedback items');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createFeedback = async (type: IssueType, title: string, description: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await feedbackService.createFeedback(type, title, description);
      await refreshFeedback();
    } catch (err) {
      setError('Failed to create feedback');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedback = async (
    id: string,
    updates: { type?: IssueType; title?: string; description?: string }
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await feedbackService.updateFeedback(id, updates);
      await refreshFeedback();
    } catch (err) {
      setError('Failed to update feedback');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUpvote = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await feedbackService.toggleUpvote(id);
      await refreshFeedback();
    } catch (err) {
      setError('Failed to update upvote');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await feedbackService.deleteFeedback(id);
      await refreshFeedback();
    } catch (err) {
      setError('Failed to delete feedback');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const userCanEdit = (feedbackItem: FeedbackItem): boolean => {
    return user?.id === feedbackItem.userId;
  };

  const hasUpvoted = (feedbackItem: FeedbackItem): boolean => {
    return user ? feedbackItem.upvotes.includes(user.id) : false;
  };

  return (
    <FeedbackContext.Provider
      value={{
        feedbackItems,
        isLoading,
        error,
        createFeedback,
        updateFeedback,
        deleteFeedback,
        toggleUpvote,
        refreshFeedback,
        userCanEdit,
        hasUpvoted,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};