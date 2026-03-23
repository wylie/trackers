export type RelatedCalculator = {
  name: string;
  url: string;
  icon?: string;
};

const calculatorMap: Record<string, RelatedCalculator[]> = {
  "custom-tracker": [
    { name: "Percentage of a Number Calculator", url: "https://simplecalculators.io/percentage-of-a-number/" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/" },
    { name: "Unit Price Calculator", url: "https://simplecalculators.io/unit-price-calculator/" }
  ],
  "finance-tracker": [
    { name: "Budget Calculator", url: "https://simplecalculators.io/budget/" },
    { name: "Cash Flow Calculator", url: "https://simplecalculators.io/cash-flow-calculator/" },
    { name: "Net Worth Calculator", url: "https://simplecalculators.io/net-worth/" },
    { name: "Debt Payoff Calculator", url: "https://simplecalculators.io/debt-payoff-calculator/" }
  ],
  "garden-harvest-tracker": [
    { name: "Square Footage Calculator", url: "https://simplecalculators.io/square-footage-calculator/" },
    { name: "Unit Price Calculator", url: "https://simplecalculators.io/unit-price-calculator/" },
    { name: "Weather Converter", url: "https://simplecalculators.io/weather/" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/" }
  ],
  "habit-tracker": [
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/" },
    { name: "Week Number Calculator", url: "https://simplecalculators.io/week-number/" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/" },
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/" }
  ],
  "health-tracker": [
    { name: "BMI Calculator", url: "https://simplecalculators.io/bmi/" },
    { name: "BMR Calculator", url: "https://simplecalculators.io/bmr-calculator/" },
    { name: "Body Fat Calculator", url: "https://simplecalculators.io/body-fat/" },
    { name: "TDEE Calculator", url: "https://simplecalculators.io/tdee/" }
  ],
  "meal-tracker": [
    { name: "Calorie Calculator", url: "https://simplecalculators.io/calories/" },
    { name: "Macro Calculator", url: "https://simplecalculators.io/macro-calculator/" },
    { name: "Protein Intake Calculator", url: "https://simplecalculators.io/protein-intake/" },
    { name: "Water Intake Calculator", url: "https://simplecalculators.io/water-intake/" }
  ],
  "movie-watch-tracker": [
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/" }
  ],
  "reading-tracker": [
    { name: "Percentage of a Number Calculator", url: "https://simplecalculators.io/percentage-of-a-number/" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/" }
  ],
  "sleep-tracker": [
    { name: "Sleep Calculator", url: "https://simplecalculators.io/sleep-calculator/" },
    { name: "Time Duration Calculator", url: "https://simplecalculators.io/time-duration/" },
    { name: "Hours to Days Calculator", url: "https://simplecalculators.io/hours-to-days-calculator/" },
    { name: "Days Until Calculator", url: "https://simplecalculators.io/days-until-calculator/" }
  ],
  "task-tracker": [
    { name: "Work Hours Calculator", url: "https://simplecalculators.io/work-hours/" },
    { name: "Time Card Calculator", url: "https://simplecalculators.io/time-card-calculator/" },
    { name: "Business Days Calculator", url: "https://simplecalculators.io/business-days/" },
    { name: "Workdays Between Dates Calculator", url: "https://simplecalculators.io/workdays-between-dates-calculator/" }
  ],
  "video-game-tracker": [
    { name: "Countdown Calculator", url: "https://simplecalculators.io/countdown/" },
    { name: "Hours to Days Calculator", url: "https://simplecalculators.io/hours-to-days-calculator/" },
    { name: "Date Difference", url: "https://simplecalculators.io/date-difference/" },
    { name: "Percent Change Calculator", url: "https://simplecalculators.io/percent-change/" }
  ],
  "workout-tracker": [
    { name: "One Rep Max Calculator", url: "https://simplecalculators.io/one-rep-max/" },
    { name: "Calories Burned Calculator", url: "https://simplecalculators.io/calories-burned/" },
    { name: "Heart Rate Zone Calculator", url: "https://simplecalculators.io/heart-rate-zone-calculator/" },
    { name: "Target Heart Rate Calculator", url: "https://simplecalculators.io/target-heart-rate/" }
  ]
};

export function getRelatedCalculators(slug: string): RelatedCalculator[] {
  return calculatorMap[slug] || [];
}
