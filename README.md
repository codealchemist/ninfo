# Ninfo

Turn your daily food log into a nutrition dashboard. Ninfo reads a meal log kept in a spreadsheet and shows each day's meals, macro trends, fat quality, glucose-spike risk and muscle protein synthesis pulses. It goes well beyond counting calories.

Everything is parsed in your browser. Nothing is uploaded to a server.

## Features

- **Today:** macro rings against your goals (also per kg of body weight or as % of calories), a comparison with yesterday or the week/month median, top food sources, and a short review of the day.
- **Meal cards:** a "Nutrition Facts" label per meal, with saturated/unsaturated and Ω-6/Ω-3 dials, a sortable items table, and copy as text or image.
- **Warnings:** high saturated fat, omega imbalance, trans fat and likely glucose spikes, per meal and per day.
- **mTORC1 pulses:** flags meals that likely triggered a muscle protein synthesis pulse. Leucine is estimated from each food's protein and source, close meals are combined, and the 3 h refractory period is respected. Tap the dumbbell for the reasoning.
- **Timeline:** a macro chart over 7/30/90 days or all time, filterable by food, plus a median panel (protein per kg, fasting time, water, mTORC1 pulses per day).
- **Body tracking:** bioimpedance (BIA), weight and liquid-intake pages.
- **Global report:** a one-page PDF of your overall trends.
- **AI analysis:** open Ninfo in a browser with an AI assistant and it can read your data and post its analysis back into the app (see [AI assistants](#ai-assistants-webmcp)).
- **Fasting timer**, share by link or QR code, English and Spanish, light and dark themes, installable as a PWA.

## Getting your data in

From the welcome screen, choose one of:

| Option | How |
|---|---|
| **Demo** | Explore every page with a bundled sample dataset. |
| **Upload a CSV** | Export your spreadsheet's `Registro` tab as CSV and drop it in. |
| **Link a Google Sheet** | Share the sheet as *Anyone with the link can view* and paste the URL with the `Registro` tab open. Ninfo fetches it fresh each visit, with no login. |

No spreadsheet yet? Download the template from the welcome screen ([`public/sample-spreadsheet.xlsx`](public/sample-spreadsheet.xlsx)).

### Spreadsheet tabs

| Tab | Used for | Needed? |
|---|---|---|
| `Registro` | The meal log: date, time, food, quantity, food type, grams, protein, carbs, fat, fiber, calories, fasting time, plus fat-quality columns (Ω-3/6/9, short/medium/long-chain, trans) | Yes |
| `Peso` | Weigh-ins: per-kg views, water goal, mTORC1 protein check | Optional |
| `Líquido` | Drinks log: water intake | Optional |
| `Bioimpedancia` | BIA measurements | Optional |

The optional tabs are read only from a linked Google Sheet.

## AI assistants (WebMCP)

Ninfo exposes its data to AI agents running in your browser through [WebMCP](https://github.com/webmachinelearning/webmcp). This currently works in ChatGPT's browser, in Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, and in Edge 150+. The agent can then:

- **read** your log exactly as entered: every food with portions, grams, macros and fat breakdown, blood glucose readings and fasting times, for a meal, a day or a whole period (with every distinct food eaten and the medians), plus weight, BIA and liquid data. Ninfo's own estimates (leucine, mTORC1 pulses, fat and glucose heuristics) are left out, so the assistant does its own analysis;
- **post its analysis** to a specific day, meal or section panel: a summary, recommendations, its own estimates (micronutrients, detailed fats, refined mTORC1) and observations.

An AI icon then appears on that panel. On a meal card it flips the card; on Today it sits next to the mTORC1 count. Analysis is plain text, stays in your browser, and is kept per data source. Try asking: *"Use Ninfo's get_day tool to analyze my latest day, then post your summary and recommendations with show_ai_analysis."* Naming the tools helps; every read result also tells the assistant which `show_ai_analysis` target to post to.

| Tool | Purpose |
|---|---|
| `get_app_overview` | What's loaded, the app's heuristics, and where analysis can be shown |
| `get_day` | One day in full, with each meal's target id |
| `get_meal` | One meal in full, by default the meal card open in the app |
| `get_timeline` | Daily rows and medians for 7/30/90 days or all time |
| `get_body_data` | Weight, BIA or liquids from a linked sheet |
| `show_ai_analysis` | Displays analysis on a day, meal or panel |

Without WebMCP, the app is unchanged and no AI icons appear. The tools live in [`src/webmcp`](src/webmcp).

## Development

Requires Node 20 (see [`.nvmrc`](.nvmrc)).

```sh
npm install
npm run dev       # http://localhost:7171
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build on port 7171
```

### Dev-only Food check

`/app/food-check` compares the linked sheet's `Alimentos` tab with USDA FoodData Central. It exists only in development: production builds leave it out entirely. To use your own USDA API key, put it in a `.env` file (gitignored):

```sh
USDA_API_KEY=your-key
```

## Deployment

Hosted on Netlify ([`netlify.toml`](netlify.toml) handles the build and the single-page-app redirects):

```sh
npm run deploy:preview   # draft deploy
npm run deploy           # production
```

## Tech stack

React 18, TypeScript, Vite, Zustand, React Router, Chart.js, i18next, PapaParse and jsPDF.

## License

ISC © [Alberto Miranda](https://albertomiranda.com.ar)
