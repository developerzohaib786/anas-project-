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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('🎯 Nino Custom Model - Image generation request received');
    const { prompt, aspect_ratio, uploaded_images } = await req.json();

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

    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found in environment variables. Please add GEMINI_API_KEY to your Supabase secrets.');
    }

    // Determine if this is image editing or text-to-image generation
    const hasUploadedImages = uploaded_images && uploaded_images.length > 0;
    console.log(`📸 Processing ${hasUploadedImages ? 'image editing' : 'text-to-image generation'} request`);

    let apiUrl, requestBody;

    if (hasUploadedImages) {
      // IMAGE EDITING MODE - Use Gemini 2.0 Flash with image input
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';
      
      // Compose enhanced prompt with Nino style for image editing
      const enhancedPrompt = `${prompt}.\n\n${NINO_SYSTEM_INSTRUCTIONS}\nStyle: Transform this image into editorial luxury hotel photography style with cinematic composition, rich shadows, golden hour lighting, film-like grain, high contrast, muted earthy tones, professional campaign quality. Maintain the core subject and composition while enhancing the aesthetic.`;

      // Prepare content parts with uploaded images
      const parts = [
        { text: enhancedPrompt }
      ];

      // Add uploaded images to the request
      uploaded_images.forEach((uploadedImage, index) => {
        if (uploadedImage.data && uploadedImage.mimeType) {
          // Extract base64 data (remove data:image/xxx;base64, prefix if present)
          let base64Data = uploadedImage.data;
          if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1];
          }

          parts.push({
            inline_data: {
              mime_type: uploadedImage.mimeType,
              data: base64Data
            }
          });
        }
      });

      requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

    } else {
      // TEXT-TO-IMAGE MODE - Use Imagen for pure text-to-image generation
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict';
      
      // Compose enhanced prompt with Nino style
      const enhancedPrompt = `${prompt}.\n\n${NINO_SYSTEM_INSTRUCTIONS}\nStyle: Editorial luxury hotel photography, cinematic composition, rich shadows, golden hour lighting, film-like grain, high contrast, muted earthy tones, professional campaign quality.`;

      requestBody = {
        instances: [
          {
            prompt: enhancedPrompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspect_ratio || '1:1',
          personGeneration: 'allow_adult'
        }
      };
    }

    console.log(`🎨 Calling ${hasUploadedImages ? 'Gemini API for image editing' : 'Imagen API for text-to-image generation'}...`);
    console.log('Using API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response received');
    console.log('Response structure:', JSON.stringify(result, null, 2));

    // Extract image from response (different for Gemini vs Imagen)
    let generatedImageUrl = null;
    let responseText = null;
    
    if (hasUploadedImages) {
      // GEMINI RESPONSE FORMAT (Image editing)
      // The response structure is: { candidates: [{ content: { parts: [{ text: "...", inline_data: { mime_type: "...", data: "..." } }] } }] }
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              responseText = part.text;
              console.log('📝 Gemini response text:', responseText);
            }
            if (part.inline_data && part.inline_data.data) {
              const mimeType = part.inline_data.mime_type || 'image/png';
              generatedImageUrl = `data:${mimeType};base64,${part.inline_data.data}`;
              console.log('🖼️ Found image in Gemini response, length:', part.inline_data.data.length);
              break;
            }
          }
        }
      }
    } else {
      // IMAGEN RESPONSE FORMAT (Text-to-image)
      if (result.predictions && result.predictions[0]) {
        const prediction = result.predictions[0];
        if (prediction.bytesBase64Encoded) {
          generatedImageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
          console.log('🖼️ Found image in Imagen response, length:', prediction.bytesBase64Encoded.length);
        } else if (prediction.mimeType && prediction.bytesBase64Encoded) {
          generatedImageUrl = `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`;
          console.log('🖼️ Found image in Imagen response with custom mime type');
        }
      }
    }

    if (!generatedImageUrl) {
      console.error('No image found in API response. Full response structure:');
      console.error(JSON.stringify(result, null, 2));
      
      // Provide detailed debugging information
      if (hasUploadedImages) {
        console.error('Expected Gemini structure: candidates[0].content.parts[].inline_data.data');
        if (result.candidates) {
          console.error('Candidates found:', result.candidates.length);
          if (result.candidates[0]?.content?.parts) {
            console.error('Parts found:', result.candidates[0].content.parts.length);
            result.candidates[0].content.parts.forEach((part, i) => {
              console.error(`Part ${i}:`, Object.keys(part));
            });
          }
        }
      } else {
        console.error('Expected Imagen structure: predictions[0].bytesBase64Encoded');
        if (result.predictions) {
          console.error('Predictions found:', result.predictions.length);
          if (result.predictions[0]) {
            console.error('Prediction keys:', Object.keys(result.predictions[0]));
          }
        }
      }
      
      throw new Error(`No image generated from ${hasUploadedImages ? 'Gemini' : 'Imagen'} API - unexpected response structure`);
    }

    console.log(`✅ Image ${hasUploadedImages ? 'edited' : 'generated'} successfully`);

    return new Response(JSON.stringify({
      success: true,
      image: generatedImageUrl,
      imageUrl: generatedImageUrl,
      prompt: prompt,
      enhancedPrompt: hasUploadedImages ? 
        `Image editing: ${prompt} with Nino aesthetic enhancement` : 
        `Text-to-image: ${prompt} with Nino aesthetic`,
      responseText: responseText, // Include any text response from Gemini
      style: 'Nino Aesthetic - Editorial Luxury',
      aspectRatio: aspect_ratio || '1:1',
      mode: hasUploadedImages ? 'image-editing' : 'text-to-image',
      uploadedImagesCount: uploaded_images ? uploaded_images.length : 0,
      metadata: {
        styleApplied: 'Cinematic hotel marketing with rich shadows and golden warmth',
        quality: 'Campaign-ready',
        aesthetic: 'Condé Nast Traveler meets Kinfolk magazine',
        timestamp: new Date().toISOString(),
        generatedWith: hasUploadedImages ? 'Gemini 2.0 Flash (Image Editing)' : 'Imagen 4 (Text-to-Image)',
        model: hasUploadedImages ? 'gemini-2.0-flash-preview-image-generation' : 'imagen-4.0-generate-preview-06-06',
        apiResponseStructure: hasUploadedImages ? 'Gemini candidates format' : 'Imagen predictions format'
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
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown Error';

    return new Response(JSON.stringify({
      error: errorMessage,
      stack: errorStack,
      name: errorName,
      troubleshooting: {
        checkApiKey: 'Ensure GEMINI_API_KEY is set in Supabase secrets',
        checkModel: 'Ensure you have access to Gemini 2.0 Flash Preview (paid tier required)',
        checkQuota: 'Verify your Google Cloud/Gemini API quota and billing',
        checkImages: 'Ensure uploaded images are in supported formats (PNG, JPEG, WebP)',
        debugTip: 'Check Supabase function logs for detailed API response structure'
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