import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";
import Landing from "./pages/Landing";
import Lobby from "./pages/Lobby";
import Profile from "./pages/Profile";
import Settlement from "./pages/Settlement";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import React from "react";
import Arena from "./pages/Arena";
import MockGame from './pages/Game'; // Import the MockGame component
import GameOver from './pages/GameOver'; // Import the GameOver component
import Game from "./pages/Game";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GameProvider>
      
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            
            <Routes>
              <Route path="/game" element={<Game/>} /> {/* Add route for MockGame */}
              <Route path="/game-over" element={<GameOver />} /> {/* Add route for GameOver */}
              <Route path="/" element={<Landing />} />
              <Route path="/arena" element={<Arena />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settlement" element={<Settlement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
     
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
