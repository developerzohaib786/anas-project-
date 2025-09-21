import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define CORS headers directly in the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Video generation using Luma AI API (since Vertex AI doesn't have direct video generation)
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎬 Video generation request received');
    
    // Handle GET requests for status checking
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const jobId = url.searchParams.get('jobId');
      
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Missing jobId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('📊 Checking status for job:', jobId);
      
      // Check job status with Luma AI
      const lumaApiKey = Deno.env.get('LUMA_API_KEY');
      if (!lumaApiKey) {
        return new Response(JSON.stringify({ error: 'Missing LUMA_API_KEY' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const statusResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${lumaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('❌ Luma status check failed:', errorText);
        return new Response(JSON.stringify({ 
          error: 'Failed to check video status',
          details: errorText
        }), {
          status: statusResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const statusData = await statusResponse.json();
      console.log('📊 Status data:', statusData);

      // Transform Luma response to match frontend expectations
      const transformedResponse = {
        status: statusData.state, // 'completed', 'processing', 'failed', etc.
        videoUrl: statusData.state === 'completed' ? statusData.assets?.video : null,
        originalResponse: statusData
      };

      return new Response(JSON.stringify(transformedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle POST requests for video generation
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { image, movement_description, sfx_description, video_size, prompt } = await req.json();

    if (!image || !movement_description) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: image and movement_description' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Style guide and prompt construction
    const NINO_VIDEO_STYLE_GUIDE = `Nino Video Style Guide — ALWAYS APPLY:
- Cinematic camera movements: smooth pans, gentle zooms, subtle tilts
- Rich, dramatic lighting with golden hour warmth
- Deep shadows and strong contrast for luxury feel
- Smooth, elegant motion - avoid jarring movements
- Hotel/lifestyle aesthetic with editorial quality
- Natural, organic camera flow - never robotic
- Depth and layering through foreground/background elements
- Warm highlights, cool shadows for premium look
- Film-like quality with subtle grain texture
- Luxury hospitality branding aesthetic`;

    const videoSizeMap = {
      horizontal: "16:9 landscape orientation",
      vertical: "9:16 portrait orientation", 
      square: "1:1 square format",
      portrait: "4:5 portrait format",
      all: "optimize for multiple formats"
    };

    const sizeHint = videoSizeMap[video_size] || "16:9 landscape orientation";
    const sfxHint = sfx_description ? `\nAudio/SFX requirements: ${sfx_description}` : '';
    
    // Enhanced prompt with Gemini analysis
    const geminiApiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
    let enhancedPrompt = movement_description;
    
    if (geminiApiKey) {
      try {
        console.log('🤖 Enhancing prompt with Gemini...');
        
        // Extract base64 data from data URL
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];

        const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Analyze this image and enhance the video generation prompt to follow the Nino Video Style Guide. Original prompt: "${movement_description}". 
                  
                  ${NINO_VIDEO_STYLE_GUIDE}
                  
                  Provide a refined, cinematic prompt that will create a luxury hotel/lifestyle video with smooth camera movements and dramatic lighting. Keep it concise but evocative.`
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }]
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const enhancedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (enhancedText) {
            enhancedPrompt = enhancedText;
            console.log('✨ Prompt enhanced with Gemini');
          }
        }
      } catch (error) {
        console.warn('⚠️ Gemini enhancement failed, using original prompt:', error);
      }
    }

    const finalPrompt = `${enhancedPrompt}

Video specifications:
- Format: ${sizeHint}
- Duration: 7 seconds
- Style: Cinematic, luxury hotel aesthetic
- Lighting: Golden hour warmth with dramatic shadows${sfxHint}

Apply Nino Video Style Guide for premium, smooth cinematic quality.`;

    console.log('🎨 Final prompt prepared:', finalPrompt.substring(0, 200) + '...');

    // Generate video with Luma AI
    const lumaApiKey = Deno.env.get('LUMA_API_KEY');
    if (!lumaApiKey) {
      console.error('❌ Missing LUMA_API_KEY');
      return new Response(JSON.stringify({
        error: 'Missing LUMA_API_KEY configuration'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Calling Luma AI API...');
    
    // Create Supabase client for temporary image storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(JSON.stringify({
        error: 'Missing Supabase configuration for image storage'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload image to Supabase Storage temporarily
    let imageUrl: string;
    try {
      console.log('📤 Uploading image to Supabase Storage...');
      
      // Convert base64 to blob
      const imageBase64 = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
      
      // Create unique filename
      const fileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.${mimeType.split('/')[1]}`;
      
      // Upload to Supabase Storage
      const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/temp-images/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': mimeType,
        },
        body: imageBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Failed to upload image:', errorText);
        throw new Error('Failed to upload image to storage');
      }

      // Get public URL
      imageUrl = `${supabaseUrl}/storage/v1/object/public/temp-images/${fileName}`;
      console.log('✅ Image uploaded to:', imageUrl);
      
    } catch (error) {
      console.error('💥 Image upload error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to process image for video generation',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const lumaResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lumaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'ray-1-6',
        prompt: finalPrompt,
        keyframes: {
          frame0: {
            type: 'image',
            url: imageUrl
          }
        },
        aspect_ratio: video_size === 'vertical' ? '9:16' : 
                     video_size === 'square' ? '1:1' :
                     video_size === 'portrait' ? '4:5' : '16:9',
        loop: false
      })
    });

    console.log('📡 Luma response status:', lumaResponse.status);

    if (!lumaResponse.ok) {
      const errorText = await lumaResponse.text();
      console.error('❌ Luma API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Video generation failed',
        details: errorText
      }), {
        status: lumaResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const lumaData = await lumaResponse.json();
    console.log('✅ Video generation started:', lumaData);

    return new Response(JSON.stringify({
      generationId: lumaData.id,
      status: 'started',
      message: 'Video generation initiated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})