
# SimpleTrackers.io

A production-ready Astro website offering simple, private, browser-based tracking tools. No login required, data stays in your browser.

## Project Features
- 10 tracker tools, each with its own page
- Clean, modern, card-first design
- Responsive, accessible, SEO-optimized
- LocalStorage for all data
- No backend, no authentication
- Modular, easy to expand
- AdSense-ready layout (dev placeholders)
- Legal and trust pages

## Trackers
- Reading Tracker
- Habit Tracker
- Plant Watering Tracker
- Bird Sighting Tracker
- Workout Log
- Cycling Mileage Tracker
- Garden Harvest Log
- Pet Medication Tracker
- Movie Watch Tracker
- Custom Tracker (user-defined fields)

## Setup Instructions

### Prerequisites
- Node.js v22+
- npm

### Local Development
1. Clone the repo
2. Install dependencies:
	```bash
	npm install
	```
3. Start the dev server:
	```bash
	npm run dev
	```
4. Visit http://localhost:4321

### GitHub Workflow
- Commit changes to main branch
- Use feature branches for new trackers/components
- PRs require review

### Vercel Deployment
- Connect repo to Vercel
- Deploy main branch
- Astro builds for static hosting

## File Structure
- `/src/pages` — tracker pages & legal pages
- `/src/components` — reusable UI components
- `/public` — static assets

## Privacy
- No accounts
- Data stored in browser
- No external database
- AdSense placeholders only in dev

## License
MIT

---
For questions or feedback, see `/contact` page.
