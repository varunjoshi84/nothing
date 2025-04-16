import { apiRequest } from './queryClient';
import { Match, Feedback, InsertMatch, InsertFeedback } from '@shared/schema';

// Fetch all matches
export async function getMatches(filters?: { sportType?: string; status?: string }) {
  const queryParams = new URLSearchParams();
  
  if (filters?.sportType) {
    queryParams.append('sportType', filters.sportType);
  }
  
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const res = await apiRequest('GET', `/api/matches${queryString}`);
  const data = await res.json();
  return data.matches as Match[];
}

// Fetch single match
export async function getMatch(id: number) {
  const res = await apiRequest('GET', `/api/matches/${id}`);
  const data = await res.json();
  return data.match as Match;
}

// Admin: Create a new match
export async function createMatch(match: InsertMatch) {
  const res = await apiRequest('POST', '/api/admin/matches', match);
  const data = await res.json();
  return data.match as Match;
}

// Admin: Update a match
export async function updateMatch(id: number, match: Partial<InsertMatch>) {
  const res = await apiRequest('PUT', `/api/admin/matches/${id}`, match);
  const data = await res.json();
  return data.match as Match;
}

// Admin: Delete a match
export async function deleteMatch(id: number) {
  await apiRequest('DELETE', `/api/admin/matches/${id}`);
  return true;
}

// Toggle favorite status for a match
export async function toggleFavorite(matchId: number, isFavorite: boolean) {
  if (isFavorite) {
    await apiRequest('DELETE', `/api/favorites/${matchId}`);
  } else {
    await apiRequest('POST', '/api/favorites', { matchId });
  }
  return !isFavorite;
}

// Get user's favorite matches
export async function getFavorites() {
  const res = await apiRequest('GET', '/api/favorites');
  const data = await res.json();
  return data.favorites;
}

// Submit feedback
export async function submitFeedback(feedback: InsertFeedback) {
  const res = await apiRequest('POST', '/api/feedback', feedback);
  const data = await res.json();
  return data.feedback as Feedback;
}

// Admin: Get all feedback submissions
export async function getAllFeedback() {
  const res = await apiRequest('GET', '/api/admin/feedback');
  const data = await res.json();
  return data.feedback as Feedback[];
}

// Get sports news
export async function getSportsNews(sport: string = 'soccer') {
  const res = await apiRequest('GET', `/api/sports-news?sport=${sport}`);
  return await res.json();
}
