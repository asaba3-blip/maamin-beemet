import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all published lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    const baseUrl = 'https://maamin-beemet.co.il'

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <!-- Homepage -->
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    
    <!-- Auth page -->
    <url>
        <loc>${baseUrl}/auth</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
`

    // Add all published lessons
    for (const lesson of lessons || []) {
      const lastmod = lesson.updated_at
        ? `
        <lastmod>${new Date(lesson.updated_at).toISOString().split('T')[0]}</lastmod>`
        : ''

      sitemap += `
    <url>
        <loc>${baseUrl}/lesson/${lesson.id}</loc>${lastmod}
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
`
    }


    sitemap += `
</urlset>`

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
