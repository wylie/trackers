import type { APIRoute } from "astro";

function normalizeIsbn(value: unknown) {
  return String(value || "")
    .replace(/[^0-9Xx]/g, "")
    .toUpperCase();
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toHttps(value: unknown) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (input.startsWith("http://")) return `https://${input.slice(7)}`;
  return input;
}

function getGoogleCover(imageLinks: Record<string, unknown> | null | undefined) {
  if (!imageLinks || typeof imageLinks !== "object") return "";
  return toHttps(
    imageLinks.extraLarge
    || imageLinks.large
    || imageLinks.medium
    || imageLinks.small
    || imageLinks.thumbnail
    || imageLinks.smallThumbnail
  );
}

function parseGoogleBook(item: Record<string, unknown>) {
  const info = (item?.volumeInfo && typeof item.volumeInfo === "object") ? item.volumeInfo as Record<string, unknown> : {};
  const title = String(info.title || "").trim();
  const authors = Array.isArray(info.authors) ? info.authors : [];
  const author = String(authors[0] || "").trim();
  const pageCount = Math.max(0, Number(info.pageCount) || 0);
  const publisher = String(info.publisher || "").trim();

  const identifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
  let isbn13 = "";
  let isbn10 = "";
  for (const row of identifiers) {
    const itemRow = (row && typeof row === "object") ? row as Record<string, unknown> : {};
    const type = String(itemRow.type || "").trim().toUpperCase();
    const value = normalizeIsbn(itemRow.identifier || "");
    if (!value) continue;
    if (type === "ISBN_13" && !isbn13) isbn13 = value;
    if (type === "ISBN_10" && !isbn10) isbn10 = value;
  }
  const isbn = isbn13 || isbn10;
  const imageLinks = (info.imageLinks && typeof info.imageLinks === "object") ? info.imageLinks as Record<string, unknown> : null;
  const coverUrl = getGoogleCover(imageLinks);

  return {
    title,
    author,
    publisher,
    totalPages: pageCount,
    coverUrl,
    isbn13,
    isbn
  };
}

async function queryGoogleVolumes(query: string, apiKey: string) {
  const endpoint = new URL("https://www.googleapis.com/books/v1/volumes");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("maxResults", "10");
  endpoint.searchParams.set("printType", "books");
  endpoint.searchParams.set("langRestrict", "en");
  endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(parseGoogleBook);
}

function scoreMatch(item: {
  title?: string;
  author?: string;
  isbn13?: string;
  isbn?: string;
  coverUrl?: string;
}, target: { title: string; author: string; isbn: string }) {
  let score = 0;
  const itemTitle = normalizeText(item.title || "");
  const itemAuthor = normalizeText(item.author || "");

  if (target.isbn) {
    const itemIsbn13 = normalizeIsbn(item.isbn13 || "");
    const itemIsbn = normalizeIsbn(item.isbn || "");
    if (target.isbn === itemIsbn13 || target.isbn === itemIsbn) score += 4000;
  }

  if (target.title && itemTitle) {
    if (itemTitle === target.title) score += 1000;
    else if (itemTitle.startsWith(target.title) || target.title.startsWith(itemTitle)) score += 650;
    else if (itemTitle.includes(target.title) || target.title.includes(itemTitle)) score += 350;
  }

  if (target.author && itemAuthor) {
    if (itemAuthor === target.author) score += 650;
    else if (itemAuthor.includes(target.author) || target.author.includes(itemAuthor)) score += 300;
  }

  if (item.coverUrl) score += 140;

  return score;
}

export const GET: APIRoute = async ({ url }) => {
  const isbn = normalizeIsbn(url.searchParams.get("isbn") || "");
  const title = String(url.searchParams.get("title") || "").trim();
  const author = String(url.searchParams.get("author") || "").trim();

  if (!isbn && !title) {
    return new Response(JSON.stringify({ match: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const googleBooksApiKey = String(import.meta.env.GOOGLE_BOOKS_API_KEY || "").trim();
  const target = {
    isbn,
    title: normalizeText(title),
    author: normalizeText(author)
  };

  try {
    if (googleBooksApiKey) {
      let candidates: ReturnType<typeof parseGoogleBook>[] = [];
      if (isbn) {
        candidates = await queryGoogleVolumes(`isbn:${isbn}`, googleBooksApiKey);
      }
      if (!candidates.length && title) {
        const q = author ? `intitle:${title} inauthor:${author}` : `intitle:${title}`;
        candidates = await queryGoogleVolumes(q, googleBooksApiKey);
      }
      if (candidates.length) {
        const best = candidates
          .map((item) => ({ item, score: scoreMatch(item, target) }))
          .sort((a, b) => b.score - a.score)[0];
        if (best?.item?.coverUrl) {
          return new Response(JSON.stringify({
            match: {
              ...best.item,
              source: "google_books"
            }
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    return new Response(JSON.stringify({ match: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ match: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
