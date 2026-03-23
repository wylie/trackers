export type RelatedCalculator = {
  name: string;
  url: string;
  icon?: string;
};

const calculatorMap: Record<string, RelatedCalculator[]> = {
  "custom-tracker": [
    { name: "Percentage of a Number Calculator", url: "https://simplecalculators.io/percentage-of-a-number/", icon: "percent" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/", icon: "percent" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/", icon: "event" },
    { name: "Unit Price Calculator", url: "https://simplecalculators.io/unit-price-calculator/", icon: "price_check" }
  ],
  "finance-tracker": [
    { name: "Budget Calculator", url: "https://simplecalculators.io/budget/", icon: "payments" },
    { name: "Cash Flow Calculator", url: "https://simplecalculators.io/cash-flow-calculator/", icon: "account_balance_wallet" },
    { name: "Net Worth Calculator", url: "https://simplecalculators.io/net-worth/", icon: "account_balance_wallet" },
    { name: "Debt Payoff Calculator", url: "https://simplecalculators.io/debt-payoff-calculator/", icon: "credit_card" }
  ],
  "garden-harvest-tracker": [
    { name: "Square Footage Calculator", url: "https://simplecalculators.io/square-footage-calculator/", icon: "square_foot" },
    { name: "Unit Price Calculator", url: "https://simplecalculators.io/unit-price-calculator/", icon: "price_check" },
    { name: "Weather Converter", url: "https://simplecalculators.io/weather/", icon: "thermostat" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/", icon: "event" }
  ],
  "habit-tracker": [
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/", icon: "event" },
    { name: "Week Number Calculator", url: "https://simplecalculators.io/week-number/", icon: "view_week" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/", icon: "percent" },
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/", icon: "timer" }
  ],
  "health-tracker": [
    { name: "BMI Calculator", url: "https://simplecalculators.io/bmi/", icon: "monitor_weight" },
    { name: "BMR Calculator", url: "https://simplecalculators.io/bmr-calculator/", icon: "local_fire_department" },
    { name: "Body Fat Calculator", url: "https://simplecalculators.io/body-fat/", icon: "monitor_weight" },
    { name: "TDEE Calculator", url: "https://simplecalculators.io/tdee/", icon: "local_fire_department" }
  ],
  "meal-tracker": [
    { name: "Calorie Calculator", url: "https://simplecalculators.io/calories/", icon: "local_fire_department" },
    { name: "Macro Calculator", url: "https://simplecalculators.io/macro-calculator/", icon: "nutrition" },
    { name: "Protein Intake Calculator", url: "https://simplecalculators.io/protein-intake/", icon: "nutrition" },
    { name: "Water Intake Calculator", url: "https://simplecalculators.io/water-intake/", icon: "water_drop" }
  ],
  "movie-watch-tracker": [
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/", icon: "timer" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/", icon: "event" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/", icon: "event" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/", icon: "schedule" }
  ],
  "reading-tracker": [
    { name: "Percentage of a Number Calculator", url: "https://simplecalculators.io/percentage-of-a-number/", icon: "percent" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/", icon: "percent" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/", icon: "event" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/", icon: "schedule" }
  ],
  "sleep-tracker": [
    { name: "Sleep Calculator", url: "https://simplecalculators.io/sleep-calculator/", icon: "bedtime" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/", icon: "schedule" },
    { name: "Hours to Days Calculator", url: "https://simplecalculators.io/hours-to-days-calculator/", icon: "schedule" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/", icon: "event" }
  ],
  "task-tracker": [
    { name: "Work Hours Calculator", url: "https://simplecalculators.io/work-hours/", icon: "work_history" },
    { name: "Time Card Calculator", url: "https://simplecalculators.io/time-card-calculator/", icon: "schedule" },
    { name: "Business Days Calculator", url: "https://simplecalculators.io/business-days/", icon: "calendar_today" },
    { name: "Workdays Between Dates Calculator", url: "https://simplecalculators.io/workdays-between-dates-calculator/", icon: "calendar_today" }
  ],
  "video-game-tracker": [
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/", icon: "timer" },
    { name: "Hours to Days Calculator", url: "https://simplecalculators.io/hours-to-days-calculator/", icon: "schedule" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/", icon: "event" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/", icon: "percent" }
  ],
  "workout-tracker": [
    { name: "One Rep Max Calculator", url: "https://simplecalculators.io/one-rep-max/", icon: "sports_gymnastics" },
    { name: "Calories Burned Calculator", url: "https://simplecalculators.io/calories-burned/", icon: "local_fire_department" },
    { name: "Heart Rate Zone Calculator", url: "https://simplecalculators.io/heart-rate-zone-calculator/", icon: "favorite" },
    { name: "Target Heart Rate Calculator", url: "https://simplecalculators.io/target-heart-rate/", icon: "favorite" }
  ]
};

export function getRelatedCalculators(slug: string): RelatedCalculator[] {
  return calculatorMap[slug] || [];
}
