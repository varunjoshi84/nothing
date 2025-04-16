import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import AuthForms from "@/components/ui/auth-forms";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // If still loading, don't render anything yet
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent rounded-full border-b-transparent animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8">
        {/* Hero Section */}
        <div className="lg:w-1/2 lg:pr-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Welcome to <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">SportSync</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Your ultimate destination for real-time sports updates, personalized notifications, and comprehensive match statistics.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-red-600/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Live Match Updates</h3>
                  <p className="text-gray-400">Get real-time scores and statistics for all your favorite sports.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-red-600/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Personalized Notifications</h3>
                  <p className="text-gray-400">Never miss a moment with custom alerts for your favorite teams.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-red-600/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Comprehensive Statistics</h3>
                  <p className="text-gray-400">Dive deep into player and team statistics, analytics, and historical data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth Forms Section */}
        <div className="lg:w-1/2">
          <AuthForms initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
}