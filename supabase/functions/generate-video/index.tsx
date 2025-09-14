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
  console.log('🚀 Starting RunwayML Gen-3 video generation...');
  
  try {
    // Convert data URL to just base64
    const base64Data = image.split(',')[1];
    
    // Create generation request
    const response = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        prompt_image: base64Data,
        prompt_text: instructions,
        duration: 5, // 5 seconds
        ratio: format.includes('16:9') ? '16:9' : format.includes('9:16') ? '9:16' : '1:1',
        watermark: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ RunwayML API error:', error);
      
      return new Response(JSON.stringify({
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Frontend expects 'video' field first
        error: `RunwayML API error: ${response.status}`,
        details: error,
        isDemoVideo: true,
        demoMessage: 'RunwayML API failed, using demo video'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const result = await response.json();
    const taskId = result.id;
    
    console.log(`⏳ RunwayML task started: ${taskId}`);
    
    // Return immediately with job info since polling would timeout
    return new Response(JSON.stringify({
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      generationId: taskId,
      isDemoVideo: true,
      demoMessage: `RunwayML generation started (ID: ${taskId}). Check dashboard for result.`,
      metadata: {
        provider: "RunwayML Gen-3",
        status: "processing"
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('💥 RunwayML generation error:', error);
    return new Response(JSON.stringify({
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Frontend expects 'video' field first
      error: 'RunwayML failed',
      isDemoVideo: true
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

async function generateWithStableVideo(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement Stable Video Diffusion API integration
  console.log('🚀 Stable Video integration not yet implemented');
  return new Response(JSON.stringify({
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Frontend expects 'video' field first
    error: 'Stable Video integration coming soon',
    isDemoVideo: true
  }), {
    status: 200,
    headers: corsHeaders
  });
}

async function generateWithPika(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  // TODO: Implement Pika Labs API integration
  console.log('🚀 Pika Labs integration not yet implemented');
  return new Response(JSON.stringify({
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Frontend expects 'video' field first
    error: 'Pika Labs integration coming soon',
    isDemoVideo: true
  }), {
    status: 200,
    headers: corsHeaders
  });
}

async function generateWithLuma(apiKey: string, image: string, instructions: string, prompt: string, format: string, movement: string, sfx: string): Promise<Response> {
  console.log('🚀 Starting Luma AI Dream Machine video generation...');
  
  try {
    // Try with the most basic configuration that should work with free tier
    console.log('📝 Using simple text-to-video generation');
    
    // Try the simplest possible request first - matching Luma docs exactly
    const basicRequest = {
      model: 'ray-2', // Using ray-2 as shown in docs (more recent than ray-1-6)
      prompt: instructions.substring(0, 500), // Keep it shorter to avoid issues
      resolution: '720p', // Adding resolution as shown in docs
      duration: '5s', // Adding duration as shown in docs
      aspect_ratio: format.includes('16:9') ? '16:9' : format.includes('9:16') ? '9:16' : '1:1',
      loop: false
    };
    
    console.log('� Luma request:', JSON.stringify(basicRequest, null, 2));
    
    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(basicRequest)
    });

    console.log('📡 Luma API response status:', response.status);
    console.log('📡 Luma API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Luma AI API error:', response.status, errorText);
      
      // Try to parse error details
      let errorDetail = 'Unknown error';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorJson.message || errorText;
      } catch (e) {
        errorDetail = errorText;
      }
      
      const errorResponse = {
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        error: `Luma AI API error: ${response.status}`,
        details: errorText,
        message: `API Error: ${errorDetail}. This might be an API key or account limitation issue.`,
        isDemoVideo: true,
        demoMessage: 'Luma AI API failed, falling back to demo video',
        metadata: {
          generationType: "luma-error-fallback",
          requestSent: basicRequest,
          responseStatus: response.status
        }
      };
      
      console.log('🔄 Returning error response:', JSON.stringify(errorResponse, null, 2));
      
      return new Response(JSON.stringify(errorResponse), {
        status: 200, // Return 200 to avoid frontend error handling
        headers: corsHeaders
      });
    }

    const result = await response.json();
    console.log('✅ Luma API success response:', JSON.stringify(result, null, 2));
    
    const generationId = result.id;
    
    console.log(`⏳ Luma AI generation started: ${generationId}`);
    
    return new Response(JSON.stringify({
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Temporary demo video
      generationId: generationId,
      instructions: instructions,
      prompt: prompt,
      isDemoVideo: true, 
      demoMessage: `✅ REAL video generation started with Luma AI! (ID: ${generationId}). Due to processing time (2-4 minutes), showing demo video. Check your Luma AI dashboard for the actual result.`,
      metadata: {
        duration: "5 seconds",
        format: format,
        movement: movement,
        sfx: sfx || "Generated by Luma AI",
        generationType: "luma-dream-machine-success",
        provider: "Luma AI Dream Machine",
        status: "processing",
        lumaJobId: generationId,
        actualApiCall: true
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('💥 Luma AI generation error:', error);
    
    return new Response(JSON.stringify({
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      error: error instanceof Error ? error.message : 'Unknown Luma AI error',
      message: 'Failed to start video generation with Luma AI',
      isDemoVideo: true,
      demoMessage: 'Luma AI failed, using demo video instead',
      metadata: {
        generationType: "luma-error-fallback"
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Handle GET request for status checking
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return new Response(JSON.stringify({
        error: 'Missing jobId parameter'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('🔍 Checking status for job:', jobId);
    
    // Check Luma AI job status
    const lumaApiKey = Deno.env.get('LUMA_API_KEY');
    if (!lumaApiKey) {
      return new Response(JSON.stringify({
        error: 'Missing LUMA_API_KEY secret'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      const statusResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lumaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        console.error('❌ Luma status check failed:', statusResponse.status);
        return new Response(JSON.stringify({
          error: 'Failed to check job status',
          status: 'unknown'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      const statusData = await statusResponse.json();
      console.log('📊 Job status data:', JSON.stringify(statusData, null, 2));

      // Extract video URL properly from Luma AI response
      let videoUrl = null;
      if (statusData.video?.url) {
        videoUrl = statusData.video.url;
      } else if (statusData.video?.download_url) {
        videoUrl = statusData.video.download_url;
      } else if (statusData.assets?.video) {
        videoUrl = statusData.assets.video;
      }

      console.log('🎥 Extracted video URL:', videoUrl);

      return new Response(JSON.stringify({
        jobId: jobId,
        status: statusData.state || 'unknown',
        videoUrl: videoUrl,
        progress: statusData.progress || null,
        metadata: statusData
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('💥 Error checking job status:', error);
      return new Response(JSON.stringify({
        error: 'Failed to check job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Handle POST request for video generation (existing logic)
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
    let styleSummary = '';
    let positiveMods = '';
    let negativeMods = '';
    
    try {
      const { data: profile } = await supabase
        .from('brand_training_profiles')
        .select('style_summary, prompt_modifiers, negative_modifiers')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profile) {
        styleSummary = profile.style_summary || '';
        positiveMods = profile.prompt_modifiers || '';
        negativeMods = profile.negative_modifiers || '';
        console.log('✅ Loaded brand profile for video generation');
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

Video specifications:
- Format: ${sizeHint}
- Duration: 7 seconds
- Movement: ${movement_description}${sfxHint}

Brand style summary (optional): ${styleSummary}
Positive modifiers to include: ${positiveMods}
Negative modifiers to avoid: ${negativeMods}

User request: ${prompt}

Requirements:
- Smooth, cinematic camera movements
- Professional lighting and color grading
- Cohesive luxury hotel/lifestyle aesthetic
- No abrupt cuts or jarring transitions`;

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
4. Duration and pacing
5. Audio/SFX recommendations

Format your response as a structured video generation guide.`
              },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    console.log('📡 Google API response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Google API error:', response.status, errText);
      
      return new Response(JSON.stringify({
        error: 'Video generation service temporarily unavailable',
        message: 'The video generation service is currently being updated. Please try again later.',
        details: errText,
        status: response.status
      }), {
        status: 503,
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

    console.log('🔍 Checking available API keys:');
    console.log(`   - RUNWAY_API_KEY: ${runwayApiKey ? '✅ Available' : '❌ Not set'}`);
    console.log(`   - STABLE_VIDEO_API_KEY: ${stableVideoApiKey ? '✅ Available' : '❌ Not set'}`);
    console.log(`   - PIKA_API_KEY: ${pikaApiKey ? '✅ Available' : '❌ Not set'}`);
    console.log(`   - LUMA_API_KEY: ${lumaApiKey ? '✅ Available' : '❌ Not set'}`);
    
    // Debug: Show first few characters of API key if it exists
    if (lumaApiKey) {
      console.log(`🔑 LUMA_API_KEY found: ${lumaApiKey.substring(0, 8)}...`);
    } else {
      console.log(`❌ LUMA_API_KEY is null/undefined - check Supabase secrets and redeploy function`);
    }

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