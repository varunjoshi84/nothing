import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Match, InsertMatch, matchStatusEnum, sportTypeEnum, Feedback } from "@shared/schema";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, PenTool } from "lucide-react";

// Match form schema with validation
const matchFormSchema = z.object({
  sportType: z.enum(['football', 'cricket']),
  team1: z.string().min(1, "Team 1 name is required"),
  team2: z.string().min(1, "Team 2 name is required"),
  team1Logo: z.string().optional(),
  team2Logo: z.string().optional(),
  venue: z.string().optional(),
  matchTime: z.string().min(1, "Match time is required"),
  status: z.enum(['upcoming', 'live', 'completed']),
  currentTime: z.string().optional(),
  score1: z.string().optional(),
  score2: z.string().optional(),
});

// Score update schema
const scoreUpdateSchema = z.object({
  score1: z.string(),
  score2: z.string(),
  currentTime: z.string().optional(),
  status: z.enum(['upcoming', 'live', 'completed']),
});

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matches");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoreUpdateMode, setIsScoreUpdateMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin panel",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // Fetch all matches
  const { data: matchesData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/matches'],
    queryFn: undefined,
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all feedback submissions
  const { data: feedbackData, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['/api/admin/feedback'],
    queryFn: undefined,
    enabled: !!user && user.role === 'admin' && activeTab === 'feedback',
  });

  const matches = matchesData?.matches || [];
  const feedback = feedbackData?.feedback || [];

  // Match form
  const matchForm = useForm<z.infer<typeof matchFormSchema>>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      sportType: 'football',
      team1: '',
      team2: '',
      team1Logo: '',
      team2Logo: '',
      venue: '',
      matchTime: new Date().toISOString().slice(0, 16),
      status: 'upcoming',
      currentTime: '',
      score1: '-',
      score2: '-',
    },
  });

  // Score update form
  const scoreForm = useForm<z.infer<typeof scoreUpdateSchema>>({
    resolver: zodResolver(scoreUpdateSchema),
    defaultValues: {
      score1: '-',
      score2: '-',
      currentTime: '',
      status: 'live',
    },
  });

  // Set up edit mode
  useEffect(() => {
    if (selectedMatch && isEditMode) {
      const matchTime = new Date(selectedMatch.matchTime);
      matchForm.reset({
        sportType: selectedMatch.sportType,
        team1: selectedMatch.team1,
        team2: selectedMatch.team2,
        team1Logo: selectedMatch.team1Logo || '',
        team2Logo: selectedMatch.team2Logo || '',
        venue: selectedMatch.venue || '',
        matchTime: matchTime.toISOString().slice(0, 16),
        status: selectedMatch.status,
        currentTime: selectedMatch.currentTime || '',
        score1: selectedMatch.score1,
        score2: selectedMatch.score2,
      });
    } else if (!isEditMode) {
      matchForm.reset({
        sportType: 'football',
        team1: '',
        team2: '',
        team1Logo: '',
        team2Logo: '',
        venue: '',
        matchTime: new Date().toISOString().slice(0, 16),
        status: 'upcoming',
        currentTime: '',
        score1: '-',
        score2: '-',
      });
    }
  }, [selectedMatch, isEditMode, matchForm]);

  // Set up score update mode
  useEffect(() => {
    if (selectedMatch && isScoreUpdateMode) {
      scoreForm.reset({
        score1: selectedMatch.score1,
        score2: selectedMatch.score2,
        currentTime: selectedMatch.currentTime || '',
        status: selectedMatch.status,
      });
    }
  }, [selectedMatch, isScoreUpdateMode, scoreForm]);

  // Match create/update mutation
  const matchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof matchFormSchema>) => {
      // Convert form data to match the API expectations
      const matchData = {
        ...data,
        matchTime: new Date(data.matchTime).toISOString(),
      };

      if (isEditMode && selectedMatch) {
        return apiRequest('PUT', `/api/admin/matches/${selectedMatch.id}`, matchData);
      } else {
        return apiRequest('POST', '/api/admin/matches', matchData);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Match Updated" : "Match Created",
        description: isEditMode ? "Match has been updated successfully" : "New match has been created",
      });
      setIsEditMode(false);
      setSelectedMatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Match delete mutation
  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: number) => {
      return apiRequest('DELETE', `/api/admin/matches/${matchId}`);
    },
    onSuccess: () => {
      toast({
        title: "Match Deleted",
        description: "Match has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Score update mutation
  const scoreUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scoreUpdateSchema>) => {
      if (!selectedMatch) throw new Error("No match selected");
      return apiRequest('PUT', `/api/admin/matches/${selectedMatch.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "Match score has been updated successfully",
      });
      setIsScoreUpdateMode(false);
      setSelectedMatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle match form submission
  const onMatchSubmit = (data: z.infer<typeof matchFormSchema>) => {
    matchMutation.mutate(data);
  };

  // Handle score update form submission
  const onScoreSubmit = (data: z.infer<typeof scoreUpdateSchema>) => {
    scoreUpdateMutation.mutate(data);
  };

  // Filter matches
  const filteredMatches = matches.filter((match: Match) => {
    let passes = true;
    
    // Sport filter
    if (sportFilter && match.sportType !== sportFilter) {
      passes = false;
    }
    
    // Status filter
    if (statusFilter && match.status !== statusFilter) {
      passes = false;
    }
    
    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        match.team1.toLowerCase().includes(term) ||
        match.team2.toLowerCase().includes(term) ||
        (match.venue && match.venue.toLowerCase().includes(term));
      
      if (!matchesSearch) {
        passes = false;
      }
    }
    
    return passes;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // If user is not admin, don't render
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="bg-black/60 backdrop-blur-md border-gray-800">
          <CardHeader className="bg-gray-800">
            <CardTitle className="text-3xl font-heading font-bold">Admin Dashboard</CardTitle>
            <p className="text-gray-400">Manage matches, scores, and user feedback</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="matches" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="matches">Manage Matches</TabsTrigger>
                <TabsTrigger value="feedback">User Feedback</TabsTrigger>
              </TabsList>
              
              {/* Matches Tab */}
              <TabsContent value="matches">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-heading font-semibold">Match Management</h3>
                  
                  <Dialog onOpenChange={(open) => {
                    if (!open) {
                      setIsEditMode(false);
                      setSelectedMatch(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Match
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Match" : "Add New Match"}</DialogTitle>
                        <DialogDescription>
                          {isEditMode 
                            ? "Update the match details below."
                            : "Enter the details for the new match."}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...matchForm}>
                        <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="sportType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sport</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Sport" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="football">Football</SelectItem>
                                      <SelectItem value="cricket">Cricket</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="upcoming">Upcoming</SelectItem>
                                      <SelectItem value="live">Live</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="team1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 1</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter team name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="team2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 2</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter team name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="team1Logo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 1 Logo URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter logo URL (optional)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="team2Logo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 2 Logo URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter logo URL (optional)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="venue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Venue</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter venue (optional)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="matchTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Match Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="score1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 1 Score</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Score (e.g. 2)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="score2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team 2 Score</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Score (e.g. 1)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="currentTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Time</FormLabel>
                                  <FormControl>
                                    <Input placeholder="75' or 32.4 Overs" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <DialogFooter className="sm:justify-end">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button 
                              type="submit" 
                              disabled={matchMutation.isPending}
                            >
                              {matchMutation.isPending 
                                ? "Saving..." 
                                : isEditMode ? "Update Match" : "Add Match"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => setSportFilter(value === 'all' ? undefined : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Sports" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sports</SelectItem>
                        <SelectItem value="football">Football</SelectItem>
                        <SelectItem value="cricket">Cricket</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      className="pl-10 w-full" 
                      placeholder="Search matches..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Matches Table */}
                <div className="rounded-md border border-gray-800">
                  <Table>
                    <TableHeader className="bg-gray-800">
                      <TableRow>
                        <TableHead>Match</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingMatches ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex justify-center">
                              <div className="w-8 h-8 border-4 border-primary rounded-full border-b-transparent animate-spin"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredMatches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                            No matches found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMatches.map((match: Match) => (
                          <TableRow key={match.id} className="hover:bg-gray-800/20 transition-colors">
                            <TableCell>
                              <div>
                                <div className="font-medium">{match.team1} vs {match.team2}</div>
                                <div className="text-sm text-gray-400">{match.venue}</div>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{match.sportType}</TableCell>
                            <TableCell>{formatDate(match.matchTime)}</TableCell>
                            <TableCell>
                              {match.status === 'live' ? (
                                <Badge variant="destructive" className="capitalize">Live</Badge>
                              ) : match.status === 'upcoming' ? (
                                <Badge variant="secondary" className="capitalize">Upcoming</Badge>
                              ) : (
                                <Badge variant="outline" className="capitalize">Completed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {match.score1} - {match.score2}
                              {match.currentTime && (
                                <div className="text-xs text-gray-400">
                                  {match.currentTime}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog onOpenChange={(open) => {
                                  if (!open) {
                                    setIsEditMode(false);
                                    setSelectedMatch(null);
                                  } else {
                                    setIsEditMode(true);
                                    setSelectedMatch(match);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Edit Match">
                                      <Pencil className="h-4 w-4 text-yellow-500" />
                                    </Button>
                                  </DialogTrigger>
                                </Dialog>
                                
                                <Dialog onOpenChange={(open) => {
                                  if (!open) {
                                    setIsScoreUpdateMode(false);
                                    setSelectedMatch(null);
                                  } else {
                                    setIsScoreUpdateMode(true);
                                    setSelectedMatch(match);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Update Score">
                                      <PenTool className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Update Match Score</DialogTitle>
                                      <DialogDescription>
                                        Update the current score and match status for {match.team1} vs {match.team2}.
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <Form {...scoreForm}>
                                      <form onSubmit={scoreForm.handleSubmit(onScoreSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={scoreForm.control}
                                            name="score1"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>{match.team1} Score</FormLabel>
                                                <FormControl>
                                                  <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={scoreForm.control}
                                            name="score2"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>{match.team2} Score</FormLabel>
                                                <FormControl>
                                                  <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                        
                                        <FormField
                                          control={scoreForm.control}
                                          name="currentTime"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Current Time</FormLabel>
                                              <FormControl>
                                                <Input placeholder="e.g. 75' or 32.4 Overs" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={scoreForm.control}
                                          name="status"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Match Status</FormLabel>
                                              <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  <SelectItem value="upcoming">Upcoming</SelectItem>
                                                  <SelectItem value="live">Live</SelectItem>
                                                  <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <DialogFooter className="sm:justify-end">
                                          <DialogClose asChild>
                                            <Button type="button" variant="secondary">Cancel</Button>
                                          </DialogClose>
                                          <Button 
                                            type="submit" 
                                            disabled={scoreUpdateMutation.isPending}
                                          >
                                            {scoreUpdateMutation.isPending ? "Updating..." : "Update Score"}
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </Form>
                                  </DialogContent>
                                </Dialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Delete Match">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the match {match.team1} vs {match.team2}. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMatchMutation.mutate(match.id)}
                                        disabled={deleteMatchMutation.isPending}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteMatchMutation.isPending ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              {/* Feedback Tab */}
              <TabsContent value="feedback">
                <h3 className="text-xl font-heading font-semibold mb-6">User Feedback</h3>
                
                {isLoadingFeedback ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary rounded-full border-b-transparent animate-spin"></div>
                  </div>
                ) : feedback.length === 0 ? (
                  <Card className="bg-gray-800/20 border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <h3 className="text-xl font-medium mb-2">No Feedback Yet</h3>
                      <p className="text-gray-400">
                        Users haven't submitted any feedback yet. Check back later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {feedback.map((item: Feedback) => (
                      <Card key={item.id} className="bg-gray-800/20 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div>
                              <h4 className="font-medium text-lg mb-1">{item.name}</h4>
                              <div className="text-sm text-gray-400 mb-1">{item.email}</div>
                              <div className="text-sm mb-4">
                                <Badge variant="outline">{item.category}</Badge>
                                <span className="ml-3 text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 md:mt-0 text-sm">
                              {item.subscribeToNewsletter && (
                                <Badge variant="secondary">Newsletter Subscriber</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-gray-800/40 p-4 rounded-md">
                            <p className="whitespace-pre-line">{item.message}</p>
                          </div>
                          
                          {item.userId && (
                            <div className="mt-4 text-sm text-gray-400">
                              From registered user (ID: {item.userId})
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
