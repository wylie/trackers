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

const WORKOUT_WEATHER_CODE_LABELS = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail"
};

function formatNumber(value, digits = 1) {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return "";
  return safe.toFixed(digits).replace(/\.0$/, "");
}

export function getWorkoutWeatherLabel(code) {
  const safeCode = Number(code);
  if (!Number.isFinite(safeCode)) return "";
  return WORKOUT_WEATHER_CODE_LABELS[safeCode] || `Code ${safeCode}`;
}

export function formatWorkoutWeatherSummary(entry, isWorkoutTracker) {
  if (!isWorkoutTracker) return "";
  const weather = entry?.workoutWeather;
  if (!weather || typeof weather !== "object") return "";
  const tempLabel = formatNumber(weather?.temperatureF, 1);
  const windLabel = formatNumber(weather?.windMph, 1);
  const precip = Math.max(0, Number(weather?.precipitationInches) || 0);
  const condition = String(weather?.weatherLabel || "").trim() || getWorkoutWeatherLabel(weather?.weatherCode);
  const segments = [];
  if (tempLabel) segments.push(`${tempLabel}F`);
  if (condition) segments.push(condition);
  if (windLabel) segments.push(`Wind ${windLabel} mph`);
  if (precip > 0.01) segments.push(`Rain ${precip.toFixed(2)} in`);
  if (!segments.length) return "";
  return `Weather ${segments.join(" • ")}`;
}
