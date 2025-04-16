import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, 
  loginSchema, 
  insertMatchSchema, 
  insertFavoriteSchema, 
  insertFeedbackSchema, 
  registerSchema,
  feedbackFormSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import axios from "axios";

const MemoryStoreSession = MemoryStore(session);

async function configurePassport() {
  // Configure passport local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Don't send password to the client
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      done(err);
    }
  });
}

// Middleware to validate requests with zod schema
function validateRequest<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: Function) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors
        });
      } else {
        next(error);
      }
    }
  };
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Not authorized' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure sessions
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'sportsapp-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  await configurePassport();

  // Create HTTP server
  const httpServer = createServer(app);

  // AUTH ROUTES
  app.post('/api/auth/register', validateRequest(registerSchema), async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Log the user in
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error during login after registration' });
        }
        return res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });

  app.post('/api/auth/login', validateRequest(loginSchema), (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Successfully logged out' });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.user });
  });

  // USER ROUTES
  app.put('/api/users/profile', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userData = req.body;
      
      // Don't allow role update through this endpoint
      delete userData.role;
      
      // If updating password, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error during profile update' });
    }
  });

  app.delete('/api/users/account', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log the user out
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: 'Error during logout after account deletion' });
        }
        res.json({ message: 'Account successfully deleted' });
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ message: 'Server error during account deletion' });
    }
  });

  // MATCH ROUTES
  app.get('/api/matches', async (req, res) => {
    try {
      const sportType = req.query.sportType as string | undefined;
      const status = req.query.status as string | undefined;
      
      const matches = await storage.getMatches({ sportType, status });
      res.json({ matches });
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ message: 'Server error while fetching matches' });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }
      
      res.json({ match });
    } catch (error) {
      console.error('Get match error:', error);
      res.status(500).json({ message: 'Server error while fetching match' });
    }
  });

  // ADMIN MATCH ROUTES
  app.post('/api/admin/matches', isAdmin, validateRequest(insertMatchSchema), async (req, res) => {
    try {
      const match = await storage.createMatch(req.body);
      res.status(201).json({ match });
    } catch (error) {
      console.error('Create match error:', error);
      res.status(500).json({ message: 'Server error while creating match' });
    }
  });

  app.put('/api/admin/matches/:id', isAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.updateMatch(matchId, req.body);
      
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }
      
      res.json({ match });
    } catch (error) {
      console.error('Update match error:', error);
      res.status(500).json({ message: 'Server error while updating match' });
    }
  });

  app.delete('/api/admin/matches/:id', isAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const success = await storage.deleteMatch(matchId);
      
      if (!success) {
        return res.status(404).json({ message: 'Match not found' });
      }
      
      res.json({ message: 'Match successfully deleted' });
    } catch (error) {
      console.error('Delete match error:', error);
      res.status(500).json({ message: 'Server error while deleting match' });
    }
  });

  // FAVORITE ROUTES
  app.get('/api/favorites', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavoritesByUserId(userId);
      res.json({ favorites });
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({ message: 'Server error while fetching favorites' });
    }
  });

  app.post('/api/favorites', isAuthenticated, validateRequest(insertFavoriteSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { matchId } = req.body;
      
      // Ensure user can only add favorites for themselves
      const favorite = await storage.addFavorite({ userId, matchId });
      
      res.status(201).json({ favorite });
    } catch (error) {
      console.error('Add favorite error:', error);
      
      if (error instanceof Error && error.message === 'Match is already in favorites') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Server error while adding favorite' });
    }
  });

  app.delete('/api/favorites/:matchId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const matchId = parseInt(req.params.matchId);
      
      const success = await storage.removeFavorite(userId, matchId);
      
      if (!success) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.json({ message: 'Favorite successfully removed' });
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ message: 'Server error while removing favorite' });
    }
  });

  // NOTIFICATION ROUTES
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json({ notifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error while fetching notifications' });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json({ notification });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Server error while updating notification' });
    }
  });

  // FEEDBACK ROUTES
  app.post('/api/feedback', validateRequest(feedbackFormSchema), async (req, res) => {
    try {
      const { name, email, category, message, subscribeToNewsletter } = req.body;
      
      const userId = req.user ? (req.user as any).id : undefined;
      
      const feedback = await storage.submitFeedback({
        userId,
        name,
        email,
        category,
        message,
        subscribeToNewsletter: subscribeToNewsletter || false
      });
      
      res.status(201).json({ feedback });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ message: 'Server error while submitting feedback' });
    }
  });

  // Admin-only endpoint to get all feedback
  app.get('/api/admin/feedback', isAdmin, async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      res.json({ feedback });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Server error while fetching feedback' });
    }
  });

  // EXTERNAL SPORTS API
  app.get('/api/sports-news', async (req, res) => {
    try {
      const apiKey = process.env.SPORTS_API_KEY;
      const sport = req.query.sport || 'football';
      
      if (!apiKey) {
        // Return mock data structure if no API key
        return res.json({
          articles: []
        });
      }
      
      // Fetch recent news articles related to the specified sport
      const response = await axios.get(`https://newsapi.org/v2/everything?q=${sport}&apiKey=${apiKey}&pageSize=5`);
      
      res.json(response.data);
    } catch (error) {
      console.error('Sports API error:', error);
      // Return empty articles array on error
      res.json({ 
        articles: []
      });
    }
  });

  return httpServer;
}
