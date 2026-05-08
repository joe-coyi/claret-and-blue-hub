
-- News table
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'general',
  author text,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News public read" ON public.news FOR SELECT USING (published = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage news" ON public.news FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER news_touch BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Polls: add type for lineup selection
ALTER TABLE public.polls ADD COLUMN poll_type text NOT NULL DEFAULT 'single';
ALTER TABLE public.polls ADD COLUMN max_selections integer NOT NULL DEFAULT 1;

-- Allow multiple selections for lineup polls: drop unique constraint if any (none defined). Allow user to vote per option.

-- Matches: lineups + featured live highlight
ALTER TABLE public.matches ADD COLUMN lineup_west_ham jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.matches ADD COLUMN lineup_opponent jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.matches ADD COLUMN current_minute integer;
ALTER TABLE public.matches ADD COLUMN summary text;
