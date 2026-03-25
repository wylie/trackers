import type { APIRoute } from "astro";

type WorkoutSuggestion = {
  value: string;
  category: "Strength" | "Cardio" | "Mobility" | "Sports" | "Recovery" | "Other";
};

const WORKOUTS: WorkoutSuggestion[] = [
  { value: "Bench Press", category: "Strength" },
  { value: "Squat", category: "Strength" },
  { value: "Deadlift", category: "Strength" },
  { value: "Overhead Press", category: "Strength" },
  { value: "Pull-Up", category: "Strength" },
  { value: "Barbell Row", category: "Strength" },
  { value: "Dumbbell Curl", category: "Strength" },
  { value: "Tricep Dip", category: "Strength" },
  { value: "Running", category: "Cardio" },
  { value: "Jogging", category: "Cardio" },
  { value: "Cycling", category: "Cardio" },
  { value: "HIIT", category: "Cardio" },
  { value: "Jump Rope", category: "Cardio" },
  { value: "Rowing", category: "Cardio" },
  { value: "Walking", category: "Cardio" },
  { value: "Swimming", category: "Cardio" },
  { value: "Yoga", category: "Mobility" },
  { value: "Pilates", category: "Mobility" },
  { value: "Stretching", category: "Mobility" },
  { value: "Mobility Flow", category: "Mobility" },
  { value: "Foam Rolling", category: "Recovery" },
  { value: "Sauna", category: "Recovery" },
  { value: "Breathwork", category: "Recovery" },
  { value: "Rest Day Recovery", category: "Recovery" },
  { value: "Basketball", category: "Sports" },
  { value: "Tennis", category: "Sports" },
  { value: "Soccer", category: "Sports" },
  { value: "Pickleball", category: "Sports" },
  { value: "Hiking", category: "Sports" },
  { value: "Rock Climbing", category: "Sports" }
];

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSuggestion(name: string, query: string) {
  const n = normalize(name);
  const q = normalize(query);
  if (!n || !q) return -1;
  let score = 0;
  if (n === q) score += 1200;
  if (n.startsWith(q)) score += 900;
  if (n.includes(` ${q} `)) score += 700;
  if (n.includes(q)) score += 450;
  const tokens = q.split(" ").filter(Boolean);
  score += tokens.filter((token) => n.includes(token)).length * 80;
  score -= Math.max(0, n.length - q.length);
  return score;
}

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const suggestions = WORKOUTS
    .map((item) => ({ item, score: scoreSuggestion(item.value, query) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => ({
      label: item.value,
      value: item.value,
      category: item.category,
      subtitle: item.category
    }));

  return new Response(JSON.stringify({ suggestions }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

