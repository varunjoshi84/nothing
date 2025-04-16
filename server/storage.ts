import { 
  users, type User, type InsertUser,
  matches, type Match, type InsertMatch,
  favorites, type Favorite, type InsertFavorite,
  notifications, type Notification, type InsertNotification,
  feedback, type Feedback, type InsertFeedback
} from "@shared/schema";

// modify the interface with any CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Match methods
  getMatch(id: number): Promise<Match | undefined>;
  getMatches(filters?: { sportType?: string; status?: string }): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;
  
  // Favorite methods
  getFavoritesByUserId(userId: number): Promise<(Favorite & { match: Match })[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, matchId: number): Promise<boolean>;
  isFavorite(userId: number, matchId: number): Promise<boolean>;
  
  // Notification methods
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Feedback methods
  getFeedback(): Promise<Feedback[]>;
  submitFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private favorites: Map<number, Favorite>;
  private notifications: Map<number, Notification>;
  private feedbacks: Map<number, Feedback>;
  
  private userIdCounter: number;
  private matchIdCounter: number;
  private favoriteIdCounter: number;
  private notificationIdCounter: number;
  private feedbackIdCounter: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.favorites = new Map();
    this.notifications = new Map();
    this.feedbacks = new Map();
    
    this.userIdCounter = 1;
    this.matchIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.notificationIdCounter = 1;
    this.feedbackIdCounter = 1;
    
    // Add default admin user
    this.createUser({
      username: 'admin',
      email: 'admin@sportsapp.com',
      password: '$2b$10$OI.0/FxL1bfXVU3KQhKUKuw8dBVS.KbPgqrA8UKa9xSbZiW.MDBLu', // hashed 'admin123'
      role: 'admin'
    });
    
    // Add some sample matches
    this.addSampleMatches();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const deleted = this.users.delete(id);
    
    // Also delete related user data
    for (const [favoriteId, favorite] of this.favorites.entries()) {
      if (favorite.userId === id) {
        this.favorites.delete(favoriteId);
      }
    }
    
    for (const [notificationId, notification] of this.notifications.entries()) {
      if (notification.userId === id) {
        this.notifications.delete(notificationId);
      }
    }
    
    return deleted;
  }

  // Match methods
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatches(filters?: { sportType?: string; status?: string }): Promise<Match[]> {
    let matches = Array.from(this.matches.values());
    
    if (filters) {
      if (filters.sportType) {
        matches = matches.filter(match => match.sportType === filters.sportType);
      }
      
      if (filters.status) {
        matches = matches.filter(match => match.status === filters.status);
      }
    }
    
    // Sort by most recent first
    return matches.sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime());
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.matchIdCounter++;
    const createdAt = new Date();
    const newMatch: Match = { ...match, id, createdAt };
    this.matches.set(id, newMatch);
    return newMatch;
  }

  async updateMatch(id: number, matchData: Partial<InsertMatch>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch: Match = { ...match, ...matchData };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
    const deleted = this.matches.delete(id);
    
    // Also delete related match data
    for (const [favoriteId, favorite] of this.favorites.entries()) {
      if (favorite.matchId === id) {
        this.favorites.delete(favoriteId);
      }
    }
    
    return deleted;
  }

  // Favorite methods
  async getFavoritesByUserId(userId: number): Promise<(Favorite & { match: Match })[]> {
    const userFavorites = Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId);
    
    return userFavorites.map(favorite => {
      const match = this.matches.get(favorite.matchId);
      if (!match) {
        throw new Error(`Match with ID ${favorite.matchId} not found`);
      }
      return { ...favorite, match };
    });
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    // Check if already exists
    const exists = await this.isFavorite(favorite.userId, favorite.matchId);
    if (exists) {
      throw new Error("Match is already in favorites");
    }
    
    const id = this.favoriteIdCounter++;
    const createdAt = new Date();
    const newFavorite: Favorite = { ...favorite, id, createdAt };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async removeFavorite(userId: number, matchId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      f => f.userId === userId && f.matchId === matchId
    );
    
    if (!favorite) return false;
    return this.favorites.delete(favorite.id);
  }

  async isFavorite(userId: number, matchId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      f => f.userId === userId && f.matchId === matchId
    );
  }

  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date();
    const newNotification: Notification = { ...notification, id, createdAt };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Feedback methods
  async getFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async submitFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const createdAt = new Date();
    const newFeedback: Feedback = { ...feedbackData, id, createdAt };
    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }

  // Helper method to populate sample matches
  private addSampleMatches() {
    const now = new Date();
    
    // Add football matches
    this.createMatch({
      sportType: 'football',
      team1: 'Arsenal',
      team2: 'Liverpool',
      team1Logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      team2Logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      score1: '2',
      score2: '1',
      venue: 'Emirates Stadium',
      matchTime: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
      status: 'live',
      currentTime: '75\''
    });
    
    this.createMatch({
      sportType: 'football',
      team1: 'Barcelona',
      team2: 'Real Madrid',
      team1Logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      team2Logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score1: '-',
      score2: '-',
      venue: 'Camp Nou, Barcelona',
      matchTime: new Date(now.getTime() + 24 * 3600000), // Tomorrow
      status: 'upcoming',
      currentTime: '-'
    });
    
    // Add cricket matches
    this.createMatch({
      sportType: 'cricket',
      team1: 'India',
      team2: 'Pakistan',
      team1Logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_India.png',
      team2Logo: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Flag_of_Pakistan.svg',
      score1: '187/4',
      score2: 'Yet to bat',
      venue: 'MCG, Melbourne',
      matchTime: new Date(now.getTime() - 2 * 3600000), // 2 hours ago
      status: 'live',
      currentTime: '32.4 Overs'
    });
  }
}

export const storage = new MemStorage();
