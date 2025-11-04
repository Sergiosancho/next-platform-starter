import Link from 'next/link';
import { getAllPostsMeta } from '../../lib/posts';

export const dynamic = 'force-static';

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">Blog</h1>
      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.slug} className="border-b pb-4">
            <h2 className="text-xl font-semibold">
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>
            {p.date && (
              <p className="text-sm text-white/80">{new Date(p.date).toLocaleDateString()}</p>
            )}
            {p.summary && <p className="mt-2 text-white">{p.summary}</p>}
            {p.tags?.length ? (
              <div className="mt-2 text-xs text-white/80">{p.tags.map((t) => `#${t}`).join(' ')}</div>
            ) : null}
          </li>
        ))}
        {!posts.length && <li>No hay posts todavía.</li>}
      </ul>
    </main>
  );
}
