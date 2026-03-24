import type { APIRoute } from "astro";

function formatSuggestion(book: {
  title?: string;
  first_publish_year?: number;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
}) {
  if (!book?.title) return null;
  const label = book.first_publish_year ? `${book.title} (${book.first_publish_year})` : book.title;
  const author = Array.isArray(book.author_name) && book.author_name.length ? book.author_name[0] : "";
  const totalPages = Number(book.number_of_pages_median) || 0;
  const coverId = Number(book.cover_i) || 0;
  const coverUrl = coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
  const pageText = totalPages > 0 ? `${totalPages} pages` : "";
  const subtitle = [author, pageText].filter(Boolean).join(" • ");
  return {
    label,
    value: book.title,
    author,
    totalPages,
    coverId,
    coverUrl,
    subtitle
  };
}

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get("q") || "").trim();
  const normalizedQuery = query.replace(/\s+by\s+.+$/i, "").trim();

  if (query.length < 2) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  async function searchBooks(term: string) {
    const endpoint = `https://openlibrary.org/search.json?limit=8&fields=title,first_publish_year,author_name,number_of_pages_median,cover_i&q=${encodeURIComponent(term)}`;
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SimpleTrackers/1.0 (+https://www.simpletrackers.io)"
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    return docs.map(formatSuggestion).filter(Boolean).slice(0, 8);
  }

  let suggestions = await searchBooks(query);
  if (!suggestions.length && normalizedQuery.length >= 2 && normalizedQuery !== query) {
    suggestions = await searchBooks(normalizedQuery);
  }

  return new Response(JSON.stringify({ suggestions }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
