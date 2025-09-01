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
    console.log('🖼️ Images received:', images ? images.length : 0, 'images');
    if (images && images.length > 0) {
      console.log('📄 First image data type:', typeof images[0].data);
      console.log('📄 First image data preview:', images[0].data?.substring(0, 50) + '...');
    }

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
    let imageParts = [];
    
    if (images && images.length > 0) {
      referenceImageContext = `\n\nREFERENCE IMAGES PROVIDED (${images.length} images):
- User has uploaded ${images.length} reference image(s) to guide the generation
- Incorporate visual elements, composition, lighting, or styling cues from these references
- Maintain the Nino Style Guide while drawing inspiration from the reference materials
- If the user mentions changing specific elements (like "change the food on the table"), use the reference as the base composition and modify accordingly`;
      
      // Convert images to the format expected by Gemini
      images.forEach((img, index) => {
        if (img.data) {
          // Extract base64 data from data URL (format: "data:image/png;base64,base64data")
          const base64Data = img.data.split(',')[1];
          const mimeType = img.data.split(';')[0].split(':')[1];
          
          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      });
    }

    // Transform user-friendly descriptions into technical photography directions
    const STYLE_TRANSFORMATIONS = {
      'commercial': 'Professional commercial photography with perfect lighting, marketing-ready composition, high-end hospitality aesthetic, clean and sophisticated styling',
      'luxury': 'Ultra-luxurious high-end photography with premium lighting, sophisticated composition, elegant styling, aspirational mood, five-star hotel quality',
      'editorial': 'Editorial-style hospitality photography with dramatic lighting, artistic composition, sophisticated styling, magazine-quality aesthetic',
      'elegant': 'Sophisticated elegant photography with refined lighting, graceful composition, upscale styling, premium hospitality aesthetic',
      'sophisticated': 'Professional sophisticated photography with refined lighting, clean composition, high-end styling, luxury hospitality standard',
      'premium': 'Premium hospitality photography with luxury lighting, professional composition, high-end styling, five-star quality aesthetic',
      'upscale': 'Upscale hospitality photography with premium lighting, sophisticated composition, elegant styling, luxury hotel standard',
      'refined': 'Refined hospitality photography with sophisticated lighting, elegant composition, premium styling, upscale aesthetic',
      'cool': 'Cool, modern hospitality photography with contemporary lighting, sleek composition, minimalist styling, boutique hotel aesthetic',
      'make it commercial': 'Transform into professional commercial photography with perfect lighting, marketing-ready composition, high-end hospitality aesthetic',
      'make it luxury': 'Transform into ultra-luxurious photography with premium lighting, sophisticated composition, five-star hotel quality aesthetic',
      'make it editorial': 'Transform into editorial-style photography with dramatic lighting, artistic composition, magazine-quality aesthetic'
    };

    // Function to detect if this is a scene capture request
    const isSceneCaptureRequest = (prompt: string, hasImages: boolean): boolean => {
      if (!hasImages) return false;
      
      const sceneCaptureKeywords = [
        'make it', 'transform', 'turn this', 'enhance', 'improve', 'upgrade',
        'commercial', 'luxury', 'editorial', 'professional', 'high-end',
        'sophisticated', 'elegant', 'premium', 'upscale', 'refined', 'cool'
      ];
      
      const lowerPrompt = prompt.toLowerCase();
      return sceneCaptureKeywords.some(keyword => lowerPrompt.includes(keyword));
    };

    // Enhanced Nino Style Guide for scene capture
    const NINO_STYLE_GUIDE = `Nino Style Guide — LUXURY HOSPITALITY PHOTOGRAPHY TRANSFORMATION:

SCENE CAPTURE MODE - Transform iPhone snapshots into luxury editorial photography:

TECHNICAL ENHANCEMENT:
- Ultra high-resolution output with professional clarity
- Perfect exposure balance with rich shadows and clean highlights  
- Professional color grading with luxury hospitality aesthetics
- Enhanced depth of field and professional focus
- Commercial-grade image quality and sharpness

VISUAL TRANSFORMATION:
- Warm, inviting color palette with sophisticated tone mapping
- Rich, saturated colors without oversaturation
- Perfect white balance for hospitality environments
- Professional lighting enhancement that adds atmosphere
- Clean, uncluttered compositions with elegant framing

HOSPITALITY LUXURY AESTHETIC:
- Five-star hotel photography quality
- Marketing-ready commercial appeal
- Professional hospitality industry standards
- Clean, sophisticated brand representation
- Editorial magazine-quality finish

COMPOSITION REFINEMENT:
- Professional framing and rule of thirds application
- Strategic use of negative space for luxury feel
- Enhanced staging and arrangement
- Cinematic depth with foreground/midground/background layers
- Marketing-optimized composition for hospitality use

LIGHTING ENHANCEMENT:
- Professional hospitality lighting upgrade
- Soft, even illumination with strategic accent lighting
- Natural-looking enhancement that feels authentic
- Perfect contrast ratios for luxury appeal
- Cinematic mood and atmosphere

STYLE ELEMENTS:
- Editorial energy with slight dutch angles when appropriate
- Rich, detailed shadows for drama and depth
- Tasteful reflections and layering for visual intrigue  
- Film-like quality with subtle grain texture
- Golden warmth in highlights, cool shadow tints
- Muted, elegant saturation avoiding touristy brightness
- Lifestyle documentary feel over posed commercial look

Transform the reference image while maintaining its core subject and composition, but elevate it to luxury editorial hospitality photography standards.`;

    // Detect if this is a scene capture transformation request
    const isSceneCapture = isSceneCaptureRequest(prompt, images && images.length > 0);
    
    // Enhance prompt with style transformations for user-friendly language
    let enhancedPrompt = prompt;
    if (isSceneCapture) {
      console.log('🎯 Scene capture mode detected');
      const lowerPrompt = prompt.toLowerCase();
      
      // Find matching style transformation
      const matchingStyle = Object.keys(STYLE_TRANSFORMATIONS).find(key => 
        lowerPrompt.includes(key.toLowerCase())
      );
      
      if (matchingStyle) {
        const technicalDirection = STYLE_TRANSFORMATIONS[matchingStyle];
        enhancedPrompt = `${technicalDirection}. ${prompt}`;
        console.log('🎨 Applied style transformation for:', matchingStyle);
      }
    }

    // Build the final prompt based on whether this is scene capture or text-to-image
    const finalPrompt = isSceneCapture 
      ? `SCENE CAPTURE TRANSFORMATION - Transform the uploaded iPhone photo into luxury editorial hospitality photography.

${NINO_STYLE_GUIDE}

TRANSFORMATION INSTRUCTIONS:
- Analyze the uploaded reference image(s) for composition, subjects, and setting
- Maintain the core elements and composition of the original photo
- Transform the lighting, styling, and overall aesthetic to match luxury hospitality standards
- Apply professional photography techniques to elevate the image quality
- Keep the same subjects and general layout but enhance everything to editorial quality

${referenceImageContext}

User's style request: ${enhancedPrompt}${arHint}

Brand style summary (apply if relevant): ${styleSummary}
Positive modifiers: ${positiveMods}
Negative modifiers to avoid: ${negativeMods}

Transform this iPhone snapshot into a stunning, luxury editorial hospitality photograph while preserving its core composition and subjects.`
      : `Create a photorealistic, cinematic, high-end editorial hotel/lifestyle image that strictly follows the Nino Style Guide.

${NINO_STYLE_GUIDE}${referenceImageContext}

User request (integrate while keeping the style guide primary): ${enhancedPrompt}${arHint}

Brand style summary (optional): ${styleSummary}
Positive modifiers to include: ${positiveMods}
Negative modifiers to avoid (do NOT include): ${negativeMods}

Requirements:
- Correct perspective and professional lighting
- Cohesive color palette
- Detailed, tactile textures
- If conflict arises, prefer the Nino style guide over literal prompt unless user explicitly opts out.`;

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
                { text: finalPrompt },
                ...imageParts
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
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
