/**
 * Shared type definitions for the Nino application
 * 
 * This file contains commonly used interfaces and types that are shared
 * across multiple components to ensure type consistency and reduce duplication.
 */

/**
 * Represents an uploaded image file with metadata
 */
export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

/**
 * Chat message interface
 */
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isGenerating?: boolean;
  images?: UploadedImage[];
}

/**
 * Flow types for different workflows
 */
export type FlowType = 'enhance' | 'create' | 'video';

/**
 * Session titles mapping for different flows
 */
export const FLOW_SESSION_TITLES: Record<FlowType, string> = {
  enhance: 'Photo Enhancement',
  create: 'Creative Chat',
  video: 'Video Project'
};

/**
 * Toast message types for different flows
 */
export const FLOW_MESSAGES = {
  enhance: {
    empty: 'Ready for a new photo!',
    newSession: 'New enhancement started!'
  },
  create: {
    empty: 'Ready to create!',
    newSession: 'New creative session started!'
  },
  video: {
    empty: 'Ready for a new video!',
    newSession: 'New video project started!'
  }
} as const;

/**
 * Content detector function type for session management
 */
export type ContentDetector = () => boolean;

/**
 * Aspect ratio options for image preview
 */
export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

/**
 * Video size options for video generation
 */
export type VideoSize = 'horizontal' | 'vertical' | 'square' | 'portrait' | 'all';
