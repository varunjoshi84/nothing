import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MatchCard from "@/components/ui/match-card";
import { Bell, BellOff, UserCog, Heart, Trash2, CheckCircle, AlertCircle } from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  favoriteSport: z.string().optional(),
  favoriteTeam: z.string().optional(),
});

// Update password schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

export default function Dashboard() {
  const { user } = useAuth();
  const [location, params] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      window.location.href = "/?auth=login";
    }
  }, [user]);
  
  // Check for tab parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Fetch user's favorite matches
  const { data: favoritesData, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: undefined,
    enabled: !!user,
  });
  
  // Fetch user's notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: undefined,
    enabled: !!user,
  });
  
  const favorites = favoritesData?.favorites || [];
  const notifications = notificationsData?.notifications || [];
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      favoriteSport: user?.favoriteSport || "",
      favoriteTeam: user?.favoriteTeam || "",
    },
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      return apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      return apiRequest("PUT", "/api/users/profile", {
        password: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });
  
  // Account deletion mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/users/account");
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    },
  });
  
  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  
  // If user is not loaded yet
  if (!user) {
    return null;
  }
  
  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="bg-black/60 backdrop-blur-md border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-heading font-bold">Welcome, {user.username}!</CardTitle>
            <p className="text-gray-400">Here's what's happening in your sports world.</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="delete-account" className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Profile Summary */}
                  <Card className="bg-gray-800/20 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-900/60 flex items-center justify-center text-white text-2xl font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-lg">{user.username}</div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                          {user.role === 'admin' && (
                            <div className="text-red-400 text-sm font-medium mt-1">Administrator</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Favorite Team:</span>
                          <span>{user.favoriteTeam || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Favorite Sport:</span>
                          <span>{user.favoriteSport || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Type:</span>
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Update Profile Form */}
                  <div className="md:col-span-2 space-y-6">
                    <Card className="bg-gray-800/20 border-gray-700">
                      <CardHeader>
                        <CardTitle>Update Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...profileForm}>
                          <form 
                            onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} 
                            className="space-y-4"
                          >
                            <FormField
                              control={profileForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="favoriteSport"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Favorite Sport</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="favoriteTeam"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Favorite Team</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                              className="w-full md:w-auto"
                            >
                              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    {/* Change Password Form */}
                    <Card className="bg-gray-800/20 border-gray-700">
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...passwordForm}>
                          <form 
                            onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} 
                            className="space-y-4"
                          >
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={updatePasswordMutation.isPending}
                              className="w-full md:w-auto"
                            >
                              {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Favorites Tab */}
              <TabsContent value="favorites">
                <h3 className="text-xl font-heading font-semibold mb-4">Your Favorite Matches</h3>
                
                {isLoadingFavorites ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-60 bg-gray-800/50 animate-pulse rounded-xl"></div>
                    ))}
                  </div>
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite: any) => (
                      <MatchCard 
                        key={favorite.id} 
                        match={favorite.match} 
                        isFavorite={true}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-800/20 border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Heart className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Favorite Matches Yet</h3>
                      <p className="text-gray-400 mb-4">
                        Start adding matches to your favorites to keep track of them here.
                      </p>
                      <Button variant="outline" onClick={() => window.location.href = "/live-scores"}>
                        Browse Matches
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-heading font-semibold">Notifications</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-sm"
                    disabled={notifications.length === 0}
                  >
                    <BellOff className="h-4 w-4 mr-2" />
                    Mark All as Read
                  </Button>
                </div>
                
                {isLoadingNotifications ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-20 bg-gray-800/50 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <Card 
                        key={notification.id} 
                        className={`bg-gray-800/20 border-gray-700 transition-colors ${!notification.read ? 'bg-gray-800/40' : ''}`}
                      >
                        <CardContent className="py-4 px-5">
                          <div className="flex justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`mt-0.5 ${notification.read ? 'text-gray-500' : 'text-red-600'}`}>
                                <Bell className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{notification.message}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => markNotificationReadMutation.mutate(notification.id)}
                                disabled={markNotificationReadMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Mark as read</span>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-800/20 border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Notifications</h3>
                      <p className="text-gray-400">
                        You don't have any notifications at the moment.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Delete Account Tab */}
              <TabsContent value="delete-account">
                <Card className="bg-gray-800/20 border-gray-700">
                  <CardContent className="flex flex-col items-center py-10 text-center">
                    <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
                    <h3 className="text-2xl font-medium mb-2">Delete Your Account</h3>
                    <p className="text-gray-400 max-w-md mb-6">
                      This action cannot be undone. All your data, including favorite matches and notification settings, will be permanently removed.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleteAccountMutation.isPending}>
                          {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              deleteAccountMutation.mutate();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
