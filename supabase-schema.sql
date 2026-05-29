-- SQL Schema to initialize the 'matches' table for DHL Games Day 2026 Scoring & Leaderboard Suite
-- Copy and paste this script directly into your Supabase SQL Editor (https://supabase.com)

-- 1. Create the matches table (utilizing robust VARCHAR with CHECK constraints to avoid ENUM conflicts)
CREATE TABLE IF NOT EXISTS public.matches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sport_name VARCHAR(100) NOT NULL CHECK (sport_name IN ('Soccer', 'Volleyball', 'Pingpong', 'Badminton', 'Swimming')),
    match_label VARCHAR(255) DEFAULT 'Regular Match' NOT NULL,
    team_a VARCHAR(255) NOT NULL,
    team_b VARCHAR(255) NOT NULL,
    score_a INTEGER DEFAULT 0 NOT NULL,
    score_b INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'Upcoming' NOT NULL CHECK (status IN ('Upcoming', 'Live', 'Finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Set up performance indexes
CREATE INDEX IF NOT EXISTS idx_matches_sport_name ON public.matches(sport_name);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);

-- 3. Set up an automated function to update the 'updated_at' timestamp on write operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it already exists to allow safe rerun
DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 5. Drop policies if they already exist to allow safe rerunning on the same DB
DROP POLICY IF EXISTS "Allow public read access to matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public insert access to matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public update access to matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public delete access to matches" ON public.matches;

-- 6. Create custom security access policies (Allowing anonymous reads/writes for easy sports day workflow)
CREATE POLICY "Allow public read access to matches" 
    ON public.matches FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert access to matches" 
    ON public.matches FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update access to matches" 
    ON public.matches FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete access to matches" 
    ON public.matches FOR DELETE 
    USING (true);

-- 7. Seed sample DHL Sports Day matches (Only if the table is empty to avoid duplicate insertions on rerun)
INSERT INTO public.matches (sport_name, match_label, team_a, team_b, score_a, score_b, status, created_at, updated_at)
SELECT 'Soccer', 'វគ្គជម្រុះតាមពូល (Group Stage)', 'DHL Express Warriors', 'DHL Supply Chain United', 2, 1, 'Live', NOW() - INTERVAL '1 hour', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.matches LIMIT 1);

INSERT INTO public.matches (sport_name, match_label, team_a, team_b, score_a, score_b, status, created_at, updated_at)
SELECT 'Volleyball', 'វគ្គមុនផ្តាច់ព្រ័ត្រ (Semifinal)', 'DHL Global Forwarding Titans', 'DHL eCommerce Flyers', 15, 15, 'Live', NOW() - INTERVAL '30 minutes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.matches WHERE sport_name = 'Volleyball');

INSERT INTO public.matches (sport_name, match_label, team_a, team_b, score_a, score_b, status, created_at, updated_at)
SELECT 'Pingpong', 'វគ្គផ្តាច់ព្រ័ត្រ (Grand Final)', 'DHL IT Solutions CyberKnights', 'DHL Aviation Chargers', 11, 9, 'Finished', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM public.matches WHERE sport_name = 'Pingpong');

INSERT INTO public.matches (sport_name, match_label, team_a, team_b, score_a, score_b, status, created_at, updated_at)
SELECT 'Badminton', 'វគ្គជម្រុះជុំទី១ (Round 1)', 'DHL Express Warriors', 'DHL Global Forwarding Titans', 0, 0, 'Upcoming', NOW() + INTERVAL '30 minutes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.matches WHERE sport_name = 'Badminton');

INSERT INTO public.matches (sport_name, match_label, team_a, team_b, score_a, score_b, status, created_at, updated_at)
SELECT 'Swimming', 'វគ្គជម្រុះល្បឿន (Heats)', 'DHL Supply Chain United', 'DHL Aviation Chargers', 0, 0, 'Upcoming', NOW() + INTERVAL '1 hour', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.matches WHERE sport_name = 'Swimming');

-- ==========================================
-- 8. Create the participants & team members table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.participants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(100) NOT NULL CHECK (sport_type IN ('Soccer', 'Volleyball', 'Pingpong', 'Badminton', 'Swimming')),
    is_team BOOLEAN DEFAULT FALSE NOT NULL,
    team_id BIGINT REFERENCES public.participants(id) ON DELETE SET NULL,
    photo_url VARCHAR(1024) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_sport_type ON public.participants(sport_type);
CREATE INDEX IF NOT EXISTS idx_participants_is_team ON public.participants(is_team);
CREATE INDEX IF NOT EXISTS idx_participants_team_id ON public.participants(team_id);

-- Register Trigger for participants updated_at
DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS) on participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if exist
DROP POLICY IF EXISTS "Allow public read access to participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public insert access to participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public update access to participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public delete access to participants" ON public.participants;

-- Create public access policies
CREATE POLICY "Allow public read access to participants" 
    ON public.participants FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert access to participants" 
    ON public.participants FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update access to participants" 
    ON public.participants FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete access to participants" 
    ON public.participants FOR DELETE 
    USING (true);

-- Seed Initial Teams (Only if participants table has no teams)
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'DHL Express Warriors', 'Soccer', true
WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE is_team = true AND sport_type = 'Soccer');

INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'DHL Supply Chain United', 'Soccer', true
WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL Supply Chain United');

INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'DHL Global Forwarding Titans', 'Volleyball', true
WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL Global Forwarding Titans');

INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'DHL eCommerce Flyers', 'Volleyball', true
WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL eCommerce Flyers');

-- Seed Players (is_team = false, team_id initially null or referenced. Let's seed as unassigned first, or assign them if table is empty)
-- Since we need IDs of created teams to assign them, we can seed them as unassigned first, or run query to auto-associate.
-- Let's seed unassigned and assigned players:
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Vichet Ly', 'Soccer', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Vichet Ly');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Somnang Mean', 'Soccer', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Somnang Mean');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Sopheap Oum', 'Soccer', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Sopheap Oum');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Phanith Sok', 'Soccer', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Phanith Sok');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Kosal Chea', 'Soccer', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Kosal Chea');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Khemara Seng', 'Volleyball', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Khemara Seng');
INSERT INTO public.participants (name, sport_type, is_team)
SELECT 'Vandeth Meas', 'Volleyball', false WHERE NOT EXISTS (SELECT 1 FROM public.participants WHERE name = 'Vandeth Meas');

-- Assign some players to the teams
UPDATE public.participants 
SET team_id = (SELECT id FROM public.participants WHERE name = 'DHL Express Warriors' LIMIT 1)
WHERE name IN ('Vichet Ly', 'Somnang Mean') 
  AND EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL Express Warriors');

UPDATE public.participants 
SET team_id = (SELECT id FROM public.participants WHERE name = 'DHL Supply Chain United' LIMIT 1)
WHERE name IN ('Sopheap Oum', 'Kosal Chea')
  AND EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL Supply Chain United');

UPDATE public.participants 
SET team_id = (SELECT id FROM public.participants WHERE name = 'DHL Global Forwarding Titans' LIMIT 1)
WHERE name IN ('Khemara Seng')
  AND EXISTS (SELECT 1 FROM public.participants WHERE name = 'DHL Global Forwarding Titans');

