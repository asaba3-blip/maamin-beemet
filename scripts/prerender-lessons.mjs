// Runs after `vite build`. Writes a unique static HTML file for every published
// lesson (dist/lesson/<id>/index.html) so crawlers get a real title, description,
// canonical URL and readable content without executing JavaScript.

import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
const distDir = path.join(projectRoot, 'dist');
const BASE_URL = 'https://maamin-beemet.co.il';
const SITE_NAME = 'לימודי מקרא ויהדות';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripScripts(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/ on[a-z]+="[^"]*"/gi, '');
}

function truncate(text = '', max = 155) {
  const clean = String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '…';
}

async function loadEnvFile() {
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[trimmed.slice(0, eq).trim()] = value;
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
    throw new Error('Missing Supabase environment variables for prerendering.');
  }

  const url = new URL(`${supabaseUrl}/rest/v1/lessons`);
  url.searchParams.set('select', 'id,title,summary,content,image_url,created_at,updated_at');
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('order', 'created_at.desc');

  const response = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch lessons for prerender: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function buildHead(lesson) {
  const url = `${BASE_URL}/lesson/${lesson.id}`;
  const title = escapeHtml(`${lesson.title} | ${SITE_NAME}`);
  const description = escapeHtml(truncate(lesson.summary || lesson.content, 155));
  const image = lesson.image_url ? escapeHtml(lesson.image_url) : null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: lesson.title,
    description: truncate(lesson.summary || lesson.content, 155),
    datePublished: lesson.created_at,
    ...(lesson.updated_at ? { dateModified: lesson.updated_at } : {}),
    inLanguage: 'he',
    mainEntityOfPage: url,
    ...(lesson.image_url ? { image: lesson.image_url } : {}),
    publisher: { '@type': 'EducationalOrganization', name: SITE_NAME, url: BASE_URL },
  };

  return [
    `<title>${title}</title>`,
    `<meta name="title" content="${title}" />`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapeHtml(lesson.title)}" />`,
    `<meta property="og:description" content="${description}" />`,
    image ? `<meta property="og:image" content="${image}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(lesson.title)}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : '',
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

function buildNoscript(lesson) {
  return [
    '<noscript>',
    `<article lang="he" dir="rtl">`,
    `<h1>${escapeHtml(lesson.title)}</h1>`,
    lesson.image_url ? `<img src="${escapeHtml(lesson.image_url)}" alt="${escapeHtml(lesson.title)}" />` : '',
    lesson.summary ? `<p>${escapeHtml(lesson.summary)}</p>` : '',
    `<div>${stripScripts(lesson.content || '')}</div>`,
    `<p><a href="${BASE_URL}/">${escapeHtml(SITE_NAME)}</a></p>`,
    '</article>',
    '</noscript>',
  ]
    .filter(Boolean)
    .join('\n');
}

function renderLessonHtml(template, lesson) {
  let html = template;

  // Drop the site-wide head tags that must not be duplicated per lesson.
  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="title"[^>]*>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta\s+property="og:(type|url|title|description|image)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+(?:name|property)="twitter:[^"]*"[^>]*>\s*/gi, '');

  html = html.replace('</head>', `  ${buildHead(lesson)}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${buildNoscript(lesson)}`);
  return html;
}

async function prerender() {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const lessons = await getLessons();

  for (const lesson of lessons) {
    const dir = path.join(distDir, 'lesson', lesson.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), renderLessonHtml(template, lesson), 'utf8');
  }

  console.log(`Prerendered ${lessons.length} lesson pages into dist/lesson/`);
}

prerender().catch((error) => {
  console.error(error);
  process.exit(1);
});
