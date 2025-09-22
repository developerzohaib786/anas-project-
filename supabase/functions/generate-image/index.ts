import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Nino Style Guidelines - Built into the model
const NINO_SYSTEM_INSTRUCTIONS = `USE THESE PHOTO GUIDELINES TO TRANSFORM THESE IMAGES
We Like Shadows – Deep, rich shadows with detail preserved. Shadows are a feature, not a flaw. They add drama, mystery, and cinematic depth. Dutch angles – Tilted compositions that feel slightly off-balance and editorial, avoiding static straight-on shots. Reflections – Surfaces like water, glass, or mirrors used to layer and add visual intrigue. Textures – Emphasize tactile details (rain, sand, snow, ripples, stone, fabric). Photos should feel touchable. Symmetry & balance – Symmetry in architecture and framing, but not overly perfect — natural balance is preferred. Blurred subjects – Motion blur or soft focus for an in-the-moment, candid feeling. Not overly staged – Scenes should feel natural, editorial, or documentary, not posed or commercial. Not only eye-level angles – Mix perspectives: low angles, high vantage points, or looking through foreground elements. Open space / negative space – Allow breathing room with sky, water, table space, or landscape. Luxurious calm comes from space. Layering subjects – Frame using foreground/midground/background to create cinematic depth. Flash photography – On-camera flash at night for raw, high-fashion editorial energy. Film-like grain – Add grain that feels tactile and cinematic, like 35mm film — not digital noise. Rich contrast – Deep blacks, strong highlights. Contrast should feel bold and cinematic, never washed out. Golden warmth – Warm tones in highlights (golden sunlight, candlelight glow). Creates a timeless, editorial luxury feel. Cool shadows – Subtle cool (green/blue) tints in shadows for cinematic contrast with warm highlights. Muted saturation – Earthy tones, not overly vibrant. Sun-soaked, elegant, and natural instead of touristy bright. Halation / glow – Soft glowing edges around light sources (sunset, candles, reflections) for cinematic texture. Lifestyle over portraiture – Capture moments (serving food, walking by water, lounging by the pool) rather than posed faces.
We Do Not Like Smiles – Avoid posed, tourist-style smiling. We want understated emotion or candid mood. Faces as focal points – Faces should rarely be the subject; people are part of the scene, not the scene itself. Faded colors – No washed-out, flat grading. Colors should be rich, earthy, and intentional. Overly staged shots – No cliché hotel marketing photos (posed staff, sterile interiors, staged couples clinking glasses). Neon or oversaturated tones – Avoid cheap, loud, or Instagram-influencer vibrancy.
Summary of Nino Style: Nino's photography should feel like editorial luxury lifestyle — cinematic, natural, warm, and timeless. Images should have depth, texture, and richness. People appear as moments within the environment, not the subject itself. The grading leans toward golden warmth with cool contrast, rich shadows, and a film-inspired tactile quality. Think Condé Nast Traveler meets Kinfolk magazine: cinematic storytelling, natural imperfection, and quiet luxury.`;
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('🎯 Nino Custom Model - Image generation request received');
    const requestData = await req.json();
    console.log('📋 Request data keys:', Object.keys(requestData));
    console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
    const { prompt, aspect_ratio, uploaded_images } = requestData;
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({
        error: 'Missing or invalid prompt'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found in environment variables');
    }
    // Better image detection logic
    const hasUploadedImages = uploaded_images && Array.isArray(uploaded_images) && uploaded_images.length > 0 && uploaded_images[0];
    console.log('📋 uploaded_images type:', typeof uploaded_images);
    console.log('📋 uploaded_images is array:', Array.isArray(uploaded_images));
    console.log('📋 uploaded_images length:', uploaded_images?.length);
    console.log('📋 hasUploadedImages:', hasUploadedImages);
    if (hasUploadedImages) {
      console.log('📋 First image structure:', Object.keys(uploaded_images[0] || {}));
      console.log('📋 First image data type:', typeof uploaded_images[0]?.data);
    }
    console.log(`📸 Processing ${hasUploadedImages ? 'IMAGE ENHANCEMENT' : 'TEXT-TO-IMAGE GENERATION'} request`);
    let enhancedPrompt;
    let requestBody;
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';
    if (hasUploadedImages) {
      // Image enhancement mode using Gemini 2.0 Flash Preview Image Generation
      enhancedPrompt = `IMPORTANT: Enhance and transform the provided image while preserving its main subject, composition, and recognizable elements. Apply the Nino luxury aesthetic to this existing image.

User request: ${prompt}

${NINO_SYSTEM_INSTRUCTIONS}

CRITICAL INSTRUCTIONS:
- KEEP the original subject matter, people, objects, and overall composition from the uploaded image
- PRESERVE the recognizable elements while enhancing the style and aesthetic
- Apply editorial luxury hotel photography treatment: cinematic lighting, rich shadows, golden hour warmth, film-like grain, high contrast, muted earthy tones
- Enhance quality, lighting, and atmosphere while maintaining the core content of the original image
- This should be a stylistic enhancement of the existing image, not a completely new image
- The result should be clearly related to and derived from the uploaded image`;
      // Process the uploaded image
      const imageData = uploaded_images[0];
      console.log('📸 Processing uploaded image...');
      console.log('📋 Image data type:', typeof imageData);
      console.log('📋 Image data keys:', Object.keys(imageData || {}));
      let base64Image;
      let mimeType;
      if (imageData && typeof imageData === 'object' && imageData.data) {
        // Your frontend format: { data: "data:image/jpeg;base64,/9j/4AAQ...", mimeType: "image/jpeg", name: "file.jpg" }
        if (imageData.data.startsWith('data:')) {
          const parts = imageData.data.split(',');
          base64Image = parts[1];
          mimeType = imageData.mimeType || parts[0].split(';')[0].split(':')[1];
          console.log('✅ Extracted base64 from data URL, length:', base64Image?.length);
        } else {
          base64Image = imageData.data;
          mimeType = imageData.mimeType || 'image/jpeg';
          console.log('✅ Using raw base64 data, length:', base64Image?.length);
        }
      } else {
        console.error('❌ Unsupported image format:', typeof imageData);
        console.error('❌ Image data structure:', imageData);
        throw new Error('Uploaded image must be an object with data property containing base64 data');
      }
      if (!base64Image) {
        throw new Error('No valid base64 image data found');
      }
      console.log('📸 Image data processed successfully');
      console.log('📋 MIME type:', mimeType);
      console.log('📋 Base64 length:', base64Image.length);
      // Gemini 2.0 Flash Preview Image Generation API for image editing
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: [
            "TEXT",
            "IMAGE"
          ],
          temperature: 0.1,
          topP: 0.8
        }
      };
    } else {
      // Text-to-image generation using Gemini 2.0 Flash Preview Image Generation
      enhancedPrompt = `Create a new image based on this description: ${prompt}

${NINO_SYSTEM_INSTRUCTIONS}

Style: Editorial luxury hotel photography, cinematic composition, rich shadows, golden hour lighting, film-like grain, high contrast, muted earthy tones, professional campaign quality. Create an image that feels like Condé Nast Traveler meets Kinfolk magazine.`;
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: [
            "TEXT",
            "IMAGE"
          ],
          temperature: 0.4,
          topP: 0.9
        }
      };
    }
    console.log('🎨 Calling Gemini 2.0 Flash Preview Image Generation API...');
    console.log(`Mode: ${hasUploadedImages ? 'IMAGE ENHANCEMENT' : 'TEXT-TO-IMAGE GENERATION'}`);
    console.log('📡 Making API request...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log('📡 Response received, status:', response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚫 Gemini API Error:', response.status, errorText);
      if (response.status === 403) {
        throw new Error('API access denied. Please ensure your API key has access to Gemini 2.0 Flash Preview Image Generation and billing is enabled (paid tier required).');
      } else if (response.status === 404) {
        throw new Error('Gemini 2.0 Flash Preview Image Generation model not found. The model may not be available in your region or you may need a paid tier.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before trying again.');
      } else {
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
    }
    let result;
    try {
      result = await response.json();
      console.log('✅ JSON response parsed successfully');
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      throw new Error('Invalid JSON response from Gemini API');
    }
    // Extract image from Gemini 2.0 response structure
    let generatedImageUrl = null;
    let responseText = null;
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
      const parts = result.candidates[0].content.parts;
      for (const part of parts){
        if (part.text) {
          responseText = part.text;
          console.log('📝 Response text:', responseText);
        } else if (part.inline_data && part.inline_data.data) {
          // Gemini returns base64 image data in inline_data.data
          generatedImageUrl = `data:image/png;base64,${part.inline_data.data}`;
          console.log('🖼️ Image found, length:', part.inline_data.data.length);
        } else if (part.inlineData && part.inlineData.data) {
          // Alternative property name format
          generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          console.log('🖼️ Image found (alt format), length:', part.inlineData.data.length);
        }
      }
    }
    if (!generatedImageUrl) {
      console.error('❌ No image found in API response');
      console.error('Response structure:', JSON.stringify(result, null, 2));
      if (responseText && responseText.includes('I can\'t generate')) {
        throw new Error('Gemini declined to generate the image. Try a different prompt or uploaded image.');
      } else {
        throw new Error('No image generated from Gemini API - the model may have only returned text');
      }
    }
    console.log(`✅ Image ${hasUploadedImages ? 'ENHANCED' : 'GENERATED'} successfully`);
    return new Response(JSON.stringify({
      success: true,
      image: generatedImageUrl,
      imageUrl: generatedImageUrl,
      prompt: prompt,
      enhancedPrompt: enhancedPrompt.substring(0, 200) + '...',
      style: 'Nino Aesthetic - Editorial Luxury',
      aspectRatio: aspect_ratio || '16:9',
      mode: hasUploadedImages ? 'image-enhancement' : 'text-to-image',
      uploadedImagesCount: uploaded_images ? uploaded_images.length : 0,
      note: hasUploadedImages ? 'Enhanced your uploaded image with luxury aesthetic while preserving original content using Gemini 2.0 Flash Preview' : 'Generated from text prompt with Nino luxury aesthetic using Gemini 2.0 Flash Preview',
      responseText: responseText,
      metadata: {
        styleApplied: 'Cinematic hotel marketing with rich shadows and golden warmth',
        quality: 'Campaign-ready',
        aesthetic: 'Condé Nast Traveler meets Kinfolk magazine',
        timestamp: new Date().toISOString(),
        generatedWith: 'Gemini 2.0 Flash Preview Image Generation',
        model: 'gemini-2.0-flash-preview-image-generation',
        enhancementMode: hasUploadedImages ? 'Image editing with reference image - content preserved' : 'Text-to-image generation'
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Generate-image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    return new Response(JSON.stringify({
      error: errorMessage,
      troubleshooting: {
        checkApiKey: 'Ensure GEMINI_API_KEY is set in Supabase secrets',
        checkBilling: 'Ensure billing is enabled for Gemini API - Gemini 2.0 Flash Preview Image Generation requires paid tier',
        checkQuota: 'Verify your API quota and rate limits',
        imageFormat: 'Ensure uploaded images are in base64 format with proper MIME types',
        modelAccess: 'Check if you have access to Gemini 2.0 Flash Preview Image Generation model',
        region: 'Image generation may not be available in all regions'
      }
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
