export function getTrackerFlags(storageKey: string) {
  const key = String(storageKey || "");
  const isSleepTracker = key === "sleep-tracker-entries";
  const isReadingTracker = key === "reading-tracker-entries";
  const isMovieTracker = key === "movie-watch-tracker-entries";
  const isVideoGameTracker = key === "video-game-tracker-entries";
  const isWorkoutTracker = key === "workout-tracker-entries";
  const isTaskTracker = key === "task-tracker-entries";
  const isCustomTracker = key === "custom-tracker-entries";
  const isFinanceTracker = key === "finance-tracker-entries";
  const isMealTracker = key === "meal-tracker-entries";
  const isHealthTracker = key === "health-tracker-entries";
  const isWaterTracker = key === "water-tracker-entries";

  return {
    isSleepTracker,
    isReadingTracker,
    isMovieTracker,
    isVideoGameTracker,
    isWorkoutTracker,
    isTaskTracker,
    isCustomTracker,
    isFinanceTracker,
    isMealTracker,
    isHealthTracker,
    isWaterTracker,
    hidesRating: isSleepTracker || isTaskTracker || isFinanceTracker || isMealTracker || isHealthTracker || isWaterTracker
  };
}
