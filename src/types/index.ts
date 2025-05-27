export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: number;
};

export type IssueType = 'bug' | 'suggestion';

export type FeedbackItem = {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  createdAt: number;
  createdBy: string;
  lastModified: number;
  userId: string;
  upvotes: string[]; // Array of user IDs who upvoted
};

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

export type PeerData = {
  peerId: string;
  username: string;
  lastSeen: number;
};