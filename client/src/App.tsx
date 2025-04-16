import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import LiveScores from "@/pages/live-scores";
import SportsCategory from "@/pages/sports-category";
import Feedback from "@/pages/feedback";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "./lib/auth";

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Don't render routes until auth check is complete
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-accent rounded-full border-b-transparent animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={Admin} />
          <Route path="/live-scores" component={LiveScores} />
          <Route path="/sport/:type">
            {params => <SportsCategory type={params.type} />}
          </Route>
          <Route path="/feedback" component={Feedback} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
