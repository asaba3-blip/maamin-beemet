import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
const publicDir = path.join(projectRoot, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const BASE_URL = 'https://maamin-beemet.lovable.app';

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function loadEnvFile() {
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const env = {};

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }

    return env;
  } catch {
    return {};
  }
}

async function getLessons() {
  const fileEnv = await loadEnvFile();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables for sitemap generation.');
  }

  const url = new URL(`${supabaseUrl}/rest/v1/lessons`);
  url.searchParams.set('select', 'id,title,updated_at');
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('order', 'updated_at.desc');

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch lessons for sitemap: ${response.status} ${body}`);
  }

  return response.json();
}

async function generateSitemap() {
  const lessons = await getLessons();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    {
      loc: `${BASE_URL}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${BASE_URL}/auth`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.3',
    },
    ...lessons.map((lesson) => ({
      loc: `${BASE_URL}/lesson/${lesson.id}`,
      lastmod: lesson.updated_at ? new Date(lesson.updated_at).toISOString().split('T')[0] : today,
      changefreq: 'weekly',
      priority: '0.8',
      title: lesson.title,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `\n  ${url.title ? `<!-- ${escapeXml(url.title)} -->\n  ` : ''}<url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(sitemapPath, xml, 'utf8');
  console.log(`Generated sitemap with ${urls.length} URLs at ${sitemapPath}`);
}

generateSitemap().catch((error) => {
  console.error(error);
  process.exit(1);
});
