import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import AuthForms from "@/components/ui/auth-forms";
import MatchCard from "@/components/ui/match-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [location, params] = useLocation();
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  // Check for auth parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthTab(authParam);
    }
  }, [location]);
  
  // Fetch live matches
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['/api/matches', { status: 'live' }],
    queryFn: undefined
  });
  const liveMatches = matchesData?.matches || [];
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const authParam = searchParams.get('auth');
    
    if (user && (authParam === 'login' || authParam === 'signup')) {
      window.history.replaceState(null, '', '/');
    }
  }, [user, location]);
  
  const [, setLocation] = useLocation();
  
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
          
          {/* Auth or Welcome Container */}
          {!user ? (
            <AuthForms initialTab={authTab} />
          ) : (
            <div className="max-w-3xl mx-auto bg-black/70 backdrop-blur-xl p-8 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(230,0,0,0.3)] text-center">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Welcome back, {user.username}!
              </h2>
              <p className="text-gray-300 mb-6">
                Stay updated with the latest sports action and manage your favorite matches from your dashboard.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setLocation("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setLocation("/live-scores")}>
                  View Live Scores
                </Button>
              </div>
            </div>
          )}
          
          {/* Guest View Live Scores Button */}
          {!user && (
            <div className="mt-10 text-center">
              <p className="text-gray-300 text-lg">Or continue as guest to</p>
              <Link href="/live-scores">
                <Button variant="outline" className="mt-3 border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                  View Live Scores
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
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
              <Button variant="secondary" className="bg-gray-800 hover:bg-gray-700">All</Button>
              <Button>Football</Button>
              <Button variant="secondary" className="bg-gray-800 hover:bg-gray-700">Cricket</Button>
            </div>
          </div>
          
          {/* Live Matches Container */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-60 bg-gray-800/50 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.slice(0, 3).map((match) => (
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
