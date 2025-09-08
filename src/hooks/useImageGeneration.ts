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
export const useImageGeneration = (flowType: FlowType) => {
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

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { 
          prompt,
          images: imageData
        }
      });

      if (error) throw error;

      if (data?.image) {
        setGeneratedImage(data.image);
        console.log("✅ Image generated successfully");
        
        // Update session if we have one
        if (currentSessionId) {
          updateSession(currentSessionId, {
            generatedImage: data.image,
            currentPrompt: prompt
          });
        }
      } else {
        console.warn("⚠️ No image in response data:", data);
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
