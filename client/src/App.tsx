import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import ItemDetailPage from "@/pages/item-detail-page";
import SettingsPage from "@/pages/settings-page";
import ItemsPage from "@/pages/items-page";
import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  // Set the document title based on the app name
  useEffect(() => {
    document.title = "Intelligent LifeOS";
  }, []);

  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/items/:id" component={ItemDetailPage} />
      <ProtectedRoute path="/tasks" component={() => <ItemsPage itemType="TASK" />} />
      <ProtectedRoute path="/projects" component={() => <ItemsPage itemType="PROJECT" />} />
      <ProtectedRoute path="/goals" component={() => <ItemsPage itemType="GOAL" />} />
      <ProtectedRoute path="/ideas" component={() => <ItemsPage itemType="IDEA" />} />
      <ProtectedRoute path="/notes" component={() => <ItemsPage itemType="NOTE" />} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth">{user ? <HomePage /> : <AuthPage />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
