import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NINO_STYLE_GUIDELINES = `
NINO BRAND AESTHETIC SYNTHESIS

Core Visual Principles:
- Understated luxury and sophisticated minimalism
- Warm, natural lighting that creates ambiance
- Clean architectural lines with thoughtful details
- Muted, sophisticated color palettes
- Authentic moments without staged artificiality
- Premium materials and finishes
- Serene, peaceful atmospheres

Training Focus:
Generate a cohesive style profile that captures the hotel's unique aesthetic while maintaining Nino's sophisticated approach to hospitality photography.
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

    const { training_job_id } = await req.json();

    if (!training_job_id) {
      return new Response(JSON.stringify({ error: 'training_job_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Finalizing training for job: ${training_job_id}`);

    // Get training job details
    const { data: trainingJob, error: jobError } = await supabaseClient
      .from('training_jobs')
      .select('*')
      .eq('id', training_job_id)
      .single();

    if (jobError || !trainingJob) {
      throw new Error('Training job not found');
    }

    // Get all non-flagged asset analyses for this training job
    const { data: analyses, error: analysisError } = await supabaseClient
      .from('asset_analysis')
      .select(`
        *,
        brand_assets:brand_asset_id (
          tags,
          description,
          title,
          storage_path
        )
      `)
      .eq('training_job_id', training_job_id)
      .eq('is_flagged', false);

    if (analysisError) {
      console.error('Error fetching analyses:', analysisError);
      throw new Error('Failed to fetch analysis data');
    }

    if (!analyses || analyses.length === 0) {
      // No suitable images for training
      await supabaseClient
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: 'No suitable images found for training after quality control',
          completed_at: new Date().toISOString()
        })
        .eq('id', training_job_id);

      return new Response(JSON.stringify({ error: 'No suitable images for training' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group analyses by category
    const categoryAnalyses = new Map<string, typeof analyses>();
    analyses.forEach(analysis => {
      const asset = analysis.brand_assets as any;
      if (asset?.tags && Array.isArray(asset.tags)) {
        asset.tags.forEach((tag: string) => {
          if (!categoryAnalyses.has(tag)) {
            categoryAnalyses.set(tag, []);
          }
          categoryAnalyses.get(tag)!.push(analysis);
        });
      }
    });

    // Calculate quality metrics
    const qualityScores = analyses.map(a => a.quality_score || 3);
    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const highQualityCount = qualityScores.filter(score => score >= 4).length;

    const qualityMetrics = {
      total_analyzed: trainingJob.total_assets,
      total_flagged: trainingJob.flagged_assets,
      total_used: analyses.length,
      average_quality_score: Math.round(averageQuality * 100) / 100,
      high_quality_percentage: Math.round((highQualityCount / analyses.length) * 100),
      categories_coverage: Array.from(categoryAnalyses.keys()),
    };

    // Prepare comprehensive prompt for style synthesis
    const categoryBreakdown = Array.from(categoryAnalyses.entries()).map(([category, catAnalyses]) => {
      const avgQuality = catAnalyses.reduce((sum, a) => sum + (a.quality_score || 3), 0) / catAnalyses.length;
      const topNotes = catAnalyses
        .filter(a => (a.quality_score || 3) >= 4)
        .map(a => a.analysis_result?.aesthetic_notes)
        .filter(Boolean)
        .slice(0, 3);

      return `${category} (${catAnalyses.length} images, avg quality: ${avgQuality.toFixed(1)}):
${topNotes.join('; ')}`;
    }).join('\n\n');

    const synthesisPrompt = `${NINO_STYLE_GUIDELINES}

HOTEL TRAINING DATA ANALYSIS:
Total Images Used: ${analyses.length}
Average Quality Score: ${averageQuality.toFixed(2)}/5
Categories Covered: ${Array.from(categoryAnalyses.keys()).join(', ')}

CATEGORY BREAKDOWN:
${categoryBreakdown}

Based on this hotel's specific aesthetic and Nino's brand guidelines, create a comprehensive style profile:

1. STYLE SUMMARY: A cohesive description of this hotel's unique aesthetic that aligns with Nino's sophisticated approach

2. PROMPT MODIFIERS: Specific keywords and phrases that should be added to generation prompts to capture this hotel's style

3. NEGATIVE MODIFIERS: Keywords to avoid that would conflict with both this hotel's aesthetic and Nino's standards

Respond in JSON format:
{
  "style_summary": "detailed description of the hotel's aesthetic",
  "prompt_modifiers": "keywords, phrases, lighting, mood, style descriptors",
  "negative_modifiers": "avoid these elements, colors, styles, moods"
}`;

    // Call Google AI Studio for style synthesis
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GOOGLE_STUDIO_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: synthesisPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google AI Studio API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const synthesisText = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!synthesisText) {
      throw new Error('No synthesis received from AI');
    }

    let synthesisResult;
    try {
      const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing synthesis response:', parseError);
      synthesisResult = {
        style_summary: "Sophisticated hotel aesthetic aligned with Nino's standards",
        prompt_modifiers: "elegant, minimal, warm lighting, natural materials, sophisticated",
        negative_modifiers: "cluttered, artificial, oversaturated, tacky, forced smiles"
      };
    }

    // Get current version number for this brand profile
    const { data: existingProfiles } = await supabaseClient
      .from('brand_training_profiles')
      .select('version')
      .eq('brand_profile_id', trainingJob.brand_profile_id)
      .order('version', { ascending: false })
      .limit(1);

    const newVersion = (existingProfiles?.[0]?.version || 0) + 1;

    // Deactivate previous profiles
    await supabaseClient
      .from('brand_training_profiles')
      .update({ is_active: false })
      .eq('brand_profile_id', trainingJob.brand_profile_id);

    // Create new training profile
    const { data: trainingProfile, error: profileError } = await supabaseClient
      .from('brand_training_profiles')
      .insert({
        brand_profile_id: trainingJob.brand_profile_id,
        training_job_id,
        user_id: trainingJob.user_id,
        version: newVersion,
        style_summary: synthesisResult.style_summary,
        prompt_modifiers: synthesisResult.prompt_modifiers,
        negative_modifiers: synthesisResult.negative_modifiers,
        categories_analyzed: Array.from(categoryAnalyses.keys()),
        total_images_used: analyses.length,
        quality_metrics: qualityMetrics,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating training profile:', profileError);
      throw new Error('Failed to create training profile');
    }

    // Mark training job as completed
    await supabaseClient
      .from('training_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', training_job_id);

    console.log(`Training finalized successfully. Profile version: ${newVersion}`);

    return new Response(JSON.stringify({
      training_profile_id: trainingProfile.id,
      version: newVersion,
      total_images_used: analyses.length,
      quality_metrics: qualityMetrics,
      style_summary: synthesisResult.style_summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in finalize-training:', error);
    
    // Mark job as failed if we have the training_job_id
    const { training_job_id } = await req.json().catch(() => ({}));
    if (training_job_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      
      await supabaseClient
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', training_job_id);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});