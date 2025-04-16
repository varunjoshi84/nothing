import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getSportsNews } from "@/lib/api";
import MatchCard from "@/components/ui/match-card";
import { Match } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SportsCategoryProps {
  type: string;
}

export default function SportsCategory({ type }: SportsCategoryProps) {
  const { user } = useAuth();
  const [newsData, setNewsData] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  
  // Validate sport type
  const sportType = type === 'football' || type === 'cricket' ? type : 'football';
  const sportDisplayName = sportType.charAt(0).toUpperCase() + sportType.slice(1);
  
  // Fetch matches by sport type
  const { data: matchesData, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['/api/matches', { sportType }]
  });
  
  // Fetch user's favorites if logged in
  const { data: favoritesData } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: !!user
  });
  
  // Fetch sports news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsNewsLoading(true);
        const data = await getSportsNews(sportType);
        setNewsData(data.articles || []);
      } catch (error) {
        console.error("Error fetching sports news:", error);
      } finally {
        setIsNewsLoading(false);
      }
    };
    
    fetchNews();
  }, [sportType]);
  
  const matches = matchesData?.matches || [];
  const favorites = favoritesData?.favorites || [];
  
  // Filter matches by status
  const liveMatches = matches.filter((match: Match) => match.status === 'live');
  const upcomingMatches = matches.filter((match: Match) => match.status === 'upcoming');
  const completedMatches = matches.filter((match: Match) => match.status === 'completed');
  
  // Check if a match is in favorites
  const isMatchFavorited = (matchId: number) => {
    return favorites.some((fav: any) => fav.matchId === matchId);
  };
  
  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold mb-2">{sportDisplayName}</h1>
          <p className="text-gray-400">Latest matches, news, and updates for {sportDisplayName.toLowerCase()} fans</p>
        </div>
        
        {/* Sport's Matches Section */}
        <div className="mb-12">
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="live" className="relative">
                Live
                {liveMatches.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {liveMatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="live">
              {isMatchesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-64 animate-pulse bg-gray-800/50 rounded-xl"></div>
                  ))}
                </div>
              ) : liveMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveMatches.map((match: Match) => (
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
                    <div className="text-5xl mb-4">{sportType === 'football' ? '⚽' : '🏏'}</div>
                    <h3 className="text-xl font-medium mb-2">No Live Matches</h3>
                    <p className="text-gray-400 text-center">
                      There are no live {sportDisplayName.toLowerCase()} matches at the moment. Check back later!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="upcoming">
              {isMatchesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-64 animate-pulse bg-gray-800/50 rounded-xl"></div>
                  ))}
                </div>
              ) : upcomingMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingMatches.map((match: Match) => (
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
                    <div className="text-5xl mb-4">{sportType === 'football' ? '⚽' : '🏏'}</div>
                    <h3 className="text-xl font-medium mb-2">No Upcoming Matches</h3>
                    <p className="text-gray-400 text-center">
                      There are no upcoming {sportDisplayName.toLowerCase()} matches scheduled at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {isMatchesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-64 animate-pulse bg-gray-800/50 rounded-xl"></div>
                  ))}
                </div>
              ) : completedMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedMatches.map((match: Match) => (
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
                    <div className="text-5xl mb-4">{sportType === 'football' ? '⚽' : '🏏'}</div>
                    <h3 className="text-xl font-medium mb-2">No Completed Matches</h3>
                    <p className="text-gray-400 text-center">
                      There are no completed {sportDisplayName.toLowerCase()} matches to display.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sports News Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-heading font-bold mb-6">{sportDisplayName} News</h2>
          
          {isNewsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-40 animate-pulse bg-gray-800/50 rounded-xl"></div>
              ))}
            </div>
          ) : newsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsData.slice(0, 4).map((article, index) => (
                <Card key={index} className="overflow-hidden border-gray-700 bg-black/60 backdrop-blur-md hover:shadow-md hover:shadow-red-900/10 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{article.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{article.source?.name || 'Sports News'}</span>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-red-600 hover:underline"
                      >
                        Read More
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gray-700 bg-black/60 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-medium mb-2">No News Available</h3>
                <p className="text-gray-400 text-center">
                  Unable to load {sportDisplayName.toLowerCase()} news at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
