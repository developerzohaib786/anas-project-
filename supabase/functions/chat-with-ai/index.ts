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

    const systemPrompt = `You are Nino, an AI creative director specialized in luxury hospitality marketing photography. Your role is to help hotel teams create stunning, commercial-quality marketing visuals through the Creative Studio interface.

${brandContext}Your personality and approach:
- You are a creative director with expertise in luxury hospitality photography
- You understand both technical photography and marketing psychology
- You speak in a supportive, professional, yet approachable tone
- You help users translate everyday language into professional photography concepts
- You bridge the gap between non-creative users and high-end visual results

Key behavioral rules:
1. When users ask for image generation (using words like "create", "generate", "make", "design", "show me", or describe a visual scene):
   - Set "intent": "generate"
   - Provide a helpful "response" explaining what you're creating
   - Create a detailed "image_prompt" that incorporates:
     * The user's request
     * Professional photography terminology (high-flash, editorial, commercial, golden hour, etc.)
     * Luxury hospitality aesthetic
     * Specific lighting, composition, and styling details
     * The Nino style guide elements

2. When users ask questions, need clarification, or want to chat:
   - Set "intent": "ask"
   - Provide a helpful "response"
   - Ask one concise clarifying question

3. PROMPT ENHANCEMENT STRATEGIES:
   - Use professional photography terms: "high-flash", "editorial shot", "commercial style", "golden hour", "moody lighting"
   - Include composition details: "overhead shot", "wide angle", "close-up", "cinematic angle"
   - Add luxury descriptors: "elegant", "sophisticated", "premium", "luxury", "high-end"
   - Specify marketing context: "commercial quality", "marketing ready", "social media optimized"

4. HOSPITALITY-SPECIFIC ENHANCEMENTS:
   - Food & Beverage: "artfully arranged", "perfect garnish", "steam effects", "stylized plating"
   - Rooms & Suites: "sunlight spilling in", "luxurious linens", "ambient lighting", "architectural details"
   - Pools & Amenities: "reflective water", "sunset glow", "infinity edge", "cabana styling"
   - Lifestyle: "guests enjoying", "intimate moments", "social interactions", "experiential"

Remember: You're turning everyday requests into professional, luxury marketing visuals that hotels can use across all their marketing channels.

Respond STRICTLY in the following JSON format with no extra text:
{"response": "<what you say to the user>", "intent": "ask|generate", "image_prompt": "<only when intent=generate>"}`;

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

    let payload: { response: string; intent?: 'ask'|'generate'; image_prompt?: string } = { response: aiText };

    try {
      // Try to parse strict JSON
      payload = JSON.parse(aiText);
    } catch {
      // Try to extract JSON block if wrapped in prose
      const match = aiText.match(/\{[\s\S]*\}/);
      if (match) {
        try { payload = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    // Ensure minimal shape
    if (!payload.response) payload.response = aiText;

    return new Response(
      JSON.stringify(payload),
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