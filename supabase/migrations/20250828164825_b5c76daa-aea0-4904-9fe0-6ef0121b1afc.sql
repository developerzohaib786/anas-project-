-- Create training jobs table to track training progress
CREATE TABLE public.training_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_assets integer NOT NULL DEFAULT 0,
  processed_assets integer NOT NULL DEFAULT 0,
  flagged_assets integer NOT NULL DEFAULT 0,
  categories text[] NOT NULL DEFAULT '{}',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create asset analysis table to store individual image analysis
CREATE TABLE public.asset_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_job_id uuid NOT NULL,
  brand_asset_id uuid NOT NULL,
  analysis_result jsonb,
  is_flagged boolean NOT NULL DEFAULT false,
  flagged_reasons text[],
  quality_score numeric(3,2),
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create brand training profiles table for versioned training results
CREATE TABLE public.brand_training_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id uuid NOT NULL,
  training_job_id uuid NOT NULL,
  user_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  style_summary text,
  prompt_modifiers text,
  negative_modifiers text,
  categories_analyzed text[],
  total_images_used integer NOT NULL DEFAULT 0,
  quality_metrics jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_training_profiles ENABLE ROW LEVEL SECURITY;

-- Training jobs policies
CREATE POLICY "Users can view their own training jobs" 
ON public.training_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training jobs" 
ON public.training_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training jobs" 
ON public.training_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Asset analysis policies
CREATE POLICY "Users can view their own asset analysis" 
ON public.asset_analysis 
FOR SELECT 
USING (training_job_id IN (SELECT id FROM training_jobs WHERE user_id = auth.uid()));

CREATE POLICY "System can create asset analysis" 
ON public.asset_analysis 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update asset analysis" 
ON public.asset_analysis 
FOR UPDATE 
USING (true);

-- Brand training profiles policies
CREATE POLICY "Users can view their own training profiles" 
ON public.brand_training_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training profiles" 
ON public.brand_training_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training profiles" 
ON public.brand_training_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.asset_analysis 
ADD CONSTRAINT fk_asset_analysis_training_job 
FOREIGN KEY (training_job_id) REFERENCES public.training_jobs(id) ON DELETE CASCADE;

ALTER TABLE public.asset_analysis 
ADD CONSTRAINT fk_asset_analysis_brand_asset 
FOREIGN KEY (brand_asset_id) REFERENCES public.brand_assets(id) ON DELETE CASCADE;

ALTER TABLE public.brand_training_profiles 
ADD CONSTRAINT fk_brand_training_profiles_training_job 
FOREIGN KEY (training_job_id) REFERENCES public.training_jobs(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_training_jobs_brand_profile_id ON public.training_jobs(brand_profile_id);
CREATE INDEX idx_training_jobs_user_id ON public.training_jobs(user_id);
CREATE INDEX idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX idx_asset_analysis_training_job_id ON public.asset_analysis(training_job_id);
CREATE INDEX idx_asset_analysis_brand_asset_id ON public.asset_analysis(brand_asset_id);
CREATE INDEX idx_brand_training_profiles_brand_profile_id ON public.brand_training_profiles(brand_profile_id);
CREATE INDEX idx_brand_training_profiles_is_active ON public.brand_training_profiles(is_active);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_jobs_updated_at
BEFORE UPDATE ON public.training_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();