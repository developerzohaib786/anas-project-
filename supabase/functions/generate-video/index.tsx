import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
// Helper function to generate with Google Veo 3 (simulated)
async function generateWithGoogleVeo3(apiKey, image, prompt) {
  console.log('🚀 Starting Google Veo 3 video generation...');
  try {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    // Use Gemini for video generation guidance
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create a detailed video generation plan for: ${prompt}

Please provide:
1. Camera movement descriptions
2. Lighting setup requirements  
3. Scene composition details
4. Technical specifications
5. Visual effects needed

This will be used for professional video generation.`
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
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Google API error:', error);
      throw new Error(`Google API error: ${response.status}`);
    }
    const result = await response.json();
    const videoInstructions = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Video generation instructions created';
    // Simulate video generation (Google Veo 3 not publicly available yet)
    const generationId = `veo3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      generationId: generationId,
      status: 'processing',
      message: 'Video analysis completed, generation queued',
      instructions: videoInstructions,
      metadata: {
        provider: "Google Veo 3 (Simulation)",
        status: "processing",
        duration: "5 seconds",
        prompt: prompt,
        note: "Google Veo 3 is not yet publicly available. This is a simulation using advanced AI analysis."
      }
    };
  } catch (error) {
    console.error('💥 Google Veo 3 generation error:', error);
    throw error;
  }
}
// Helper function to generate with Luma AI
async function generateWithLuma(apiKey, image, prompt) {
  console.log('🚀 Starting Luma AI Dream Machine video generation...');
  try {
    const simplifiedPrompt = `${prompt}. Professional cinematography with luxury aesthetic, smooth camera work, high quality lighting.`;
    let imageData = null;
    if (image && image.includes(',')) {
      imageData = image.split(',')[1];
    }
    const lumaRequest = {
      model: "ray-2",
      prompt: simplifiedPrompt,
      aspect_ratio: '16:9'
    };
    if (imageData) {
      try {
        console.log('🖼️ Uploading image to Luma AI...');
        // Deno-compatible base64 decoder
        function base64ToUint8Array(base64) {
          const binaryString = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for(let i = 0; i < len; i++){
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        }
        const bytes = base64ToUint8Array(imageData);
        // Ensure bytes is a plain Uint8Array for Blob
        const plainBytes = new Uint8Array(bytes);
        const uploadResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations/file_upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: new Blob([
            plainBytes
          ])
        });
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          lumaRequest.keyframes = {
            frame0: {
              type: "image",
              url: uploadResult.url || uploadResult.presigned_url || uploadResult.file_url
            }
          };
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload failed, using text-to-video mode');
      }
    }
    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lumaRequest)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Luma AI API error:', response.status, errorText);
      throw new Error(`Luma AI API error: ${response.status}`);
    }
    const result = await response.json();
    const generationId = result.id;
    return {
      generationId: generationId,
      status: 'started',
      message: 'Video generation started successfully',
      metadata: {
        provider: "Luma AI Dream Machine",
        status: "processing",
        lumaJobId: generationId
      }
    };
  } catch (error) {
    console.error('💥 Luma AI generation error:', error);
    throw error;
  }
}
serve(async (req)=>{
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  try {
    // Handle GET request for status checking
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const jobId = url.searchParams.get('jobId');
      const provider = url.searchParams.get('provider') || 'veo3';
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
      console.log('🔍 Checking status for job:', jobId, 'provider:', provider);
      // Simulate Google Veo 3 status checking
      if (provider === 'veo3' || provider === 'google' || provider === 'google-veo3') {
        if (jobId.startsWith('veo3-')) {
          const timestamp = parseInt(jobId.split('-')[1]);
          const currentTime = Date.now();
          const elapsedTime = currentTime - timestamp;
          if (elapsedTime > 30000) {
            const demoVideos = [
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            ];
            const videoUrl = demoVideos[Math.floor(Math.random() * demoVideos.length)];
            return new Response(JSON.stringify({
              jobId: jobId,
              status: 'completed',
              videoUrl: videoUrl,
              progress: 100,
              metadata: {
                provider: 'Google Veo 3 (Simulation)',
                note: 'This is a demo video. Google Veo 3 is not yet publicly available.',
                processingTime: `${Math.round(elapsedTime / 1000)}s`
              }
            }), {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          } else {
            const progress = Math.min(Math.round(elapsedTime / 30000 * 100), 99);
            return new Response(JSON.stringify({
              jobId: jobId,
              status: 'processing',
              videoUrl: null,
              progress: progress,
              metadata: {
                provider: 'Google Veo 3 (Simulation)',
                estimatedTimeRemaining: `${Math.max(30 - Math.round(elapsedTime / 1000), 0)}s`
              }
            }), {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
        }
      }
      // Handle Luma AI status checking
      if (provider === 'luma') {
        const lumaApiKey = globalThis.Deno?.env.get('LUMA_API_KEY');
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
          let videoUrl = null;
          if (statusData.video?.url) {
            videoUrl = statusData.video.url;
          } else if (statusData.video?.download_url) {
            videoUrl = statusData.video.download_url;
          } else if (statusData.assets?.video) {
            videoUrl = statusData.assets.video;
          }
          return new Response(JSON.stringify({
            jobId: jobId,
            status: statusData.state || 'unknown',
            videoUrl: videoUrl,
            progress: statusData.progress || null,
            metadata: statusData,
            provider: 'Luma AI'
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('💥 Error checking Luma job status:', error);
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
      return new Response(JSON.stringify({
        error: `Unsupported provider: ${provider}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Handle POST request for video generation
    if (req.method === 'POST') {
      console.log('🎬 Generate video request received');
      const { image, movement_description, sfx_description, video_size, prompt } = await req.json();
      console.log('🖼️ Image data received:', image ? 'Yes' : 'No');
      console.log('🎭 Movement description:', movement_description);
      console.log('📐 Video size:', video_size);
      if (!image || !movement_description) {
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
      // Build final prompt
      const finalPrompt = `Generate a high-quality video with ${movement_description}. ${prompt || ''} ${sfx_description ? `Audio: ${sfx_description}` : ''}`.trim();
      // Try Google Veo 3 first
      const googleApiKey = globalThis.Deno?.env.get('GOOGLE_STUDIO_API_KEY');
      if (googleApiKey) {
        console.log('🚀 Using Google Veo 3 for video generation...');
        try {
          const result = await generateWithGoogleVeo3(googleApiKey, image, finalPrompt);
          return new Response(JSON.stringify(result), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('❌ Google Veo 3 failed, trying fallback...');
        }
      }
      // Fallback to Luma AI
      const lumaApiKey = globalThis.Deno?.env.get('LUMA_API_KEY');
      if (lumaApiKey) {
        console.log('🚀 Using Luma AI for video generation...');
        try {
          const result = await generateWithLuma(lumaApiKey, image, finalPrompt);
          return new Response(JSON.stringify(result), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('❌ Luma AI failed, using demo fallback...');
        }
      }
      // Final fallback - demo video
      console.log('⚠️ No API keys found - using demo video');
      const demoVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      ];
      const selectedVideo = demoVideos[Math.floor(Math.random() * demoVideos.length)];
      return new Response(JSON.stringify({
        video: selectedVideo,
        prompt: finalPrompt,
        isDemoVideo: true,
        demoMessage: "Demo video - add GOOGLE_STUDIO_API_KEY or LUMA_API_KEY to enable real video generation",
        metadata: {
          duration: "7 seconds",
          movement: movement_description,
          generationType: "demo-fallback"
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Method not allowed
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Edge Function error:', error);
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
