import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { handleError, ApiError } from '@/lib/error-handler';
import { imageGenerationRateLimiter } from '@/lib/rate-limiter';
import { useChat } from '@/contexts/ChatContext';
import { UploadedImage, FlowType } from '@/types/common';

/**
 * 🎨 Image Generation Hook
 * 
 * Consolidates AI image generation logic across all flows (Enhance, Create, Video).
 * Handles rate limiting, base64 conversion, API calls, error handling, and session updates.
 * 
 * **Key Features:**
 * - Unified image generation across all workflows
 * - Automatic rate limiting with user feedback
 * - Secure file handling with base64 conversion
 * - Centralized error handling with user-friendly messages
 * - Session state management integration
 * 
 * **Usage:**
 * ```typescript
 * const { generateImage, isGenerating, clearGenerated } = useImageGeneration('enhance');
 * 
 * // Generate image with prompt and optional reference images
 * await generateImage("Transform this into luxury hotel marketing", uploadedImages);
 * ```
 * 
 * @param flowType - The type of flow: 'enhance' | 'create' | 'video'
 * @returns Hook interface with generation functions and state
 * 
 * @example
 * ```typescript
 * // In Enhance.tsx
 * const { generateImage, isGenerating, currentPrompt } = useImageGeneration('enhance');
 * 
 * const handleEnhance = async () => {
 *   await generateImage("Make this beautiful", images);
 * };
 * ```
 */
export const useImageGeneration = (flowType: FlowType, onImageGenerated?: (imageUrl: string, prompt: string) => void) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const { currentSessionId, updateSession } = useChat();

  /**
   * Convert uploaded images to base64 for API call
   */
  const convertImagesToBase64 = async (images: UploadedImage[]) => {
    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const base64Images = await Promise.all(
        images.map(async (img) => ({
          data: await convertToBase64(img.file),
          name: img.name
        }))
      );
      return base64Images;
    } catch (error) {
      console.error("Error converting images to base64:", error);
      return undefined;
    }
  };

  /**
   * Generate image using the consolidated logic
   */
  const generateImage = async (prompt: string, images?: UploadedImage[], uploadedImages?: UploadedImage[]) => {
    console.log(`🎨 Starting ${flowType} image generation for prompt:`, prompt);
    
    // Check rate limit first
    const { allowed, resetTime, remaining } = imageGenerationRateLimiter.isAllowed();
    if (!allowed) {
      const timeUntilReset = Math.ceil((resetTime! - Date.now()) / 1000);
      const actionText = flowType === 'enhance' ? 'enhance' : 'generate';
      toast.error(`Rate limit exceeded. You can ${actionText} ${remaining} more images. Try again in ${timeUntilReset} seconds.`);
      return;
    }
    
    // Show remaining generations warning
    if (remaining !== undefined && remaining <= 2) {
      const actionText = flowType === 'enhance' ? 'enhancements' : 'generations';
      toast.warning(`${remaining} image ${actionText} remaining in this session.`);
    }
    
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setGeneratedImage(undefined);

    try {
      // Use uploaded images if available, otherwise fall back to images parameter
      const imagesToUse = uploadedImages?.length ? uploadedImages : images;
      
      // Convert uploaded images to base64 for the API call
      let imageData = undefined;
      if (imagesToUse && imagesToUse.length > 0) {
        imageData = await convertImagesToBase64(imagesToUse);
      }

      console.log(`🎨 Invoking generate-image function with prompt: "${prompt}"`);
      console.log(`📷 Reference images: ${imageData?.length || 0}`);

      // Test network connectivity
      try {
        const testResponse = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': supabase.supabaseKey
          }
        });
        console.log('🌐 Network test:', testResponse.status, testResponse.statusText);
      } catch (testError) {
        console.warn('🌐 Network test failed:', testError);
      }

      // Add retry logic for network errors
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          // Get the current session to use the user's JWT token
          const { data: { session } } = await supabase.auth.getSession();
          const authToken = session?.access_token || supabase.supabaseAnonKey;
          
          console.log('🔐 Using auth token:', authToken ? 'Present' : 'Missing');
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'apikey': supabase.supabaseAnonKey
            },
            body: JSON.stringify({ 
              prompt,
              images: imageData
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('🔍 Function response:', data);

          // Handle different response formats for compatibility
          const imageUrl = data?.image || data?.imageUrl;
          
          if (imageUrl) {
            console.log("🔍 API Response Image Analysis:");
            console.log("  - Image URL length:", imageUrl.length);
            console.log("  - Starts with data:", imageUrl.startsWith('data:'));
            console.log("  - First 100 chars:", imageUrl.substring(0, 100));
            
            // Validate base64 format if it's a data URL
            if (imageUrl.startsWith('data:image/')) {
              const parts = imageUrl.split(',');
              if (parts.length === 2) {
                const base64Data = parts[1];
                console.log("  - Base64 data length:", base64Data.length);
                console.log("  - Valid base64 format:", /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data));
              } else {
                console.error("❌ Invalid data URL format - missing comma separator");
              }
            }
            
            setGeneratedImage(imageUrl);
            console.log("✅ Image URL set in state");
            
            // Update session IMMEDIATELY after setting the image
            if (currentSessionId) {
              updateSession(currentSessionId, {
                generatedImage: imageUrl,
                currentPrompt: prompt
              });
              console.log("💾 Session updated with generated image");
            }

            // Notify parent component about image generation completion
            if (onImageGenerated) {
              onImageGenerated(imageUrl, prompt);
            }

            // Show success feedback
            toast.success('Image generated successfully!', {
              description: data?.metadata?.styleApplied || 'Your enhanced image is ready'
            });
            
            // Break out of retry loop on success
            break;
          } else {
            console.warn("⚠️ No image in response data:", data);
            throw new Error('Generated image URL not found in response');
          }
        } catch (networkError) {
          // Check if it's a network error that we should retry
          if ((networkError.message?.includes('Failed to fetch') || 
               networkError.message?.includes('QUIC_PROTOCOL_ERROR') ||
               networkError.message?.includes('net::')) && 
              retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Network error, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            continue;
          } else {
            // Re-throw if not a retryable network error or max retries exceeded
            throw networkError;
          }
        }
      }
    } catch (err) {
      // Use centralized error handling
      const appError = handleError(err, `${flowType.charAt(0).toUpperCase() + flowType.slice(1)} Generation`);
      
      // Check if it's a retryable error and offer retry
      if (appError.retryable) {
        console.log('Retryable error encountered:', appError.code);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Clear generated content
   */
  const clearGenerated = () => {
    setGeneratedImage(undefined);
    setCurrentPrompt(undefined);
  };

  return {
    isGenerating,
    currentPrompt,
    generatedImage,
    generateImage,
    clearGenerated,
    setGeneratedImage,
    setCurrentPrompt
  };
};
