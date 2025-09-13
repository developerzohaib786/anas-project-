// UPDATED GENERATE-VIDEO FUNCTION - Ready for deployment
// Copy this entire file content to your Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Type declaration for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper functions for different video generation APIs
async function generateWithRunwayML(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement RunwayML Gen-3 API integration
  console.log('🚀 RunwayML integration not yet implemented');
  throw new Error('RunwayML integration coming soon');
}

async function generateWithStableVideo(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement Stable Video Diffusion API integration
  console.log('🚀 Stable Video integration not yet implemented');
  throw new Error('Stable Video integration coming soon');
}

async function generateWithPika(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement Pika Labs API integration
  console.log('🚀 Pika Labs integration not yet implemented');
  throw new Error('Pika Labs integration coming soon');
}

async function generateWithLuma(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement Luma AI Dream Machine API integration
  console.log('🚀 Luma AI integration not yet implemented');
  throw new Error('Luma AI integration coming soon');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('🎬 Generate video request received');
    const { image, movement_description, sfx_description, video_size, prompt } = await req.json();
    
    console.log('🖼️ Image data received:', image ? 'Yes' : 'No');
    console.log('🎭 Movement description:', movement_description);
    console.log('🔊 SFX description:', sfx_description);
    console.log('📐 Video size:', video_size);

    if (!image || !movement_description) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields: image and movement_description are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    // Create a client scoped to the end-user (RLS enforced)
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') || ''
        }
      }
    });

    // Try to load user's active training profile (optional)
    let brandInfo = '';
    try {
      const { data: profile } = await supabase
        .from('training_sessions')
        .select('brand_profile')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (profile?.brand_profile) {
        brandInfo = `\nBrand Context: ${profile.brand_profile}`;
        console.log('🎨 Brand profile loaded for personalization');
      } else {
        console.log('ℹ️ No active brand profile found');
      }
    } catch (profileError) {
      console.warn('⚠️ Could not load brand profile:', profileError);
    }

    // Build video generation prompt
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

    const sizeHint = videoSizeMap[video_size as keyof typeof videoSizeMap] || "16:9 landscape orientation";
    const sfxHint = sfx_description ? `\nAudio/SFX requirements: ${sfx_description}` : '';

    const finalPrompt = `Generate a high-quality video following the Nino Video Style Guide.

${NINO_VIDEO_STYLE_GUIDE}

Movement/Animation: ${movement_description}
Video Format: ${sizeHint}${sfxHint}${brandInfo}

Create a cinematically elegant video with the specified movement while maintaining the luxury hospitality aesthetic that defines the Nino brand.`;

    console.log('🎨 Final video prompt prepared with Nino style guide');

    const apiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
    if (!apiKey) {
      console.error('❌ Missing GOOGLE_STUDIO_API_KEY');
      return new Response(JSON.stringify({
        error: 'Missing GOOGLE_STUDIO_API_KEY secret'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('🔑 API key found, calling Google AI Studio...');

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    // Use Gemini for video generation guidance
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and create detailed video generation instructions based on the following prompt: ${finalPrompt}

Provide a detailed technical description for video generation including:
1. Camera movement specifications
2. Lighting and color adjustments needed
3. Motion elements to animate
4. Timing and pacing recommendations
5. Audio/SFX suggestions

Be specific about technical parameters that would help generate a high-quality video.`
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Google AI Studio error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to analyze image with Google AI Studio',
        details: error
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const ai = await response.json();
    console.log('📦 Google AI response received');

    const videoInstructions = ai?.candidates?.[0]?.content?.parts?.[0]?.text || 'Video generation instructions created';
    console.log('📝 Video instructions generated:', videoInstructions);

    // Check for video generation API keys (add these to your Supabase secrets when ready)
    const runwayApiKey = Deno.env.get('RUNWAY_API_KEY');
    const stableVideoApiKey = Deno.env.get('STABLE_VIDEO_API_KEY');
    const pikaApiKey = Deno.env.get('PIKA_API_KEY');
    const lumaApiKey = Deno.env.get('LUMA_API_KEY');

    // If any video generation API is available, use it
    if (runwayApiKey) {
      console.log('🚀 Using RunwayML Gen-3 for video generation...');
      return await generateWithRunwayML(runwayApiKey, image, videoInstructions, finalPrompt, sizeHint, movement_description, sfx_description);
    } else if (stableVideoApiKey) {
      console.log('🚀 Using Stable Video Diffusion...');
      return await generateWithStableVideo(stableVideoApiKey, image, videoInstructions, finalPrompt, sizeHint, movement_description, sfx_description);
    } else if (pikaApiKey) {
      console.log('🚀 Using Pika Labs...');
      return await generateWithPika(pikaApiKey, image, videoInstructions, finalPrompt, sizeHint, movement_description, sfx_description);
    } else if (lumaApiKey) {
      console.log('🚀 Using Luma AI Dream Machine...');
      return await generateWithLuma(lumaApiKey, image, videoInstructions, finalPrompt, sizeHint, movement_description, sfx_description);
    }

    // Fallback to enhanced mock implementation
    console.log('⚠️ No video generation API keys found - using enhanced mock');
    console.log('💡 To enable real video generation, add one of these secrets:');
    console.log('   - RUNWAY_API_KEY (RunwayML Gen-3)');
    console.log('   - STABLE_VIDEO_API_KEY (Stable Video Diffusion)');
    console.log('   - PIKA_API_KEY (Pika Labs)');
    console.log('   - LUMA_API_KEY (Luma AI Dream Machine)');

    // Enhanced mock with more realistic behavior
    const mockGenerationTime = Math.random() * 30000 + 15000; // 15-45 seconds
    console.log(`⏱️ Simulating video generation (${Math.round(mockGenerationTime/1000)}s)...`);
    await new Promise(resolve => setTimeout(resolve, mockGenerationTime));

    // Select mock video based on movement description for better relevance
    const mockVideoUrls = {
      default: [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      ],
      smooth: [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
      ],
      dynamic: [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
      ]
    };

    // Choose video category based on movement description
    let videoCategory: keyof typeof mockVideoUrls = 'default';
    if (movement_description?.toLowerCase().includes('smooth')) videoCategory = 'smooth';
    if (movement_description?.toLowerCase().includes('dynamic')) videoCategory = 'dynamic';
    
    const categoryVideos = mockVideoUrls[videoCategory] || mockVideoUrls.default;
    const selectedVideo = categoryVideos[Math.floor(Math.random() * categoryVideos.length)];

    console.log(`🎬 Returning demo video (${videoCategory} category)`);

    return new Response(JSON.stringify({
      video: selectedVideo,
      instructions: videoInstructions,
      prompt: finalPrompt,
      isDemoVideo: true,
      demoMessage: `Demo video selected based on "${movement_description}". To generate real videos, add video generation API keys to your Supabase secrets.`,
      metadata: {
        duration: "7 seconds",
        format: sizeHint,
        movement: movement_description,
        sfx: sfx_description || "Auto-selected ambient audio",
        generationType: "enhanced-mock",
        availableApis: "Add RUNWAY_API_KEY, STABLE_VIDEO_API_KEY, PIKA_API_KEY, or LUMA_API_KEY to enable real generation",
        category: videoCategory
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    console.error('💥 Generate-video error:', error);
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    return new Response(JSON.stringify({
      error: errorObj.message || 'Unexpected error',
      stack: errorObj.stack,
      name: errorObj.name
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});