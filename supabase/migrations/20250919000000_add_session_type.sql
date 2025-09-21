-- Add session_type column to chat_sessions table to support different types of sessions
-- This allows us to differentiate between regular chat, enhance chat, and video sessions

ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'chat' 
CHECK (session_type IN ('chat', 'enhance', 'video', 'create'));

-- Create index for better performance when filtering by session type
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_type ON public.chat_sessions(session_type);

-- Add metadata column for storing session-specific configuration
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS session_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata ON public.chat_sessions USING GIN(session_metadata);