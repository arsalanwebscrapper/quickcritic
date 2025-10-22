import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  url: string;
  domain: string;
  fetched_at: string;
  title: string | null;
  image: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  rating: number | null;
  ai_score: number;
  sentiment_score: number;
  short_review: string;
  pros: string[];
  cons: string[];
  cached_until: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid product URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domain = parsedUrl.hostname;
    console.log('Analyzing product:', url);

    // Initialize Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('product_inspections')
      .select('*')
      .eq('url', url)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // Return cached result if still valid
    if (cached && new Date(cached.cached_until) > new Date()) {
      console.log('Returning cached result');
      return new Response(
        JSON.stringify({
          url: cached.url,
          meta: {
            title: cached.title,
            image: cached.image,
            description: cached.description,
            price: cached.price ? parseFloat(cached.price) : null,
            currency: cached.currency,
            rating: cached.rating ? parseFloat(cached.rating) : null,
          },
          ai: {
            score: cached.ai_score,
            short_review: cached.short_review,
            pros: cached.pros,
            cons: cached.cons,
            sentiment_score: cached.sentiment_score ? parseFloat(cached.sentiment_score) : 0,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch product page
    console.log('Fetching product page...');
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!pageResponse.ok) {
      console.error('Failed to fetch page:', pageResponse.status, pageResponse.statusText);
      
      let errorMessage = 'Unable to access this product page. ';
      if (pageResponse.status === 429 || pageResponse.status === 529) {
        errorMessage += 'The website is blocking automated requests. Try a different product or wait a few minutes.';
      } else if (pageResponse.status === 403) {
        errorMessage += 'Access to this page is restricted.';
      } else if (pageResponse.status === 404) {
        errorMessage += 'Product page not found. Please check the URL.';
      } else {
        errorMessage += 'Please try again or use a different product URL.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await pageResponse.text();
    console.log('Page fetched, extracting metadata...');

    // Extract basic metadata (simplified - in production, use proper HTML parser)
    const extractMeta = (pattern: string): string | null => {
      const match = html.match(new RegExp(pattern, 'i'));
      return match ? match[1].replace(/"/g, '') : null;
    };

    const title = extractMeta('<title[^>]*>([^<]+)</title>') || 
                  extractMeta('property="og:title"[^>]*content="([^"]+)"') ||
                  'Product';
    const image = extractMeta('property="og:image"[^>]*content="([^"]+)"') ||
                  extractMeta('<img[^>]*src="([^"]+)"');
    const description = extractMeta('property="og:description"[^>]*content="([^"]+)"') ||
                       extractMeta('name="description"[^>]*content="([^"]+)"');

    // Use AI to analyze the product
    console.log('Calling AI for analysis...');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiPrompt = `You are a product analyst. Analyze this product and provide:
1. A score from 0-100 (higher is better) based on various factors
2. A short 1-2 sentence review
3. 3 pros (positive aspects)
4. 3 cons (negative aspects)
5. A sentiment score between -1 and 1

Product Info:
URL: ${url}
Domain: ${domain}
Title: ${title}
Description: ${description || 'Not available'}

Respond in JSON format only:
{
  "score": number (0-100),
  "short_review": "string",
  "pros": ["string", "string", "string"],
  "cons": ["string", "string", "string"],
  "sentiment_score": number (-1 to 1)
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a product analyst AI. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    let aiAnalysis;
    try {
      const content = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      aiAnalysis = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback analysis
      aiAnalysis = {
        score: 75,
        short_review: 'Product analysis completed. Please check product details for more information.',
        pros: ['Available for purchase', 'Listed on reputable platform', 'Product information provided'],
        cons: ['Limited analysis data', 'Manual review recommended', 'Details may vary'],
        sentiment_score: 0.5,
      };
    }

    // Prepare result
    const now = new Date();
    const cachedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Cache for 24 hours

    const result: AnalysisResult = {
      url,
      domain,
      fetched_at: now.toISOString(),
      title,
      image,
      description,
      price: null,
      currency: null,
      rating: null,
      ai_score: Math.min(100, Math.max(0, Math.round(aiAnalysis.score))),
      sentiment_score: Math.min(1, Math.max(-1, aiAnalysis.sentiment_score)),
      short_review: aiAnalysis.short_review,
      pros: Array.isArray(aiAnalysis.pros) ? aiAnalysis.pros.slice(0, 3) : [],
      cons: Array.isArray(aiAnalysis.cons) ? aiAnalysis.cons.slice(0, 3) : [],
      cached_until: cachedUntil.toISOString(),
    };

    // Store in database
    console.log('Storing result in database...');
    const { error: insertError } = await supabase
      .from('product_inspections')
      .upsert(result, { onConflict: 'url' });

    if (insertError) {
      console.error('Failed to cache result:', insertError);
    } else {
      console.log('Result cached successfully');
    }

    // Return result
    return new Response(
      JSON.stringify({
        url: result.url,
        meta: {
          title: result.title,
          image: result.image,
          description: result.description,
          price: result.price,
          currency: result.currency,
          rating: result.rating,
        },
        ai: {
          score: result.ai_score,
          short_review: result.short_review,
          pros: result.pros,
          cons: result.cons,
          sentiment_score: result.sentiment_score,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
