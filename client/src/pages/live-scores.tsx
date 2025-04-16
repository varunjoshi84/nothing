import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Match } from "@shared/schema";
import MatchCard from "@/components/ui/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function LiveScores() {
  const { user } = useAuth();
  const [sportFilter, setSportFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>('live');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all matches
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['/api/matches', { sportType: sportFilter, status: statusFilter }],
    queryFn: undefined
  });

  // Fetch user's favorites if logged in
  const { data: favoritesData } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: undefined,
    enabled: !!user
  });

  const matches = matchesData?.matches || [];
  const favorites = favoritesData?.favorites || [];

  // Check if a match is in favorites
  const isMatchFavorited = (matchId: number) => {
    return favorites.some((fav: any) => fav.matchId === matchId);
  };

  // Filter matches by search term
  const filteredMatches = matches.filter((match: Match) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.team1.toLowerCase().includes(searchLower) ||
      match.team2.toLowerCase().includes(searchLower) ||
      match.venue?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col">
          <h1 className="text-3xl font-heading font-bold mb-2">Live Scoreboard</h1>
          <p className="text-gray-400 mb-6">Real-time scores from matches around the world</p>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Tabs defaultValue={statusFilter || 'all'} className="w-full" onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value)}>
              <TabsList className="w-full md:w-auto mb-4 md:mb-0">
                <TabsTrigger value="all">All Matches</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col md:flex-row w-full gap-3">
              <div className="flex gap-2">
                <Button 
                  variant={!sportFilter ? "default" : "secondary"} 
                  onClick={() => setSportFilter(undefined)}
                >
                  All Sports
                </Button>
                <Button 
                  variant={sportFilter === "football" ? "default" : "secondary"} 
                  onClick={() => setSportFilter("football")}
                >
                  Football
                </Button>
                <Button 
                  variant={sportFilter === "cricket" ? "default" : "secondary"} 
                  onClick={() => setSportFilter("cricket")}
                >
                  Cricket
                </Button>
              </div>
              
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  className="pl-10 w-full" 
                  placeholder="Search teams, venues..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Matches Display */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="h-64 animate-pulse bg-gray-800/50 border-gray-700"></Card>
              ))}
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match: Match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  isFavorite={user ? isMatchFavorited(match.id) : false}
                />
              ))}
            </div>
          ) : (
            <Card className="border-gray-700 bg-black/60 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-medium mb-2">No Matches Found</h3>
                <p className="text-gray-400 text-center max-w-md">
                  {searchTerm 
                    ? "No matches match your search criteria. Try adjusting your filters."
                    : "There are no matches available with the selected filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
