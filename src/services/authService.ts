import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { User } from '../types';

export const authService = {
  // Check if user is logged in
  isAuthenticated(): boolean {
    return localStorage.getItem('currentUserId') !== null;
  },

  // Get current user ID
  getCurrentUserId(): string | null {
    return localStorage.getItem('currentUserId');
  },

  // Sign up a new user
  async signUp(username: string, email: string, password: string): Promise<User> {
    try {
      // Check if email is already in use
      const existingUsers = await db.users
        .where('email')
        .equals(email)
        .toArray();
      
      if (existingUsers.length > 0) {
        // If account exists but was created on another device, just log in
        return this.login(email, password);
      }

      // In a real app, you'd hash the password
      // Since this is a demo without a backend, we'll store it directly
      // WARNING: Never do this in a production app!
      const user: User = {
        id: uuidv4(),
        username,
        email,
        createdAt: Date.now(),
      };

      // Store the user in IndexedDB
      await db.addUser(user);
      
      // Store password separately (not ideal, but necessary for this demo)
      localStorage.setItem(`pwd_${user.id}`, password);
      
      // Set current user
      localStorage.setItem('currentUserId', user.id);
      
      // Trigger immediate sync to share this new account
      if (navigator.onLine) {
        const { syncService } = await import('./syncService');
        syncService.syncNow();
      }
      
      return user;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  },

  // Login an existing user
  async login(email: string, password: string): Promise<User> {
    try {
      // Find user with matching email
      const users = await db.users
        .where('email')
        .equals(email)
        .toArray();
      
      if (users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = users[0];
      
      // Verify password (again, not secure but sufficient for demo)
      const storedPassword = localStorage.getItem(`pwd_${user.id}`);
      
      if (password !== storedPassword) {
        throw new Error('Invalid email or password');
      }
      
      // Set current user
      localStorage.setItem('currentUserId', user.id);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout current user
  logout(): void {
    localStorage.removeItem('currentUserId');
  }
};
