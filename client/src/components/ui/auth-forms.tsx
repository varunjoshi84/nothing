import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { loginSchema, registerSchema } from "@shared/schema";

interface AuthFormsProps {
  initialTab?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthForms({ initialTab = 'login', onSuccess }: AuthFormsProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoggingIn(true);
      await login(values);
      if (onSuccess) onSuccess();
      setLocation('/dashboard');

      if (response.ok) { // Check for successful login response
        toast({
          title: "Login successful",
          description: "Welcome back to SportSync!",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation("/dashboard");
        }
      } else {
        const responseData = await response.json();
        toast({
          title: "Login Failed",
          description: responseData.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const [isRegistering, setIsRegistering] = useState(false);

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setIsRegistering(true);
      await register(values);
      toast({
        title: "Registration successful",
        description: "Welcome to SportSync!",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto p-6 bg-black/70 backdrop-blur-xl rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(230,0,0,0.3)]">
      {/* Login Form */}
      <div className={`space-y-6 p-2 ${tab === 'signup' ? 'hidden md:block' : ''}`}>
        <h2 className="text-2xl font-heading font-bold mb-6">Login</h2>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="remember-me"
                      />
                    </FormControl>
                    <label
                      htmlFor="remember-me"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Remember me
                    </label>
                  </FormItem>
                )}
              />
              <Button variant="link" className="p-0 h-auto text-red-600">
                Forgot password?
              </Button>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Form>
        <div className="text-center md:hidden">
          <p className="text-sm text-gray-400">Don't have an account?</p>
          <Button 
            variant="link" 
            className="text-red-600 p-0" 
            onClick={() => setTab('signup')}
          >
            Sign up here
          </Button>
        </div>
      </div>

      {/* Signup Form */}
      <div className={`space-y-6 p-2 ${tab === 'login' ? 'hidden md:block' : ''}`}>
        <h2 className="text-2xl font-heading font-bold mb-6">Sign Up</h2>
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <FormField
              control={registerForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sportsfan123"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-left text-sm text-gray-400">
              By signing up, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto text-red-600">
                Terms
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto text-red-600">
                Privacy Policy
              </Button>
              .
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isRegistering}
            >
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        <div className="text-center md:hidden">
          <p className="text-sm text-gray-400">Already have an account?</p>
          <Button 
            variant="link" 
            className="text-red-600 p-0" 
            onClick={() => setTab('login')}
          >
            Log in here
          </Button>
        </div>
      </div>
    </div>
  );
}