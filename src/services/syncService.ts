import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authService } from './authService';
import { FeedbackItem, PeerData, User } from '../types';

// Event bus for sync events
type SyncEventType = 'status-change' | 'data-received' | 'peer-connected' | 'peer-disconnected';
type SyncEventCallback = (data: any) => void;

class SyncEventBus {
  private listeners: Record<SyncEventType, SyncEventCallback[]> = {
    'status-change': [],
    'data-received': [],
    'peer-connected': [],
    'peer-disconnected': []
  };

  public subscribe(event: SyncEventType, callback: SyncEventCallback) {
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  public publish(event: SyncEventType, data: any) {
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const syncEvents = new SyncEventBus();

class SyncService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private peerId: string = '';
  private isOnline: boolean = navigator.onLine;
  private syncStatus: 'offline' | 'syncing' | 'synced' | 'error' = 'offline';
  private syncInterval: number | null = null;
  private reconnectTimeout: number | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Initial status
    this.updateSyncStatus(navigator.onLine ? 'synced' : 'offline');
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.updateSyncStatus('syncing');
    this.initPeer();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.updateSyncStatus('offline');
    this.destroyPeer();
  };

  private updateSyncStatus(status: 'offline' | 'syncing' | 'synced' | 'error') {
    this.syncStatus = status;
    syncEvents.publish('status-change', status);
  }

  public getSyncStatus() {
    return this.syncStatus;
  }

  public getPeerId() {
    return this.peerId;
  }

  public async init() {
    if (!authService.isAuthenticated()) {
      console.warn('Cannot initialize sync: User not authenticated');
      return;
    }

    if (this.isOnline) {
      await this.initPeer();
      this.startSyncInterval();
    }
  }

  private async initPeer() {
    if (this.peer) {
      this.destroyPeer();
    }

    try {
      // Generate a unique peer ID using the user ID and a random string
      const userId = authService.getCurrentUserId();
      this.peerId = `${userId}-${uuidv4().substring(0, 8)}`;
      
      this.peer = new Peer(this.peerId);
      
      this.peer.on('open', async (id) => {
        console.log('Connected to PeerJS server with ID:', id);
        this.updateSyncStatus('synced');
        
        // Register this peer in the database
        const user = await db.getCurrentUser();
        if (user) {
          await db.addPeer({
            peerId: id,
            username: user.username,
            lastSeen: Date.now()
          });
        }
        
        // Connect to existing peers
        this.connectToKnownPeers();
      });
      
      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });
      
      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        this.updateSyncStatus('error');
        
        // Try to reconnect after a delay
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = window.setTimeout(() => {
          this.initPeer();
        }, 5000) as unknown as number;
      });
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      this.updateSyncStatus('error');
    }
  }

  private async connectToKnownPeers() {
    try {
      const peers = await db.getPeers();
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      // Only connect to peers seen in the last hour
      const recentPeers = peers.filter(peer => peer.lastSeen > oneHourAgo);
      
      for (const peer of recentPeers) {
        if (peer.peerId !== this.peerId && !this.connections.has(peer.peerId)) {
          this.connectToPeer(peer.peerId);
        }
      }
    } catch (error) {
      console.error('Failed to connect to known peers:', error);
    }
  }

  private connectToPeer(peerId: string) {
    if (!this.peer || this.connections.has(peerId)) return;
    
    try {
      const conn = this.peer.connect(peerId, {
        reliable: true
      });
      
      this.handleConnection(conn);
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
    }
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('Connected to peer:', conn.peer);
      this.connections.set(conn.peer, conn);
      
      // Notify about new connection
      syncEvents.publish('peer-connected', conn.peer);
      
      // Send our data to the new peer
      this.syncWithPeer(conn);
    });
    
    conn.on('data', async (data: any) => {
      console.log('Received data from peer:', conn.peer, data);
      
      // Process all incoming data types
      await this.processIncomingData(data);
      
      syncEvents.publish('data-received', {
        peerId: conn.peer,
        data
      });
    });
    
    conn.on('close', () => {
      console.log('Disconnected from peer:', conn.peer);
      this.connections.delete(conn.peer);
      syncEvents.publish('peer-disconnected', conn.peer);
    });
    
    conn.on('error', (err) => {
      console.error(`Error with connection to ${conn.peer}:`, err);
      this.connections.delete(conn.peer);
    });
  }

  private async syncWithPeer(conn: DataConnection) {
    try {
      // Send user info
      const currentUser = await db.getCurrentUser();
      if (currentUser) {
        conn.send({
          type: 'user-info',
          username: currentUser.username
        });
        
        // Send all user accounts for synchronization
        const allUsers = await db.users.toArray();
        const userPasswords: Record<string, string> = {};
        
        // Collect passwords for each user
        for (const user of allUsers) {
          const pwd = localStorage.getItem(`pwd_${user.id}`);
          if (pwd) {
            userPasswords[user.id] = pwd;
          }
        }
        
        conn.send({
          type: 'users-sync',
          users: allUsers,
          passwords: userPasswords
        });
      }
      
      // Send feedback items
      const feedbackItems = await db.getFeedbackItems();
      conn.send({
        type: 'feedback-sync',
        items: feedbackItems
      });
    } catch (error) {
      console.error('Failed to sync with peer:', error);
    }
  }

  private async processIncomingData(data: any) {
    try {
      if (data.type === 'feedback-sync') {
        await this.processIncomingFeedback(data.items);
      } else if (data.type === 'user-info') {
        // Update peer info
        await db.addPeer({
          peerId: data.peerId,
          username: data.username,
          lastSeen: Date.now()
        });
      } else if (data.type === 'users-sync') {
        await this.processIncomingUsers(data.users, data.passwords);
      }
    } catch (error) {
      console.error('Failed to process incoming data:', error);
    }
  }

  private async processIncomingUsers(users: User[], passwords: Record<string, string>) {
    try {
      for (const user of users) {
        // Check if we already have this user
        const existingUser = await db.users.get(user.id);
        
        if (!existingUser) {
          // New user, add it
          await db.users.add(user);
          
          // Store password if available
          if (passwords[user.id]) {
            localStorage.setItem(`pwd_${user.id}`, passwords[user.id]);
          }
        } else if (user.createdAt > existingUser.createdAt) {
          // Incoming user is newer, update ours
          await db.users.put(user);
          
          // Update password if available
          if (passwords[user.id]) {
            localStorage.setItem(`pwd_${user.id}`, passwords[user.id]);
          }
        }
        // If our user is newer or the same, do nothing
      }
    } catch (error) {
      console.error('Failed to process incoming users:', error);
    }
  }

  private async processIncomingFeedback(items: FeedbackItem[]) {
    try {
      for (const item of items) {
        // Check if we already have this item
        const existingItem = await db.feedback.get(item.id);
        
        if (!existingItem) {
          // New item, add it
          await db.feedback.add(item);
        } else if (item.lastModified > existingItem.lastModified) {
          // Incoming item is newer, update ours
          await db.feedback.put(item);
        }
        // If our item is newer or the same, do nothing
      }
    } catch (error) {
      console.error('Failed to process incoming feedback:', error);
    }
  }

  private startSyncInterval() {
    // Periodically sync with all connected peers
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && this.connections.size > 0) {
        this.updateSyncStatus('syncing');
        
        // Sync with all connected peers
        this.connections.forEach(conn => {
          this.syncWithPeer(conn);
        });
        
        // After syncing
        setTimeout(() => {
          if (this.isOnline) {
            this.updateSyncStatus('synced');
          }
        }, 1000);
      }
    }, 30000) as unknown as number; // Sync every 30 seconds
  }

  public async syncNow() {
    if (!this.isOnline || !this.peer) {
      console.warn('Cannot sync: Offline or peer not initialized');
      return;
    }
    
    this.updateSyncStatus('syncing');
    
    // Connect to known peers if not already connected
    if (this.connections.size === 0) {
      await this.connectToKnownPeers();
    }
    
    // Sync with all connected peers
    this.connections.forEach(conn => {
      this.syncWithPeer(conn);
    });
    
    // After syncing
    setTimeout(() => {
      if (this.isOnline) {
        this.updateSyncStatus('synced');
      }
    }, 1000);
  }

  public destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.destroyPeer();
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private destroyPeer() {
    // Close all connections
    this.connections.forEach(conn => {
      conn.close();
    });
    this.connections.clear();
    
    // Close peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const syncService = new SyncService();
