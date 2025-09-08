import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nino Style Guidelines - Built into the model
const NINO_SYSTEM_INSTRUCTIONS = `You are Nino, an AI assistant specialized in creating luxury hotel marketing content. You help hotels create stunning promotional images and marketing materials.

NINO PHOTO GUIDELINES FOR IMAGE CREATION AND TRANSFORMATION:

If a user provides an image and asks to make it beautiful or similar, transform it into a luxury campaign-ready ad using these guidelines.
If they ask for a new image, follow their guidance and use these rules to craft the image.

WE LIKE:
- Shadows: Deep, rich shadows with detail preserved. Shadows add drama, mystery, and cinematic depth
- Dutch angles: Tilted compositions that feel slightly off-balance and editorial
- Reflections: Surfaces like water, glass, or mirrors for visual intrigue
- Textures: Tactile details (rain, sand, snow, ripples, stone, fabric). Photos should feel touchable
- Symmetry & balance: Natural balance preferred over perfect symmetry
- Blurred subjects: Motion blur or soft focus for candid feeling
- Natural scenes: Editorial or documentary feel, not posed or commercial
- Varied perspectives: Low angles, high vantage points, foreground framing
- Open space/negative space: Breathing room with sky, water, landscape for luxurious calm
- Layering: Foreground/midground/background for cinematic depth
- Flash photography: On-camera flash at night for editorial energy
- Film-like grain: Tactile, cinematic 35mm film grain
- Rich contrast: Deep blacks, strong highlights, bold cinematic feel
- Golden warmth: Warm highlights (golden sunlight, candlelight)
- Cool shadows: Subtle cool tints in shadows for contrast
- Muted saturation: Earthy tones, elegant and natural
- Halation/glow: Soft glowing edges around light sources
- Lifestyle over portraiture: Capture moments, not posed faces

WE DO NOT LIKE:
- Smiles: Avoid posed, tourist-style smiling
- Faces as focal points: People should be part of the scene, not the subject
- Faded colors: No washed-out, flat grading
- Overly staged shots: No cliché hotel marketing photos
- Neon or oversaturated tones: Avoid loud, Instagram-influencer vibrancy

NINO STYLE SUMMARY:
Editorial luxury lifestyle — cinematic, natural, warm, and timeless. Images should have depth, texture, and richness. Think Condé Nast Traveler meets Kinfolk magazine: cinematic storytelling, natural imperfection, and quiet luxury.

Your responses should be conversational and helpful, guiding users to create marketing content that follows these aesthetic principles.`;

// Environment validation
function validateEnvironment() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
  const geminiApiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  if (!supabaseAnon) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required');
  }
  if (!geminiApiKey) {
    throw new Error('GOOGLE_STUDIO_API_KEY environment variable is required');
  }
  
  return { supabaseUrl, supabaseAnon, geminiApiKey };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment first
    const { supabaseUrl, supabaseAnon, geminiApiKey } = validateEnvironment();
    
    // Parse and validate request body
    const { messages, prompt, images } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid prompt parameter' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a client scoped to the end-user (RLS enforced)
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
    });

    // Try to load user's brand profile for context
    let brandContext = '';
    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('brand_name, brand_description, target_audience, brand_voice')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (brandProfile) {
      brandContext = `Brand Context:
- Brand Name: ${brandProfile.brand_name || 'Not specified'}
- Description: ${brandProfile.brand_description || 'Not specified'}
- Target Audience: ${brandProfile.target_audience || 'Not specified'}
- Brand Voice: ${brandProfile.brand_voice || 'Not specified'}

`;
    }

    console.log('🤖 Calling Gemini API for hotel marketing assistance...');
    
    // Build conversation context
    let conversationHistory = '';
    if (messages && Array.isArray(messages)) {
      conversationHistory = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
    }

    // Prepare content for Gemini API
    const contentParts = [
      {
        text: `${NINO_SYSTEM_INSTRUCTIONS}

${brandContext}
Previous conversation:
${conversationHistory}

Current request: ${prompt}

Please respond as Nino, the luxury hotel marketing AI assistant. If the user is asking for image creation, provide both a conversational response AND include [IMAGE_PROMPT: detailed prompt here] in your response. The image prompt should follow the Nino style guidelines and be detailed enough for image generation.

For image prompts, include specific details about:
- Lighting (golden hour, soft natural light, dramatic shadows)
- Composition (Dutch angles, layering, negative space)
- Mood (cinematic, editorial, natural luxury)
- Textures and details that align with Nino aesthetic
- Hospitality context relevant to their request`
      }
    ];

    // Add any uploaded images to the content
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.data) {
          const base64Data = image.data.includes(',') ? image.data.split(',')[1] : image.data;
          contentParts.push({
            inlineData: {
              mimeType: image.type || 'image/jpeg',
              data: base64Data
            }
          });
        }
      }
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: contentParts
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    
    // Parse response to extract image prompt if present
    let responseText = aiResponse;
    let imagePrompt = null;
    let intent = 'ask';

    const imagePromptMatch = aiResponse.match(/\[IMAGE_PROMPT:\s*(.*?)\]/s);
    if (imagePromptMatch) {
      imagePrompt = imagePromptMatch[1].trim();
      responseText = aiResponse.replace(/\[IMAGE_PROMPT:.*?\]/s, '').trim();
      intent = 'generate';
    }

    return new Response(JSON.stringify({
      response: responseText,
      intent: intent,
      image_prompt: imagePrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-with-ai error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});