-- Create product_inspections table for caching analysis results
CREATE TABLE IF NOT EXISTS public.product_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Product metadata
  title TEXT,
  image TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT,
  rating DECIMAL(3, 2),
  
  -- AI analysis results
  ai_score INTEGER NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
  sentiment_score DECIMAL(3, 2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  short_review TEXT NOT NULL,
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  
  -- Cache management
  cached_until TIMESTAMP WITH TIME ZONE NOT NULL,
  analyser_version TEXT NOT NULL DEFAULT 'v1',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on URL for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_inspections_url ON public.product_inspections(url);

-- Create index on cached_until for cache cleanup
CREATE INDEX IF NOT EXISTS idx_product_inspections_cached_until ON public.product_inspections(cached_until);

-- Enable Row Level Security
ALTER TABLE public.product_inspections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached product inspections (public data)
CREATE POLICY "Anyone can view product inspections"
  ON public.product_inspections
  FOR SELECT
  USING (true);

-- Only the system can insert/update product inspections (via edge functions)
CREATE POLICY "Only service role can insert product inspections"
  ON public.product_inspections
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update product inspections"
  ON public.product_inspections
  FOR UPDATE
  USING (false);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_product_inspections_updated_at
  BEFORE UPDATE ON public.product_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_inspections_updated_at();