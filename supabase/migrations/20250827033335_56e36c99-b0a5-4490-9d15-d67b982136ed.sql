-- Add brand_name column to existing profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'brand_name') THEN
        ALTER TABLE public.profiles ADD COLUMN brand_name TEXT;
    END IF;
END $$;

-- Add onboarding columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_step INTEGER DEFAULT 0;
    END IF;
END $$;