-- LAST HAND OS Database Schema
-- Session-based Web3 card battle game data models

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types for game states
CREATE TYPE match_status AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE session_status AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');
CREATE TYPE card_type AS ENUM ('ATTACK', 'DEFENSE', 'TRICK', 'SPECIAL');

-- Users table (linked to auth.users)
-- In production: would store Sui address from zkLogin
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ens_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  spend_limit DECIMAL(10,2) DEFAULT 500,
  preferences JSONB DEFAULT '{"autoFold": true, "soundEnabled": true, "notifications": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session wallets table
-- In production: would be Sui PTB session objects with Yellow Network state channels
CREATE TABLE public.session_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked_amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['PLAY_CARDS', 'AUTO_FOLD', 'RECEIVE_REWARDS'],
  status session_status DEFAULT 'ACTIVE',
  match_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  closed_at TIMESTAMPTZ
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_fee DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(10,2) NOT NULL,
  min_players INTEGER DEFAULT 4,
  max_players INTEGER DEFAULT 8,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 5,
  status match_status DEFAULT 'WAITING',
  round_time_limit INTEGER DEFAULT 15,
  winner_id UUID REFERENCES public.profiles(id),
  state_hash TEXT,
  settlement_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Match participants (join table)
CREATE TABLE public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.session_wallets(id),
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  is_connected BOOLEAN DEFAULT true,
  is_eliminated BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Cards table (card definitions)
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type card_type NOT NULL,
  name TEXT NOT NULL,
  power INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player cards in match
CREATE TABLE public.player_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_player_id UUID NOT NULL REFERENCES public.match_players(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id),
  is_used BOOLEAN DEFAULT false,
  used_in_round INTEGER
);

-- Round actions (off-chain simulation history)
CREATE TABLE public.round_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  card_id UUID NOT NULL REFERENCES public.cards(id),
  target_id UUID REFERENCES public.profiles(id),
  health_change INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Match results (for history)
CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID UNIQUE NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES public.profiles(id),
  winner_payout DECIMAL(10,2) NOT NULL,
  final_state_hash TEXT,
  settlement_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Session wallets: users can only see their own
CREATE POLICY "Users can view own sessions" ON public.session_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.session_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.session_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Matches: viewable by all, creatable by authenticated users
CREATE POLICY "Matches are viewable by everyone" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Match participants can update match" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_id = matches.id AND player_id = auth.uid()
    )
  );

-- Match players: viewable by all
CREATE POLICY "Match players viewable by all" ON public.match_players
  FOR SELECT USING (true);

CREATE POLICY "Users can join matches" ON public.match_players
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update own participation" ON public.match_players
  FOR UPDATE USING (auth.uid() = player_id);

-- Cards: viewable by all (game data)
CREATE POLICY "Cards are public" ON public.cards
  FOR SELECT USING (true);

-- Player cards: viewable by owner only during game
CREATE POLICY "Players see own cards" ON public.player_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE id = player_cards.match_player_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Cards assigned to players" ON public.player_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE id = player_cards.match_player_id AND player_id = auth.uid()
    )
  );

-- Round actions: viewable by match participants
CREATE POLICY "Match participants see actions" ON public.round_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_id = round_actions.match_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Players can record actions" ON public.round_actions
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Match results: viewable by all
CREATE POLICY "Results are public" ON public.match_results
  FOR SELECT USING (true);

-- Insert default card deck
INSERT INTO public.cards (type, name, power, description) VALUES
  ('ATTACK', 'STRIKE', 20, 'Direct damage to opponent'),
  ('ATTACK', 'SLASH', 25, 'Heavy attack, risky'),
  ('ATTACK', 'PIERCE', 15, 'Bypasses some defense'),
  ('DEFENSE', 'BLOCK', 20, 'Reduce incoming damage'),
  ('DEFENSE', 'SHIELD', 30, 'Strong defense'),
  ('DEFENSE', 'PARRY', 15, 'Counter if attacked'),
  ('TRICK', 'FEINT', 10, 'Reveal opponent card'),
  ('TRICK', 'STEAL', 0, 'Take opponent health'),
  ('TRICK', 'MIRROR', 0, 'Copy opponent move'),
  ('SPECIAL', 'HEAL', 25, 'Restore health'),
  ('SPECIAL', 'DOUBLE', 0, 'Double next attack'),
  ('SPECIAL', 'VOID', 0, 'Cancel all actions');

-- Create trigger for profile timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, ens_name, display_name)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '.eth',
    UPPER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();