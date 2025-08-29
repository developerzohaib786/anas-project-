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
    const { messages, prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
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

    const apiKey = Deno.env.get('GOOGLE_STUDIO_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GOOGLE_STUDIO_API_KEY secret');
    }

    // Convert message history to Google AI format
    const conversationHistory = messages?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || [];

    // Add the current user prompt
    conversationHistory.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const systemPrompt = `You are Nino, an expert AI assistant specializing in hotel and hospitality marketing. You help create compelling marketing content and generate high-quality promotional images for hotels, resorts, and hospitality businesses.

${brandContext}Your primary role is to:
1. Ask thoughtful questions to understand the user's hotel marketing needs
2. Provide creative suggestions for marketing content and imagery
3. Help refine image prompts for hotel photography and marketing materials
4. Offer expertise on hospitality marketing best practices

When helping with image generation:
- Ask about the type of space (lobby, rooms, dining, pools, spa, etc.)
- Inquire about the mood and style (luxury, modern, cozy, romantic, family-friendly)
- Suggest including or excluding people in scenes
- Consider lighting, time of day, and seasonal elements
- Focus on creating professional, marketing-quality image descriptions

Be conversational, helpful, and focused on creating exceptional hotel marketing content. If the user's request is complete enough for image generation, let them know you're ready to create their image.

Response should be concise and engaging, typically 1-3 sentences unless more detail is specifically needed.`;

    // Call Google AI Studio for chat
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationHistory,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google AI API error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI response failed', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const aiText = aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('No text in AI response:', JSON.stringify(aiResponse));
      return new Response(
        JSON.stringify({ error: 'No response text from AI' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ response: aiText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('chat-with-ai error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});