import type { APIRoute } from "astro";

function formatSuggestion(book: {
  title?: string;
  first_publish_year?: number;
  author_name?: string[];
  number_of_pages_median?: number;
}) {
  if (!book?.title) return null;
  const label = book.first_publish_year ? `${book.title} (${book.first_publish_year})` : book.title;
  const author = Array.isArray(book.author_name) && book.author_name.length ? book.author_name[0] : "";
  const totalPages = Number(book.number_of_pages_median) || 0;
  const pageText = totalPages > 0 ? `${totalPages} pages` : "";
  const subtitle = [author, pageText].filter(Boolean).join(" • ");
  return {
    label,
    value: book.title,
    author,
    totalPages,
    subtitle
  };
}

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get("q") || "").trim();

  if (query.length < 2) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const endpoint = `https://openlibrary.org/search.json?limit=8&fields=title,first_publish_year,author_name,number_of_pages_median&q=${encodeURIComponent(query)}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = await res.json();
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  const suggestions = docs.map(formatSuggestion).filter(Boolean).slice(0, 8);

  return new Response(JSON.stringify({ suggestions }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
