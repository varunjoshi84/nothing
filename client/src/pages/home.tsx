import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import MatchCard from "@/components/ui/match-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { getSportsNews } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Match } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [activeSport, setActiveSport] = useState<"football" | "cricket" | undefined>(undefined);
  
  // State for news carousel
  const [newsData, setNewsData] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [activeSport, setActiveSport] = useState<'football' | 'cricket'>('football');
  
  // Fetch live matches
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['/api/matches', { status: 'live' }]
  });
  
  // Fetch sports news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsNewsLoading(true);
        const data = await getSportsNews(activeSport);
        setNewsData(data.articles || []);
        setActiveNewsIndex(0); // Reset to first article when sport changes
      } catch (error) {
        console.error("Error fetching sports news:", error);
        setNewsData([]);
      } finally {
        setIsNewsLoading(false);
      }
    };
    
    fetchNews();
  }, [activeSport]);
  
  // Navigate through news carousel
  const goToNextNews = () => {
    if (newsData.length === 0) return;
    setActiveNewsIndex((prevIndex) => (prevIndex + 1) % newsData.length);
  };
  
  const goToPrevNews = () => {
    if (newsData.length === 0) return;
    setActiveNewsIndex((prevIndex) => (prevIndex - 1 + newsData.length) % newsData.length);
  };
  
  // Get a count of live matches for conditional rendering
  const liveMatchesCount = (matchesData?.matches || []).length;
  
  return (
    <>
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-600 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Content */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
              Your Live <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Sports Hub</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Real-time scores, match updates, and personalized notifications for all your favorite sports in one place.
            </p>
          </div>
          
          {/* Sports News Carousel */}
          <div className="max-w-4xl mx-auto bg-black/70 backdrop-blur-xl p-8 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(230,0,0,0.3)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-heading font-bold">Latest Sports News</h2>
              <div className="flex gap-2">
                <Button 
                  variant={activeSport === 'football' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveSport('football')}
                >
                  Football
                </Button>
                <Button 
                  variant={activeSport === 'cricket' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveSport('cricket')}
                >
                  Cricket
                </Button>
              </div>
            </div>
            
            {isNewsLoading ? (
              <div className="h-48 bg-gray-800/50 animate-pulse rounded-lg"></div>
            ) : newsData.length > 0 ? (
              <div className="relative">
                <Card className="bg-black/60 border-gray-800">
                  <CardContent className="p-6">
                    <div className="mb-3 text-sm text-gray-400">
                      {activeSport === 'football' ? 'Football News' : 'Cricket News'}
                    </div>
                    <h3 className="text-xl font-bold mb-3">
                      {activeSport === 'football' 
                        ? 'Latest Football Updates and Transfers' 
                        : 'Cricket Match Preview and Tournament News'}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {activeSport === 'football'
                        ? 'Stay updated with the latest football transfers, match highlights, and analysis from top leagues around the world.' 
                        : 'Follow the latest cricket tournament updates, player performances, and upcoming matches from international cricket.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString()}
                      </div>
                      <Link
                        href={`/sport/${activeSport}`}
                        className="flex items-center text-red-600 hover:underline"
                      >
                        View All News <ExternalLink className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Carousel Controls */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-black/80 border-gray-700"
                    onClick={goToPrevNews}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-black/80 border-gray-700"
                    onClick={goToNextNews}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Carousel Pagination */}
                <div className="flex justify-center gap-2 mt-4">
                  {newsData.map((_, index) => (
                    <div 
                      key={index}
                      className={`h-2 rounded-full cursor-pointer ${
                        index === activeNewsIndex 
                          ? 'w-6 bg-red-600' 
                          : 'w-2 bg-gray-600 hover:bg-gray-500'
                      }`}
                      onClick={() => setActiveNewsIndex(index)}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">No sports news available at the moment</p>
                <p className="text-sm text-gray-500 mt-2">Please check back later</p>
              </div>
            )}
          </div>
          
          {/* View Live Scores Button */}
          <div className="mt-10 text-center">
            <Link href="/live-scores">
              <Button variant="outline" className="mt-3 border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                View Live Scores
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Live Scoreboard Preview */}
      <section id="scoreboard" className="py-20 px-4 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">Live Scoreboard</h2>
              <p className="text-gray-400">Real-time scores from matches around the world</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button 
                variant={!activeSport ? "default" : "secondary"} 
                className={!activeSport ? "" : "bg-gray-800 hover:bg-gray-700"}
                onClick={() => setActiveSport(undefined)}
              >
                All
              </Button>
              <Button 
                variant={activeSport === "football" ? "default" : "secondary"}
                className={activeSport === "football" ? "" : "bg-gray-800 hover:bg-gray-700"}
                onClick={() => setActiveSport("football")}
              >
                Football
              </Button>
              <Button 
                variant={activeSport === "cricket" ? "default" : "secondary"}
                className={activeSport === "cricket" ? "" : "bg-gray-800 hover:bg-gray-700"}
                onClick={() => setActiveSport("cricket")}
              >
                Cricket
              </Button>
            </div>
          </div>
          
          {/* Live Matches Container */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-60 bg-gray-800/50 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : liveMatchesCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(matchesData?.matches || [])
                .filter((match: Match) => !activeSport || match.sportType === activeSport)
                .slice(0, 3)
                .map((match: Match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-800/20 rounded-xl border border-gray-800">
              <p className="text-gray-400">No live matches at the moment</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for live updates</p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link href="/live-scores">
              <Button variant="secondary" className="bg-gray-800 hover:bg-gray-700">
                View All Matches
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
