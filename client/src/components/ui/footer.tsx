import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bolt, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Subscribed!",
      description: "You've been subscribed to our newsletter."
    });
    setEmail("");
  };
  
  return (
    <footer className="bg-black/90 backdrop-blur-md border-t border-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-1 mb-6">
              <span className="text-red-600 text-2xl">
                <Bolt />
              </span>
              <h2 className="text-xl font-heading font-bold">
                Sport<span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Sync</span>
              </h2>
            </div>
            <p className="text-gray-400 mb-6">
              Your ultimate platform for real-time sports updates, scores, and personalized notifications.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <Youtube size={18} />
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/live-scores" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Live Scores
                </Link>
              </li>
              <li>
                <Link href="/sport/football" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Football
                </Link>
              </li>
              <li>
                <Link href="/sport/cricket" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Cricket
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold mb-4">Subscribe</h3>
            <p className="text-gray-400 mb-4">
              Get the latest updates and news directly to your inbox.
            </p>
            <form className="space-y-3" onSubmit={handleSubscribe}>
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-gray-800 border-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} SportSync. All rights reserved.
          </div>
          <div className="flex space-x-4 text-sm text-gray-400">
            <Link href="#" className="hover:text-red-600 transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-red-600 transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-red-600 transition-colors duration-200">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
