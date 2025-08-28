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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { brand_profile_id } = await req.json();

    if (!brand_profile_id) {
      return new Response(JSON.stringify({ error: 'brand_profile_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting training orchestration for brand_profile_id: ${brand_profile_id}`);

    // Get all active brand assets for this brand profile
    const { data: assets, error: assetsError } = await supabaseClient
      .from('brand_assets')
      .select('*')
      .eq('brand_profile_id', brand_profile_id)
      .eq('is_active', true);

    if (assetsError) {
      console.error('Error fetching assets:', assetsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch assets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ error: 'No assets found for training' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group assets by categories
    const categoriesMap = new Map<string, typeof assets>();
    assets.forEach(asset => {
      if (asset.tags && Array.isArray(asset.tags)) {
        asset.tags.forEach(tag => {
          if (!categoriesMap.has(tag)) {
            categoriesMap.set(tag, []);
          }
          categoriesMap.get(tag)!.push(asset);
        });
      }
    });

    const categories = Array.from(categoriesMap.keys());

    // Create training job
    const { data: trainingJob, error: jobError } = await supabaseClient
      .from('training_jobs')
      .insert({
        brand_profile_id,
        user_id: user.id,
        status: 'processing',
        total_assets: assets.length,
        categories,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating training job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create training job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Created training job: ${trainingJob.id}`);

    // Start background processing
    EdgeRuntime.waitUntil(processAssetsInBackground(supabaseClient, trainingJob.id, assets));

    return new Response(JSON.stringify({ 
      training_job_id: trainingJob.id,
      total_assets: assets.length,
      categories 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in training orchestrator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processAssetsInBackground(supabaseClient: any, trainingJobId: string, assets: any[]) {
  console.log(`Starting background processing for training job: ${trainingJobId}`);
  
  let processedCount = 0;
  let flaggedCount = 0;

  try {
    // Process assets in batches of 5
    const batchSize = 5;
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (asset) => {
        try {
          // Call analyze-assets function for individual asset
          const { data, error } = await supabaseClient.functions.invoke('analyze-assets', {
            body: { 
              training_job_id: trainingJobId,
              brand_asset_id: asset.id,
              storage_path: asset.storage_path,
              tags: asset.tags || []
            }
          });

          if (error) {
            console.error(`Error analyzing asset ${asset.id}:`, error);
          } else if (data?.is_flagged) {
            flaggedCount++;
          }

          processedCount++;

          // Update progress
          await supabaseClient
            .from('training_jobs')
            .update({ 
              processed_assets: processedCount,
              flagged_assets: flaggedCount 
            })
            .eq('id', trainingJobId);

        } catch (error) {
          console.error(`Error processing asset ${asset.id}:`, error);
          processedCount++;
        }
      }));

      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Once all assets are processed, finalize the training
    await supabaseClient.functions.invoke('finalize-training', {
      body: { training_job_id: trainingJobId }
    });

    console.log(`Completed background processing for training job: ${trainingJobId}`);

  } catch (error) {
    console.error(`Background processing error for job ${trainingJobId}:`, error);
    
    // Mark job as failed
    await supabaseClient
      .from('training_jobs')
      .update({ 
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', trainingJobId);
  }
}