-- Add attachments column to existing chat_messages table
-- This migration adds support for storing attachments directly in the chat_messages table

-- Add the attachments column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'attachments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Update the message_type check constraint to include our new types
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'video', 'file', 'user', 'assistant', 'system'));

-- Update the role check constraint to include system messages
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_role_check;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_role_check 
CHECK (role IN ('user', 'assistant', 'system'));

-- Create index for attachments queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachments 
ON public.chat_messages USING GIN(attachments);

-- Update the updated_at column to use the same format as our new migration
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();