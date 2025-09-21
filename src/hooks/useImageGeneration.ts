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
 * - Smart mode detection (text-to-image vs image editing)
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
   * Convert uploaded images to the format expected by the Edge Function
   * Includes proper MIME type detection and base64 conversion
   */
  const prepareImagesForAPI = async (images: UploadedImage[]) => {
    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const processedImages = await Promise.all(
        images.map(async (img) => {
          let base64Data: string;
          let mimeType: string;

          // Handle different input formats
          if (img.data && img.data.startsWith('data:')) {
            // Already base64 encoded
            base64Data = img.data;
            mimeType = img.mimeType || img.data.split(';')[0].split(':')[1];
          } else if (img.file) {
            // Need to convert File to base64
            base64Data = await convertToBase64(img.file);
            mimeType = img.file.type;
          } else {
            console.warn('Invalid image format:', img);
            return null;
          }

          return {
            data: base64Data,
            mimeType,
            name: img.name
          };
        })
      );

      // Filter out null values
      return processedImages.filter(img => img !== null);
    } catch (error) {
      console.error("Error preparing images for API:", error);
      throw new Error("Failed to process uploaded images");
    }
  };

  /**
   * Generate image using the consolidated logic with support for both 
   * text-to-image generation and image editing
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
      
      // Prepare images for API if any are provided
      let processedImages = undefined;
      if (imagesToUse && imagesToUse.length > 0) {
        processedImages = await prepareImagesForAPI(imagesToUse);
        console.log(`📷 Prepared ${processedImages.length} images for ${processedImages.length > 0 ? 'editing' : 'generation'} mode`);
      }

      console.log(`🎨 Invoking generate-image function with prompt: "${prompt}"`);
      console.log(`📷 Reference images: ${processedImages?.length || 0}`);
      console.log(`🔄 Mode: ${processedImages?.length > 0 ? 'Image Editing (Gemini)' : 'Text-to-Image (Imagen)'}`);

      // Test network connectivity
      try {
        const testResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabase.supabaseAnonKey
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

          // Prepare request body for the new dual-mode Edge Function
          const requestBody = {
            prompt,
            aspect_ratio: '16:9', // Default aspect ratio, can be made configurable
            ...(processedImages && processedImages.length > 0 && {
              uploaded_images: processedImages
            })
          };
          
          console.log('📦 Request body structure:', {
            prompt: requestBody.prompt,
            aspect_ratio: requestBody.aspect_ratio,
            uploaded_images_count: processedImages?.length || 0,
            mode: processedImages?.length > 0 ? 'image-editing' : 'text-to-image'
          });
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'apikey': supabase.supabaseAnonKey
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('🚫 API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}. Details: ${errorText}`);
          }

          const data = await response.json();
          console.log('🔍 Function response:', {
            success: data.success,
            mode: data.mode,
            model: data.metadata?.model,
            uploadedImagesCount: data.uploadedImagesCount
          });

          // Handle the response from the new dual-mode Edge Function
          const imageUrl = data?.image || data?.imageUrl;
          
          if (data.success && imageUrl) {
            console.log("🔍 API Response Image Analysis:");
            console.log("  - Image URL length:", imageUrl.length);
            console.log("  - Starts with data:", imageUrl.startsWith('data:'));
            console.log("  - First 100 chars:", imageUrl.substring(0, 100));
            console.log("  - Generation mode:", data.mode);
            console.log("  - Model used:", data.metadata?.model);
            
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
                currentPrompt: prompt,
                generationMode: data.mode,
                modelUsed: data.metadata?.model
              });
              console.log("💾 Session updated with generated image");
            }

            // Notify parent component about image generation completion
            if (onImageGenerated) {
              onImageGenerated(imageUrl, prompt);
            }

            // Show success feedback with mode-specific messaging
            const modeText = data.mode === 'image-editing' ? 'Image enhanced' : 'Image generated';
            const modelText = data.metadata?.model?.includes('gemini') ? '(Gemini)' : '(Imagen)';
            
            toast.success(`${modeText} successfully! ${modelText}`, {
              description: data?.metadata?.styleApplied || 'Your enhanced image is ready'
            });
            
            // Break out of retry loop on success
            break;
          } else {
            console.warn("⚠️ No image in response data:", data);
            const errorMsg = data.error || 'Generated image URL not found in response';
            throw new Error(errorMsg);
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

      // Show error feedback with troubleshooting info
      if (err.message?.includes('Gemini API')) {
        toast.error('Image generation failed', {
          description: 'Please check your API key and ensure you have access to Gemini 2.0 Flash Preview (paid tier required for image editing)'
        });
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