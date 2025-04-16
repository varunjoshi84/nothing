import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Match status enum
export const matchStatusEnum = pgEnum('match_status', ['upcoming', 'live', 'completed']);

// Sport type enum
export const sportTypeEnum = pgEnum('sport_type', ['football', 'cricket']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default('user').notNull(),
  favoriteSport: sportTypeEnum("favorite_sport"),
  favoriteTeam: text("favorite_team"),
  createdAt: timestamp("created_at").defaultNow()
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sportType: sportTypeEnum("sport_type").notNull(),
  team1: text("team1").notNull(),
  team2: text("team2").notNull(),
  team1Logo: text("team1_logo"),
  team2Logo: text("team2_logo"),
  score1: text("score1").default('-'),
  score2: text("score2").default('-'),
  venue: text("venue"),
  matchTime: timestamp("match_time").notNull(),
  status: matchStatusEnum("status").default('upcoming').notNull(),
  currentTime: text("current_time"),
  createdAt: timestamp("created_at").defaultNow()
});

// Favorites table - to track user's favorite matches
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow()
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  subscribeToNewsletter: boolean("subscribe_to_newsletter").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Schema validation for inserts
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  notifications: many(notifications),
  feedback: many(feedback)
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  favorites: many(favorites)
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  match: one(matches, {
    fields: [favorites.matchId],
    references: [matches.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id]
  })
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional()
});

export type LoginData = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = insertUserSchema.pick({
  username: true,
  email: true, 
  password: true
}).extend({
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type RegisterData = z.infer<typeof registerSchema>;

// Feedback schema
export const feedbackFormSchema = insertFeedbackSchema.pick({
  name: true,
  email: true,
  category: true, 
  message: true,
  subscribeToNewsletter: true
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
