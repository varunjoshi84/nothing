import { 
  users, type User, type InsertUser,
  matches, type Match, type InsertMatch,
  favorites, type Favorite, type InsertFavorite,
  notifications, type Notification, type InsertNotification,
  feedback, type Feedback, type InsertFeedback,
  newsArticles, type NewsArticle, type InsertNewsArticle
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";

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

  // News Article methods
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  getNewsArticles(sportType?: string): Promise<NewsArticle[]>;
  deleteNewsArticle(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private favorites: Map<number, Favorite>;
  private notifications: Map<number, Notification>;
  private feedbacks: Map<number, Feedback>;
  private newsArticles: Map<number, NewsArticle>;

  private userIdCounter: number;
  private matchIdCounter: number;
  private favoriteIdCounter: number;
  private notificationIdCounter: number;
  private feedbackIdCounter: number;
  private newsArticleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.favorites = new Map();
    this.notifications = new Map();
    this.feedbacks = new Map();
    this.newsArticles = new Map();

    this.userIdCounter = 1;
    this.matchIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.notificationIdCounter = 1;
    this.feedbackIdCounter = 1;
    this.newsArticleIdCounter = 1;

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

    // News Article methods
  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const id = this.newsArticleIdCounter++;
    const createdAt = new Date();
    const newArticle: NewsArticle = { ...article, id, createdAt };
    this.newsArticles.set(id, newArticle);
    return newArticle;
  }

  async getNewsArticles(sportType?: string): Promise<NewsArticle[]> {
    let articles = Array.from(this.newsArticles.values());
    if (sportType) {
      articles = articles.filter(article => article.sportType === sportType);
    }
    return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    return this.newsArticles.delete(id);
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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Match methods
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatches(filters?: { sportType?: string; status?: string }): Promise<Match[]> {
    let query = db.select().from(matches);

    if (filters?.sportType) {
      query = query.where(eq(matches.sportType, filters.sportType as any));
    }

    if (filters?.status) {
      query = query.where(eq(matches.status, filters.status as any));
    }

    // Sort by matchTime descending (newest first)
    return await query.orderBy(desc(matches.matchTime));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async updateMatch(id: number, matchData: Partial<InsertMatch>): Promise<Match | undefined> {
    const [updatedMatch] = await db.update(matches)
      .set(matchData)
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
    const result = await db.delete(matches).where(eq(matches.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Favorites methods
  async getFavoritesByUserId(userId: number): Promise<(Favorite & { match: Match })[]> {
    const userFavorites = await db.select().from(favorites)
      .where(eq(favorites.userId, userId));

    const result = [];
    for (const favorite of userFavorites) {
      const [match] = await db.select().from(matches)
        .where(eq(matches.id, favorite.matchId));

      if (match) {
        result.push({ ...favorite, match });
      }
    }

    return result;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    // Check if already exists
    const exists = await this.isFavorite(favorite.userId, favorite.matchId);
    if (exists) {
      throw new Error("Match is already in favorites");
    }

    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: number, matchId: number): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.matchId, matchId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async isFavorite(userId: number, matchId: number): Promise<boolean> {
    const [favorite] = await db.select().from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.matchId, matchId)
        )
      );
    return !!favorite;
  }

  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Feedback methods
  async getFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  async submitFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  // News Article methods
  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newArticle] = await db.insert(newsArticles).values(article).returning();
    return newArticle;
  }

  async getNewsArticles(sportType?: string): Promise<NewsArticle[]> {
    let query = db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
    if (sportType) {
      query = query.where(eq(newsArticles.sportType, sportType));
    }
    return await query;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    const result = await db.delete(newsArticles).where(eq(newsArticles.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async seedInitialData(): Promise<void> {
    // Check if we already have admin user
    const adminUser = await this.getUserByEmail('admin@sportsapp.com');
    if (!adminUser) {
      // Create admin user
      await this.createUser({
        username: 'admin',
        email: 'admin@sportsapp.com',
        password: '$2b$10$OI.0/FxL1bfXVU3KQhKUKuw8dBVS.KbPgqrA8UKa9xSbZiW.MDBLu', // hashed 'admin123'
        role: 'admin'
      });
    }

    // Check if we need to add sample matches
    // Initialize news_articles table
    await db.create().table(newsArticles).ifNotExists();
    
    const matchesCount = await db.select().from(matches);
    if (matchesCount.length === 0) {
      // Add sample matches
      const now = new Date();

      // Add football matches
      await this.createMatch({
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

      await this.createMatch({
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
      await this.createMatch({
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
}

// Create and initialize the storage instance
export const storage = new DatabaseStorage();

// Create notifications for upcoming matches
async function notifyUpcomingMatch(storage: IStorage, userId: number, match: Match) {
  const timeUntilMatch = new Date(match.matchTime).getTime() - new Date().getTime();
  const hoursUntilMatch = Math.floor(timeUntilMatch / (1000 * 60 * 60));

  if (hoursUntilMatch === 24) { // Notify 24 hours before
    await storage.createNotification({
      userId,
      message: `Upcoming match tomorrow: ${match.team1} vs ${match.team2} at ${match.venue}`,
      read: false
    });
  } else if (hoursUntilMatch === 1) { // Notify 1 hour before
    await storage.createNotification({
      userId,
      message: `Match starting in 1 hour: ${match.team1} vs ${match.team2}`,
      read: false
    });
  }
}

// SPORTS NEWS API MOCK - Fallback if no articles in database
//app.get('/api/sports-news/mock', async (req, res) => {