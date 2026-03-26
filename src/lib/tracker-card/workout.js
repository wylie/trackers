export function getWorkoutDurationParts(entry) {
  let hours = Math.max(0, Number(entry?.workoutDurationHours) || 0);
  let minutes = Math.max(0, Number(entry?.workoutDurationMinutes) || 0);
  let seconds = Math.max(0, Number(entry?.workoutDurationSeconds) || 0);
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }
  if (hours > 0 || minutes > 0 || seconds > 0) {
    return { hours, minutes, seconds };
  }
  const legacyMinutes = Math.max(0, Number(entry?.workoutDurationTotalMinutes) || 0);
  return {
    hours: Math.floor(legacyMinutes / 60),
    minutes: legacyMinutes % 60,
    seconds: 0
  };
}

export function getWorkoutMetricProfile(item, category) {
  const text = String(item || "").toLowerCase();
  const type = String(category || "").toLowerCase();
  const profile = {
    duration: true,
    distance: false,
    laps: false,
    sets: false,
    reps: false,
    weight: false
  };

  if (type === "strength") {
    profile.sets = true;
    profile.reps = true;
    profile.weight = true;
    return profile;
  }
  if (type === "cardio" || type === "sports") {
    profile.distance = true;
    return profile;
  }
  if (type === "mobility" || type === "recovery") {
    return profile;
  }
  if (type === "other") {
    profile.distance = true;
    profile.sets = true;
    profile.reps = true;
    profile.weight = true;
    return profile;
  }

  if (/swim/.test(text)) {
    profile.distance = true;
    profile.laps = true;
  }
  if (/(run|walk|jog|hike|cycle|bike|row)/.test(text)) {
    profile.distance = true;
  }
  if (/(hiit|yoga|pilates|stretch|mobility|foam|breath)/.test(text)) {
    return profile;
  }
  if (/(squat|deadlift|bench|press|curl|dip|row|pull)/.test(text)) {
    profile.sets = true;
    profile.reps = true;
    profile.weight = true;
  }

  return profile;
}

export function toggleWorkoutMetricField(wrap, input, enabled) {
  if (!wrap || !input) return;
  wrap.classList.toggle("hidden", !enabled);
  input.disabled = !enabled;
}

export function syncWorkoutMetricsUI({
  isWorkoutTracker,
  workoutMetricsContainer,
  itemValue,
  categoryValue,
  workoutDurationWrap,
  workoutDurationHoursInput,
  workoutDurationMinutesInput,
  workoutDurationSecondsInput,
  workoutDistanceWrap,
  workoutDistanceInput,
  workoutLapsWrap,
  workoutLapsInput,
  workoutSetsWrap,
  workoutSetsInput,
  workoutRepsWrap,
  workoutRepsInput,
  workoutWeightWrap,
  workoutWeightInput
}) {
  if (!isWorkoutTracker || !workoutMetricsContainer) return;
  const profile = getWorkoutMetricProfile(itemValue || "", categoryValue || "");
  workoutMetricsContainer.classList.remove("hidden");
  toggleWorkoutMetricField(workoutDurationWrap, workoutDurationHoursInput, profile.duration);
  if (workoutDurationMinutesInput) workoutDurationMinutesInput.disabled = !profile.duration;
  if (workoutDurationSecondsInput) workoutDurationSecondsInput.disabled = !profile.duration;
  toggleWorkoutMetricField(workoutDistanceWrap, workoutDistanceInput, profile.distance);
  toggleWorkoutMetricField(workoutLapsWrap, workoutLapsInput, profile.laps);
  toggleWorkoutMetricField(workoutSetsWrap, workoutSetsInput, profile.sets);
  toggleWorkoutMetricField(workoutRepsWrap, workoutRepsInput, profile.reps);
  toggleWorkoutMetricField(workoutWeightWrap, workoutWeightInput, profile.weight);
}

export function formatWorkoutMetricBadges(entry, isWorkoutTracker) {
  if (!isWorkoutTracker) return "";
  const parts = [];
  const duration = getWorkoutDurationParts(entry);
  const distance = Math.max(0, Number(entry?.workoutDistanceMiles) || 0);
  const laps = Math.max(0, Number(entry?.workoutLaps) || 0);
  const sets = Math.max(0, Number(entry?.workoutSets) || 0);
  const reps = Math.max(0, Number(entry?.workoutReps) || 0);
  const weight = Math.max(0, Number(entry?.workoutWeightLbs) || 0);
  if (duration.hours > 0 || duration.minutes > 0 || duration.seconds > 0) {
    const durationParts = [];
    if (duration.hours > 0) durationParts.push(`${duration.hours}h`);
    if (duration.minutes > 0 || (duration.hours > 0 && duration.seconds > 0)) durationParts.push(`${duration.minutes}m`);
    if (duration.seconds > 0) durationParts.push(`${duration.seconds}s`);
    parts.push(durationParts.join(" "));
  }
  if (distance > 0) parts.push(`${distance.toFixed(2).replace(/\.?0+$/, "")} mi`);
  if (laps > 0) parts.push(`${laps} laps`);
  if (sets > 0) parts.push(`${sets} sets`);
  if (reps > 0) parts.push(`${reps} reps`);
  if (weight > 0) parts.push(`${weight} lbs`);
  if (!parts.length) return "";
  return `<div class="tracker-metric-badges">${parts.map((part) => `<span class="tracker-metric-pill">${part}</span>`).join("")}</div>`;
}
