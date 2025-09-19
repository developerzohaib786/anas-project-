-- Add missing columns to chat_attachments table for Cloudinary integration

-- Add attachment_type column to categorize attachments
ALTER TABLE public.chat_attachments 
ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'file' CHECK (attachment_type IN ('image', 'video', 'file', 'document'));

-- Add metadata column to store additional information like Cloudinary URLs
ALTER TABLE public.chat_attachments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_chat_attachments_metadata ON public.chat_attachments USING GIN(metadata);

-- Create index for attachment_type queries
CREATE INDEX IF NOT EXISTS idx_chat_attachments_type ON public.chat_attachments(attachment_type);