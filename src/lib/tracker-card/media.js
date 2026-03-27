export function getMoviePosterUrl(entry, isMovieTracker) {
  if (!isMovieTracker || !entry) return "";
  return entry.posterUrl || "";
}

export function getVideoGameCoverUrl(entry, isVideoGameTracker) {
  if (!isVideoGameTracker || !entry) return "";
  return String(entry.coverUrl || "").trim();
}
