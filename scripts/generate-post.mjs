import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';

const root = process.cwd();
const contentDir = path.join(root, 'content', 'posts');
const configPath = path.join(root, 'config', 'topics.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) throw new Error('Falta config/topics.json');
  return fs.readJSONSync(configPath);
}

function toSlug(title) {
  return slugify(title, { lower: true, strict: true, locale: 'es' }).slice(0, 80);
}

function uniqueSlug(base) {
  const ts = new Date().toISOString().slice(0, 10);
  return `${ts}-${base}`;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no está configurada');

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Eres un redactor que genera posts de blog en formato Markdown con frontmatter YAML. Responde solo con el archivo completo.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1200
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.choices[0]?.message?.content || '';
}

function buildPrompt(cfg) {
  const theme = cfg.themes?.[0] || { name: 'general', instructions: '' };
  return `Genera un post de blog en español en Markdown con este formato exacto:\n\n---\ntitle: "..."\ndate: "${new Date().toISOString()}"\nsummary: "..."\ntags: ["${theme.name}"]\n---\n\n[Cuerpo del artículo en Markdown con subtítulos, bullets y enlaces a 2-3 fuentes verificables.]

Requisitos:
- Tema: ${theme.name}
- Instrucciones: ${theme.instructions}
- Longitud aproximada: ${cfg.minWords}-${cfg.maxWords} palabras
- Evita frases prohibidas: ${(cfg.bannedPhrases||[]).join(', ')}
- No incluyas HTML, solo Markdown. No incluyas comentarios.`;
}

function validateAndExtract(md) {
  const parsed = matter(md);
  if (!parsed.data.title || !parsed.content?.trim()) {
    throw new Error('El contenido generado no tiene title o cuerpo.');
  }
  return parsed;
}

async function writePost(parsed) {
  await fs.ensureDir(contentDir);
  const base = toSlug(parsed.data.title);
  const finalSlug = uniqueSlug(base);
  const filePath = path.join(contentDir, `${finalSlug}.md`);
  const md = matter.stringify(parsed.content, {
    ...parsed.data,
    date: new Date().toISOString(),
  });
  await fs.writeFile(filePath, md, 'utf8');
  return { slug: finalSlug, filePath };
}

async function main() {
  const cfg = loadConfig();
  const prompt = buildPrompt(cfg);
  const output = await callOpenAI(prompt);
  const parsed = validateAndExtract(output);
  const { slug, filePath } = await writePost(parsed);
  console.log(`Post creado: ${slug} -> ${filePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
