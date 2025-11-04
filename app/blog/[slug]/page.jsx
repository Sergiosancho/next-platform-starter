import Markdown from 'markdown-to-jsx';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '../../../lib/posts';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default function BlogPost({ params }) {
  const { slug } = params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch (e) {
    return notFound();
  }
  const { frontmatter, content } = post;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-white">
      <Link href="/blog" className="text-sm text-white/80">← Volver</Link>
      <h1 className="text-3xl font-bold mt-2 mb-1 text-white">{frontmatter.title || slug}</h1>
      {frontmatter.date && (
        <p className="text-sm text-white/80">{new Date(frontmatter.date).toLocaleString()}</p>
      )}
      {frontmatter.tags?.length ? (
        <div className="mt-2 text-xs text-white/80">{frontmatter.tags.map((t) => `#${t}`).join(' ')}</div>
      ) : null}
      <article className="prose max-w-none mt-6 prose-invert">
        <Markdown>{content}</Markdown>
      </article>
    </main>
  );
}
