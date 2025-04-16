import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Heart, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Match } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface MatchCardProps {
  match: Match;
  isFavorite?: boolean;
  showActions?: boolean;
}

export default function MatchCard({ match, isFavorite = false, showActions = true }: MatchCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isRemovingFavorite, setIsRemovingFavorite] = useState(false);
  
  const handleFavoriteToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save favorite matches.",
        variant: "destructive"
      });
      setLocation("/?auth=login");
      return;
    }
    
    try {
      if (isFavorite) {
        setIsRemovingFavorite(true);
        await apiRequest('DELETE', `/api/favorites/${match.id}`);
        toast({
          title: "Removed from favorites",
          description: "Match removed from your favorites."
        });
      } else {
        setIsAddingFavorite(true);
        await apiRequest('POST', '/api/favorites', { matchId: match.id });
        toast({
          title: "Added to favorites",
          description: "Match added to your favorites."
        });
      }
      
      // Invalidate favorites cache
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAddingFavorite(false);
      setIsRemovingFavorite(false);
    }
  };
  
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
      ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="overflow-hidden border border-gray-800 bg-black/60 backdrop-blur-md hover:shadow-md hover:shadow-red-900/10 transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4 relative">
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {match.status === 'live' ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </Badge>
          ) : match.status === 'upcoming' ? (
            <Badge variant="secondary">UPCOMING</Badge>
          ) : (
            <Badge variant="outline">COMPLETED</Badge>
          )}
        </div>
        
        {/* Match Info */}
        <div className="mb-3 text-sm text-gray-400">
          <span className="mr-1">
            {match.sportType === 'football' ? '⚽' : '🏏'}
          </span>
          {match.sportType === 'football' ? 'Football' : 'Cricket'} • 
          {match.status === 'live' ? 
            ` ${match.currentTime}` : 
            match.status === 'upcoming' ? 
              ` ${formatMatchDate(match.matchTime)}` : 
              ' Completed'}
        </div>
        
        {/* Team 1 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {match.team1Logo && (
              <img
                src={match.team1Logo}
                alt={match.team1}
                className="w-8 h-8 mr-2 object-contain"
              />
            )}
            <span className="font-medium">{match.team1}</span>
          </div>
          <div className="text-xl font-bold">{match.score1}</div>
        </div>
        
        {/* Team 2 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {match.team2Logo && (
              <img
                src={match.team2Logo}
                alt={match.team2}
                className="w-8 h-8 mr-2 object-contain"
              />
            )}
            <span className="font-medium">{match.team2}</span>
          </div>
          <div className="text-xl font-bold">{match.score2}</div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 border-t border-gray-800 pt-3 flex justify-between items-center">
          <div className="text-sm text-gray-400">{match.venue}</div>
          {showActions && (
            <div className="flex items-center space-x-2">
              {match.status === 'upcoming' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1 text-gray-400 hover:text-red-600 hover:bg-transparent"
                  onClick={async () => {
                    try {
                      await fetch('/api/notifications/check-upcoming', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      toast({
                        title: "Notification Set",
                        description: "You will be notified before the match starts",
                      });
                    } catch (error) {
                      console.error('Error setting notification:', error);
                      toast({
                        title: "Error",
                        description: "Failed to set notification",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">Notify</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${isFavorite ? 'text-red-600' : 'text-gray-400 hover:text-red-600'} hover:bg-transparent`}
                onClick={handleFavoriteToggle}
                disabled={isAddingFavorite || isRemovingFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="text-sm">
                  {isAddingFavorite ? 'Adding...' : 
                   isRemovingFavorite ? 'Removing...' : 
                   isFavorite ? 'Favorited' : 'Favorite'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
