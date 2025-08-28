import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NINO_QC_GUIDELINES = `
AESTHETIC QUALITY CONTROL for NINO Hotel Photography

WE LIKE (High Quality):
- Clean, minimal compositions with intentional negative space
- Warm, natural lighting (golden hour, soft morning light)
- Muted, sophisticated color palettes (whites, creams, soft earth tones)
- Sharp focus on architectural details and textures
- Candid moments without posed subjects
- Professional interior styling with thoughtful placement
- Authentic hospitality moments (no forced smiles)
- High-end materials and finishes prominently featured
- Serene, peaceful atmospheres
- Well-balanced exposure without harsh shadows

WE DO NOT LIKE (Should be Flagged):
- People with visible faces, especially smiling directly at camera
- Oversaturated, artificial colors
- Cluttered compositions or messy backgrounds
- Poor lighting (harsh shadows, overexposure, underexposure)
- Blurry or low-resolution images
- Outdated or cheap-looking furnishings
- Tacky decorations or gaudy elements
- Images that feel staged or artificial
- Poor framing or unprofessional angles
- Distracting elements in the background

FLAGGING CRITERIA:
Rate each image 1-5 (5 = perfect for training, 1 = definitely exclude)
Flag (exclude) any image scoring 2 or below.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { training_job_id, brand_asset_id, storage_path, tags } = await req.json();

    if (!training_job_id || !brand_asset_id || !storage_path) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing asset: ${brand_asset_id} for training job: ${training_job_id}`);

    // Get public URL for the image
    const { data: urlData } = supabaseClient.storage
      .from('brand-assets')
      .getPublicUrl(storage_path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for asset');
    }

    const imageUrl = urlData.publicUrl;
    console.log(`Analyzing image: ${imageUrl}`);

    // Prepare analysis prompt
    const analysisPrompt = `${NINO_QC_GUIDELINES}

Please analyze this hotel image and provide:
1. Quality score (1-5, where 5 = perfect for training Nino's aesthetic)
2. Should this image be flagged/excluded? (true/false)
3. Specific reasons if flagged
4. Brief aesthetic notes

Categories this image represents: ${tags?.join(', ') || 'General'}

Respond in JSON format:
{
  "quality_score": number,
  "is_flagged": boolean,
  "flagged_reasons": ["reason1", "reason2"],
  "aesthetic_notes": "brief description",
  "category_fit": "how well it represents the categories"
}`;

    // Call Google AI Studio for analysis
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GOOGLE_STUDIO_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: analysisPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: await getImageAsBase64(imageUrl)
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google AI Studio API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      throw new Error('No analysis received from AI');
    }

    let analysisResult;
    try {
      // Try to parse JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if JSON parsing fails
        analysisResult = {
          quality_score: 3,
          is_flagged: false,
          flagged_reasons: [],
          aesthetic_notes: analysisText.substring(0, 200),
          category_fit: "Analysis completed"
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysisResult = {
        quality_score: 3,
        is_flagged: false,
        flagged_reasons: [],
        aesthetic_notes: "Analysis completed with fallback",
        category_fit: "Standard"
      };
    }

    // Store analysis result
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('asset_analysis')
      .insert({
        training_job_id,
        brand_asset_id,
        analysis_result: analysisResult,
        is_flagged: analysisResult.is_flagged || false,
        flagged_reasons: analysisResult.flagged_reasons || [],
        quality_score: analysisResult.quality_score || 3,
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error storing analysis:', analysisError);
      throw new Error('Failed to store analysis result');
    }

    console.log(`Analysis completed for asset ${brand_asset_id}. Flagged: ${analysisResult.is_flagged}`);

    return new Response(JSON.stringify({
      analysis_id: analysis.id,
      is_flagged: analysisResult.is_flagged,
      quality_score: analysisResult.quality_score,
      analysis_result: analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-assets:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}