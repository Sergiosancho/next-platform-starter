import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'content', 'posts');

export function ensurePostsDir() {
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
}

export function getAllPostSlugs() {
  ensurePostsDir();
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => file.replace(/\.md$/, ''));
}

export function getPostBySlug(slug) {
  ensurePostsDir();
  const fullPath = path.join(postsDir, `${slug}.md`);
  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);
  return { frontmatter: data, content };
}

export function getAllPostsMeta() {
  ensurePostsDir();
  const slugs = getAllPostSlugs();
  const posts = slugs.map((slug) => {
    const { frontmatter } = getPostBySlug(slug);
    return {
      slug,
      title: frontmatter.title || slug,
      date: frontmatter.date || null,
      summary: frontmatter.summary || '',
      tags: frontmatter.tags || [],
    };
  });
  posts.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return posts;
}
