import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NINO_GUIDELINES = `Nino Photo Guidelines for training
We Like
- Shadows – Deep, rich shadows with detail preserved. Shadows are a feature, not a flaw. They add drama, mystery, and cinematic depth.
- Dutch angles – Tilted compositions that feel slightly off-balance and editorial, avoiding static straight-on shots.
- Reflections – Surfaces like water, glass, or mirrors used to layer and add visual intrigue.
- Textures – Emphasize tactile details (rain, sand, snow, ripples, stone, fabric). Photos should feel touchable.
- Symmetry & balance – Symmetry in architecture and framing, but not overly perfect — natural balance is preferred.
- Blurred subjects – Motion blur or soft focus for an in-the-moment, candid feeling.
- Not overly staged – Scenes should feel natural, editorial, or documentary, not posed or commercial.
- Not only eye-level angles – Mix perspectives: low angles, high vantage points, or looking through foreground elements.
- Open space / negative space – Allow breathing room with sky, water, table space, or landscape. Luxurious calm comes from space.
- Layering subjects – Frame using foreground/midground/background to create cinematic depth.
- Flash photography – On-camera flash at night for raw, high-fashion editorial energy.
- Film-like grain – Add grain that feels tactile and cinematic, like 35mm film — not digital noise.
- Rich contrast – Deep blacks, strong highlights. Contrast should feel bold and cinematic, never washed out.
- Golden warmth – Warm tones in highlights (golden sunlight, candlelight glow). Creates a timeless, editorial luxury feel.
- Cool shadows – Subtle cool (green/blue) tints in shadows for cinematic contrast with warm highlights.
- Muted saturation – Earthy tones, not overly vibrant. Sun-soaked, elegant, and natural instead of touristy bright.
- Halation / glow – Soft glowing edges around light sources (sunset, candles, reflections) for cinematic texture.
- Lifestyle over portraiture – Capture moments (serving food, walking by water, lounging by the pool) rather than posed faces.
We Do Not Like
- Smiles – Avoid posed, tourist-style smiling. We want understated emotion or candid mood.
- Faces as focal points – Faces should rarely be the subject; people are part of the scene, not the scene itself.
- Faded colors – No washed-out, flat grading. Colors should be rich, earthy, and intentional.
- Overly staged shots – No cliché hotel marketing photos (posed staff, sterile interiors, staged couples clinking glasses).
- Neon or oversaturated tones – Avoid cheap, loud, or Instagram-influencer vibrancy.
Summary: Editorial luxury lifestyle — cinematic, natural, warm, and timeless. Think Condé Nast Traveler meets Kinfolk: cinematic storytelling, natural imperfection, quiet luxury.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const googleKey = Deno.env.get("GOOGLE_STUDIO_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    if (!googleKey) {
      throw new Error("GOOGLE_STUDIO_API_KEY is not set");
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { brand_profile_id } = await req.json();
    if (!brand_profile_id) {
      return new Response(
        JSON.stringify({ error: "brand_profile_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch assets for this brand profile
    const { data: assets, error: assetsErr } = await supabase
      .from("brand_assets")
      .select("storage_path,tags")
      .eq("brand_profile_id", brand_profile_id)
      .eq("is_active", true);

    if (assetsErr) throw assetsErr;

    // Group by category tags and build public URLs
    const knownCats = new Set(["lifestyle","exterior","lobby","restaurant","rooms","pools"]);
    const grouped: Record<string, string[]> = {};

    for (const a of assets ?? []) {
      const cat = (a.tags?.find((t: string) => knownCats.has(t)) || a.tags?.[0] || "misc").toLowerCase();
      const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(a.storage_path);
      const url = pub.publicUrl;
      if (!grouped[cat]) grouped[cat] = [];
      if (grouped[cat].length < 20) grouped[cat].push(url); // cap per category
    }

    // Build prompt for Google AI Studio (Gemini)
    const prompt = `You are a photography style analyst. Analyze the provided hotel image URLs per category and produce a concise JSON with fields: 
- style_summary: string (under 250 words) summarizing the hotel's unique look
- prompt_modifiers: string[] array of short tokens to apply during generation following Nino guidelines
- negative_modifiers: string[] array of things to avoid based on Nino "We Do Not Like"
- per_category_notes: map of category->string with specific cues from the images
Follow these Nino guidelines strictly and prefer them over anything else if image analysis is ambiguous.\n\nNINO GUIDELINES:\n${NINO_GUIDELINES}\n\nIMAGES BY CATEGORY (URLs):\n${Object.entries(grouped).map(([k, v]) => `${k}:\n${v.map(u => `- ${u}`).join("\n")}`).join("\n\n")}\n\nReturn ONLY valid JSON.`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }]}],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errTxt = await aiResponse.text();
      console.error("Google AI Studio error:", errTxt);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from model, fallback to raw text
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) { parsed = { style_summary: text?.slice(0, 1000) }; }

    // Save result into brand_profiles.additional_notes
    const payload = {
      training: {
        analyzed_at: new Date().toISOString(),
        images_count: assets?.length || 0,
        categories: Object.keys(grouped),
        result: parsed,
      }
    };

    const { error: upErr } = await supabase
      .from("brand_profiles")
      .update({ additional_notes: JSON.stringify(payload) })
      .eq("id", brand_profile_id);

    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({ ok: true, images_count: assets?.length || 0, categories: Object.keys(grouped) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("start-training error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});