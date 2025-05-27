import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { FeedbackItem, IssueType } from '../types';
import { authService } from './authService';
import { syncService } from './syncService';

export const feedbackService = {
  async getAllFeedback(): Promise<FeedbackItem[]> {
    try {
      return await db.getFeedbackItems();
    } catch (error) {
      console.error('Failed to get feedback items:', error);
      throw error;
    }
  },

  async getUserFeedback(): Promise<FeedbackItem[]> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      return await db.getUserFeedbackItems(userId);
    } catch (error) {
      console.error('Failed to get user feedback items:', error);
      throw error;
    }
  },

  async createFeedback(
    type: IssueType,
    title: string,
    description: string
  ): Promise<FeedbackItem> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const user = await db.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const now = Date.now();
      const feedbackItem: FeedbackItem = {
        id: uuidv4(),
        type,
        title,
        description,
        createdAt: now,
        lastModified: now,
        createdBy: user.username,
        userId,
        upvotes: []
      };

      await db.addFeedbackItem(feedbackItem);
      
      if (navigator.onLine) {
        syncService.syncNow();
      }
      
      return feedbackItem;
    } catch (error) {
      console.error('Failed to create feedback item:', error);
      throw error;
    }
  },

  async updateFeedback(
    id: string,
    updates: { type?: IssueType; title?: string; description?: string }
  ): Promise<FeedbackItem> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const existingItem = await db.feedback.get(id);
      if (!existingItem) {
        throw new Error('Feedback item not found');
      }

      if (existingItem.userId !== userId) {
        throw new Error('You can only edit your own feedback items');
      }

      const updatedItem: FeedbackItem = {
        ...existingItem,
        ...updates,
        lastModified: Date.now()
      };

      await db.updateFeedbackItem(updatedItem);
      
      if (navigator.onLine) {
        syncService.syncNow();
      }
      
      return updatedItem;
    } catch (error) {
      console.error('Failed to update feedback item:', error);
      throw error;
    }
  },

  async toggleUpvote(id: string): Promise<FeedbackItem> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const existingItem = await db.feedback.get(id);
      if (!existingItem) {
        throw new Error('Feedback item not found');
      }

      const hasUpvoted = existingItem.upvotes.includes(userId);
      const updatedUpvotes = hasUpvoted
        ? existingItem.upvotes.filter(id => id !== userId)
        : [...existingItem.upvotes, userId];

      const updatedItem: FeedbackItem = {
        ...existingItem,
        upvotes: updatedUpvotes,
        lastModified: Date.now()
      };

      await db.updateFeedbackItem(updatedItem);
      
      if (navigator.onLine) {
        syncService.syncNow();
      }
      
      return updatedItem;
    } catch (error) {
      console.error('Failed to toggle upvote:', error);
      throw error;
    }
  },

  async deleteFeedback(id: string): Promise<void> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await db.deleteFeedbackItem(id);
      
      if (navigator.onLine) {
        syncService.syncNow();
      }
    } catch (error) {
      console.error('Failed to delete feedback item:', error);
      throw error;
    }
  }
};