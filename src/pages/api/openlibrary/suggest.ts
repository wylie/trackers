import type { APIRoute } from "astro";

function formatSuggestion(book: {
  title?: string;
  first_publish_year?: number;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
}) {
  if (!book?.title) return null;
  const label = book.first_publish_year ? `${book.title} (${book.first_publish_year})` : book.title;
  const author = Array.isArray(book.author_name) && book.author_name.length ? book.author_name[0] : "";
  const totalPages = Number(book.number_of_pages_median) || 0;
  const coverId = Number(book.cover_i) || 0;
  const coverEditionKey = typeof book.cover_edition_key === "string" ? book.cover_edition_key : "";
  const coverUrl = coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
  const isbnList = Array.isArray(book.isbn) ? book.isbn.map((code) => String(code || "").replace(/[^0-9Xx]/g, "").toUpperCase()).filter(Boolean) : [];
  const isbn13 = isbnList.find((code) => code.length === 13) || "";
  const isbn = isbn13 || isbnList.find((code) => code.length === 10) || isbnList[0] || "";
  const pageText = totalPages > 0 ? `${totalPages} pages` : "";
  const subtitle = [author, pageText].filter(Boolean).join(" • ");
  return {
    label,
    value: book.title,
    author,
    totalPages,
    coverId,
    coverEditionKey,
    coverUrl,
    isbn13,
    isbn,
    subtitle
  };
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreBookForQuery(book: {
  title?: string;
  first_publish_year?: number;
}, query: string) {
  const title = normalizeText(book?.title || "");
  const q = normalizeText(query);
  if (!title || !q) return -1;

  let score = 0;
  if (title === q) score += 1200;
  if (title.startsWith(`${q} `) || title.startsWith(q)) score += 900;
  if (title.includes(` ${q} `)) score += 700;
  if (title.includes(q)) score += 450;

  const qTokens = q.split(" ").filter(Boolean);
  const tokenMatches = qTokens.filter((token) => title.includes(token)).length;
  score += tokenMatches * 80;
  score += Math.min(120, title.length);

  const year = Number(book?.first_publish_year) || 0;
  if (year >= 1990) score += 15;
  if (year >= 2010) score += 10;

  return score;
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

  async function fetchBooksFrom(endpoint: string) {
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SimpleTrackers/1.0 (+https://www.simpletrackers.io)"
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.docs) ? data.docs : [];
  }

  async function searchBooks(term: string) {
    const base = "https://openlibrary.org/search.json";
    const fields = "title,first_publish_year,author_name,number_of_pages_median,cover_i,cover_edition_key,isbn";
    const [titleDocs, keywordDocs] = await Promise.all([
      fetchBooksFrom(`${base}?limit=30&fields=${fields}&title=${encodeURIComponent(term)}`),
      fetchBooksFrom(`${base}?limit=30&fields=${fields}&q=${encodeURIComponent(term)}`)
    ]);

    const combined = [...titleDocs, ...keywordDocs];
    const deduped = new Map();
    for (const book of combined) {
      const title = normalizeText(String(book?.title || ""));
      const author = normalizeText(Array.isArray(book?.author_name) ? String(book.author_name[0] || "") : "");
      if (!title) continue;
      const key = `${title}::${author}`;
      if (!deduped.has(key)) deduped.set(key, book);
    }

    return Array.from(deduped.values())
      .map((book) => ({ book, score: scoreBookForQuery(book, term) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => formatSuggestion(entry.book))
      .filter(Boolean);
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
