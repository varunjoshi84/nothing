import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Bolt, 
  ChevronDown, 
  LogOut, 
  Menu, 
  User, 
  Heart, 
  Trash2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch notifications if user is logged in
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: undefined,
    enabled: !!user,
  });
  
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  
  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setLocation("/");
  };
  
  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.charAt(0).toUpperCase();
  };
  
  // Get active route for highlighting nav items
  const [location] = useLocation();
  
  return (
    <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md z-50 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-1">
            <Link href="/" className="flex items-center">
              <span className="text-red-600 text-3xl mr-1">
                <Bolt />
              </span>
              <h1 className="text-2xl font-heading font-bold">
                Sport<span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Sync</span>
              </h1>
            </Link>
          </div>
          
          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-medium hover:text-red-600 transition-colors duration-200 ${location === '/' ? 'border-b-2 border-red-600 text-red-600' : ''}`}>
              Home
            </Link>
            <Link href="/sport/football" className={`font-medium hover:text-red-600 transition-colors duration-200 ${location === '/sport/football' ? 'border-b-2 border-red-600 text-red-600' : ''}`}>
              Football
            </Link>
            <Link href="/sport/cricket" className={`font-medium hover:text-red-600 transition-colors duration-200 ${location === '/sport/cricket' ? 'border-b-2 border-red-600 text-red-600' : ''}`}>
              Cricket
            </Link>
            <Link href="/live-scores" className={`font-medium hover:text-red-600 transition-colors duration-200 ${location === '/live-scores' ? 'border-b-2 border-red-600 text-red-600' : ''}`}>
              Live Scores
            </Link>
          </nav>
          
          {/* User Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => setLocation("/?auth=login")}>
                  Login
                </Button>
                <Button onClick={() => setLocation("/?auth=signup")}>
                  Sign Up
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="py-2 px-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification: any) => (
                        <DropdownMenuItem key={notification.id} className={`p-3 cursor-default ${!notification.read ? 'bg-muted/50' : ''}`}>
                          <div className="flex flex-col gap-1">
                            <p>{notification.message}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleTimeString()} - {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start h-9">
                        View all notifications
                      </Button>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3">
                      <div className="w-9 h-9 rounded-full bg-red-900/60 flex items-center justify-center text-white">
                        <span>{getUserInitials()}</span>
                      </div>
                      <span className="font-medium">{user.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard?tab=favorites">
                      <DropdownMenuItem className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Favorite Matches</span>
                      </DropdownMenuItem>
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                    <Link href="/dashboard?tab=delete-account">
                      <DropdownMenuItem className="cursor-pointer text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Account</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-black/95 backdrop-blur-md text-white border-gray-800">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="space-y-4">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <div className={`py-2 font-medium text-lg ${location === '/' ? 'text-red-600' : ''}`}>Home</div>
                  </Link>
                  <Link href="/sport/football" onClick={() => setIsOpen(false)}>
                    <div className={`py-2 font-medium text-lg ${location === '/sport/football' ? 'text-red-600' : ''}`}>Football</div>
                  </Link>
                  <Link href="/sport/cricket" onClick={() => setIsOpen(false)}>
                    <div className={`py-2 font-medium text-lg ${location === '/sport/cricket' ? 'text-red-600' : ''}`}>Cricket</div>
                  </Link>
                  <Link href="/live-scores" onClick={() => setIsOpen(false)}>
                    <div className={`py-2 font-medium text-lg ${location === '/live-scores' ? 'text-red-600' : ''}`}>Live Scores</div>
                  </Link>
                </div>
                
                <div className="border-t border-gray-800 pt-4">
                  {!user ? (
                    <div className="flex flex-col space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => { setLocation("/?auth=login"); setIsOpen(false); }}>
                        Login
                      </Button>
                      <Button className="w-full" onClick={() => { setLocation("/?auth=signup"); setIsOpen(false); }}>
                        Sign Up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 pb-2">
                        <div className="w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center text-white">
                          <span>{getUserInitials()}</span>
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <div className="py-2 font-medium">Dashboard</div>
                      </Link>
                      
                      <Link href="/dashboard?tab=favorites" onClick={() => setIsOpen(false)}>
                        <div className="py-2 font-medium">Favorite Matches</div>
                      </Link>
                      
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <div className="py-2 font-medium">Admin Panel</div>
                        </Link>
                      )}
                      
                      <button 
                        className="py-2 font-medium text-red-600 w-full text-left"
                        onClick={() => { handleLogout(); setIsOpen(false); }}
                      >
                        Logout
                      </button>
                      
                      <Link href="/dashboard?tab=delete-account" onClick={() => setIsOpen(false)}>
                        <div className="py-2 font-medium text-red-600">Delete Account</div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
