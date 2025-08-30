import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Generate image request received');
    const { prompt, aspect_ratio, images } = await req.json();
    console.log('📝 Prompt:', prompt);
    console.log('📐 Aspect ratio:', aspect_ratio);

    if (!prompt || typeof prompt !== 'string') {
      console.error('❌ Invalid prompt:', prompt);
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create a client scoped to the end-user (RLS enforced)
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
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
        console.log('✅ Loaded brand profile');
      } else {
        console.log('ℹ️ No active brand profile found');
      }
    } catch (profileError) {
      console.warn('⚠️ Could not load brand profile:', profileError);
    }

    const arHint = aspect_ratio ? `\nAspect ratio: ${aspect_ratio}.` : '';

    // Handle reference images if provided
    let referenceImageContext = '';
    if (images && images.length > 0) {
      referenceImageContext = `\n\nREFERENCE IMAGES PROVIDED (${images.length} images):
- User has uploaded ${images.length} reference image(s) to guide the generation
- Incorporate visual elements, composition, lighting, or styling cues from these references
- Maintain the Nino Style Guide while drawing inspiration from the reference materials
- If the user mentions changing specific elements (like "change the food on the table"), use the reference as the base composition and modify accordingly`;
    }

    const NINO_STYLE_GUIDE = `Nino Style Guide — ALWAYS APPLY unless user explicitly opts out:
- Shadows: deep, rich, detailed; use to add drama and cinematic depth.
- Dutch angles: slight tilt for editorial energy; avoid static straight-on shots.
- Reflections: use water, glass, mirrors to layer and add intrigue.
- Textures: emphasize tactile detail (rain, sand, snow, ripples, stone, fabric).
- Symmetry & balance: aim for natural balance; not perfectly sterile symmetry.
- Blurred subjects: tasteful motion blur/soft focus for candid, in-the-moment feel.
- Not overly staged: natural, editorial/documentary scenes; avoid posed/commercial look.
- Mixed perspectives: low/high angles, shoot-throughs, foreground elements.
- Open/negative space: breathing room (sky, water, tabletops, landscape) for luxury calm.
- Layering: foreground/midground/background for cinematic depth.
- Flash: on-camera flash at night for raw, high-fashion editorial energy when appropriate.
- Film-like grain: tactile 35mm feel (not digital noise).
- Rich contrast: deep blacks, strong highlights; never washed out.
- Golden warmth: warm highlights (sun/candles) for timeless luxury.
- Cool shadows: subtle cool green/blue shadow tints for contrast with warm highlights.
- Muted saturation: earthy, sun-soaked, elegant; avoid touristy brightness.
- Halation/glow: soft glow around light sources (sunset, candles, reflections).
- Lifestyle over portraiture: capture moments and actions versus posed faces.`;

    const finalPrompt = `Create a photorealistic, cinematic, high-end editorial hotel/lifestyle image that strictly follows the Nino Style Guide.\n\n${NINO_STYLE_GUIDE}${referenceImageContext}\n\nUser request (integrate while keeping the style guide primary):\n${prompt}${arHint}\n\nBrand style summary (optional):\n${styleSummary}\n\nPositive modifiers to include:\n${positiveMods}\n\nNegative modifiers to avoid (do NOT include):\n${negativeMods}\n\nRequirements:\n- Correct perspective and professional lighting\n- Cohesive color palette\n- Detailed, tactile textures\n- If conflict arises, prefer the Nino style guide over literal prompt unless user explicitly opts out.`;

    console.log('🎨 Final prompt prepared with Nino style guide');
    
    const apiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
    if (!apiKey) {
      console.error('❌ Missing GOOGLE_STUDIO_API_KEY');
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_STUDIO_API_KEY secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔑 API key found, calling Google AI Studio...');

    // Use Gemini 2.5 Flash Image Preview via generateContent (AI Studio)
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: finalPrompt }
              ]
            }
          ]
        }),
      }
    );

    console.log('📡 Google API response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Google API error:', response.status, errText);
      
      // If the Imagen model fails, try a different approach
      if (response.status === 404 || response.status === 400) {
        console.log('🔄 Trying alternative approach with text generation...');
        
        // Return a simple placeholder for now
        return new Response(
          JSON.stringify({ 
            error: 'Image generation temporarily unavailable',
            message: 'The image generation service is currently being updated. Please try again later.',
            details: errText,
            status: response.status 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Image generation failed', 
          details: errText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ai = await response.json();
    console.log('📦 Google API response received');
    
    const parts = ai?.candidates?.[0]?.content?.parts || [];
    // Support both snake_case and camelCase variants just in case
    const imgPart = parts.find((p: any) =>
      (p.inline_data && p.inline_data.data) || (p.inlineData && p.inlineData.data)
    );

    if (!imgPart) {
      console.error('❌ No inline image data in response:', JSON.stringify(ai, null, 2));
      return new Response(
        JSON.stringify({ error: 'No image returned by model', response: ai }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mime =
      imgPart.inline_data?.mime_type ||
      imgPart.inlineData?.mimeType ||
      'image/png';
    const base64 =
      imgPart.inline_data?.data ||
      imgPart.inlineData?.data;

    console.log('✅ Image generated successfully');
    return new Response(
      JSON.stringify({ image: `data:${mime};base64,${base64}`, prompt: finalPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('💥 Generate-image error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unexpected error',
        stack: error?.stack,
        name: error?.name 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
