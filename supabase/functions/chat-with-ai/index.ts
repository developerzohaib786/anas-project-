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
    const { messages, prompt, images } = await req.json();


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
      console.error('❌ Missing GOOGLE_STUDIO_API_KEY');
      throw new Error('Missing GOOGLE_STUDIO_API_KEY secret');
    }

    // Convert message history to Google AI format
    const conversationHistory = messages?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || [];

    // Prepare inline image parts for the current user prompt
    const imageParts = [] as any[];
    if (images && images.length > 0) {
      images.forEach((img: any) => {
        if (img.data) {
          const base64Data = img.data.split(',')[1];
          const mimeType = img.data.split(';')[0].split(':')[1];
          imageParts.push({ inlineData: { data: base64Data, mimeType } });
        }
      });
    }

    // Add the current user prompt, including any attached images as parts
    conversationHistory.push({
      role: 'user',
      parts: [ { text: prompt }, ...imageParts ]
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

Important behavior rules:
- This app can generate images directly. Never instruct the user to copy prompts into external tools.
- If images are attached, you CAN see and reference them. Never say you cannot view images; acknowledge and use them in your reasoning.
- When you have enough detail to proceed, set intent to "generate" and produce a single, photorealistic marketing image description in image_prompt.
- Otherwise, set intent to "ask" and ask one concise clarifying question.

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
      console.error('❌ Google AI API error (chat-with-ai):', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI response failed', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('🧠 Chat model responded');
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