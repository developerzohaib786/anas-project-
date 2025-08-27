-- Add new fields to profiles table for enhanced onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_tone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_brand_notes text;

-- Update brand_guidelines table to match the simplified structure
ALTER TABLE public.brand_guidelines DROP COLUMN IF EXISTS key_messages;
ALTER TABLE public.brand_guidelines DROP COLUMN IF EXISTS core_values;