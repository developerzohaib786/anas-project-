import { ChatHistoryService } from '@/services/chatHistoryService';
import { User } from '@supabase/supabase-js';

/**
 * Utility functions for creating different types of chat sessions
 */

export interface SessionCreationOptions {
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new chat session for regular conversations
 */
export async function createChatSession(
  user: User, 
  options: SessionCreationOptions = {}
): Promise<any> {
  const { title = 'New Chat', metadata } = options;
  return await ChatHistoryService.createChatSession(title, user);
}

/**
 * Create a new enhance session for image/content enhancement
 */
export async function createEnhanceSession(
  user: User, 
  options: SessionCreationOptions & {
    enhancementType?: 'image_upscale' | 'image_enhance' | 'content_improve';
    quality?: 'low' | 'medium' | 'high';
  } = {}
): Promise<any> {
  const { 
    title = 'New Enhancement Session', 
    enhancementType = 'image_enhance',
    quality = 'medium',
    metadata = {}
  } = options;

  const sessionMetadata = {
    enhancement_type: enhancementType,
    quality,
    ...metadata
  };

  return await ChatHistoryService.createEnhanceSession(title, user, sessionMetadata);
}

/**
 * Create a new video session for video generation/editing
 */
export async function createVideoSession(
  user: User, 
  options: SessionCreationOptions & {
    videoType?: 'generation' | 'editing' | 'enhancement';
    duration?: number;
    quality?: '720p' | '1080p' | '4k';
    aspectRatio?: '16:9' | '9:16' | '1:1';
  } = {}
): Promise<any> {
  const { 
    title = 'New Video Session', 
    videoType = 'generation',
    duration = 30,
    quality = '1080p',
    aspectRatio = '16:9',
    metadata = {}
  } = options;

  const sessionMetadata = {
    video_type: videoType,
    duration,
    quality,
    aspect_ratio: aspectRatio,
    ...metadata
  };

  return await ChatHistoryService.createVideoSession(title, user, sessionMetadata);
}

/**
 * Get session type display name
 */
export function getSessionTypeDisplayName(sessionType: string): string {
  const displayNames: Record<string, string> = {
    chat: 'Chat',
    enhance: 'Enhancement',
    video: 'Video'
  };
  
  return displayNames[sessionType] || sessionType;
}

/**
 * Get session type icon
 */
export function getSessionTypeIcon(sessionType: string): string {
  const icons: Record<string, string> = {
    chat: '💬',
    enhance: '✨',
    video: '🎥'
  };
  
  return icons[sessionType] || '📄';
}