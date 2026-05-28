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
