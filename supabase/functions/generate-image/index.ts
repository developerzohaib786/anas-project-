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
    const { prompt, aspect_ratio } = await req.json();
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

    const finalPrompt = `Create a high-end hotel marketing photograph that fits Nino's premium aesthetic.\n\nUser request:\n${prompt}\n\nHotel style summary:\n${styleSummary}\n\nPositive style modifiers to include:\n${positiveMods}\n\nNegative style modifiers to avoid (do NOT include):\n${negativeMods}${arHint}\n\nPhotorealistic, professional lighting, correct perspective, cohesive color palette, detailed textures.`;

    console.log('🎨 Final prompt prepared');
    
    const apiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
    if (!apiKey) {
      console.error('❌ Missing GOOGLE_STUDIO_API_KEY');
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_STUDIO_API_KEY secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔑 API key found, calling Google AI Studio...');

    // Call Google AI Studio image generation (Gemini 2.5 Flash Image Preview)
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
                { text: finalPrompt },
              ],
            },
          ],
        }),
      }
    );

    console.log('📡 Google API response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Google API error:', response.status, errText);
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
    const imgPart = parts.find((p: any) => p.inline_data && p.inline_data.data);

    if (!imgPart) {
      console.error('❌ No inline_data in response:', JSON.stringify(ai, null, 2));
      return new Response(
        JSON.stringify({ error: 'No image returned by model', response: ai }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mime = imgPart.inline_data.mime_type || 'image/png';
    const base64 = imgPart.inline_data.data as string;
    const dataUrl = `data:${mime};base64,${base64}`;

    console.log('✅ Image generated successfully');

    return new Response(
      JSON.stringify({ image: dataUrl, prompt: finalPrompt }),
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
