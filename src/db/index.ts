import Dexie, { Table } from 'dexie';
import { FeedbackItem, User, PeerData } from '../types';

export class FeedbackDatabase extends Dexie {
  users!: Table<User, string>;
  feedback!: Table<FeedbackItem, string>;
  peers!: Table<PeerData, string>;

  constructor() {
    super('feedbackSync');
    
    this.version(1).stores({
      users: 'id, email, username, createdAt',
      feedback: 'id, type, title, createdAt, createdBy, lastModified, userId',
      peers: 'peerId, username, lastSeen'
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getCurrentUser(): Promise<User | undefined> {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return undefined;
    return this.getUser(userId);
  }

  async addUser(user: User): Promise<string> {
    await this.users.add(user);
    return user.id;
  }

  async getFeedbackItems(): Promise<FeedbackItem[]> {
    return this.feedback.toArray();
  }

  async getUserFeedbackItems(userId: string): Promise<FeedbackItem[]> {
    return this.feedback.where('userId').equals(userId).toArray();
  }

  async addFeedbackItem(item: FeedbackItem): Promise<string> {
    return this.feedback.add(item);
  }

  async updateFeedbackItem(item: FeedbackItem): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    // Only allow update if the user owns the item
    const existingItem = await this.feedback.get(item.id);
    if (!existingItem) throw new Error('Feedback item not found');
    
    if (existingItem.userId !== currentUser.id) {
      throw new Error('You can only edit your own feedback items');
    }
    
    await this.feedback.update(item.id, {
      ...item,
      lastModified: Date.now()
    });
  }

  async deleteFeedbackItem(id: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    // Only allow deletion if the user owns the item
    const existingItem = await this.feedback.get(id);
    if (!existingItem) throw new Error('Feedback item not found');
    
    if (existingItem.userId !== currentUser.id) {
      throw new Error('You can only delete your own feedback items');
    }
    
    await this.feedback.delete(id);
  }

  async addPeer(peer: PeerData): Promise<string> {
    await this.peers.put(peer);
    return peer.peerId;
  }

  async getPeers(): Promise<PeerData[]> {
    return this.peers.toArray();
  }

  async removePeer(peerId: string): Promise<void> {
    await this.peers.delete(peerId);
  }
}

export const db = new FeedbackDatabase();