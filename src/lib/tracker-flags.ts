export function getTrackerFlags(storageKey: string) {
  const key = String(storageKey || "");
  const isSleepTracker = key === "sleep-tracker-entries";
  const isReadingTracker = key === "reading-tracker-entries";
  const isMovieTracker = key === "movie-watch-tracker-entries";
  const isVideoGameTracker = key === "video-game-tracker-entries";
  const isWorkoutTracker = key === "workout-tracker-entries";
  const isTaskTracker = key === "task-tracker-entries";
  const isFinanceTracker = key === "finance-tracker-entries";
  const isHealthTracker = key === "health-tracker-entries";

  return {
    isSleepTracker,
    isReadingTracker,
    isMovieTracker,
    isVideoGameTracker,
    isWorkoutTracker,
    isTaskTracker,
    isFinanceTracker,
    isHealthTracker,
    hidesRating: isSleepTracker || isTaskTracker || isFinanceTracker || isHealthTracker
  };
}
