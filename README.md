# Ozark Wire

**More context. Less noise. Hard assets, sound money, and the map.**

A polished static news desk inspired by Citadel Wire: dark terminal aesthetic, sticky ticker header, numbered briefs, category chips, odds bars, talk cards, and JSON editions. No build step. Not affiliated with Citadel Wire.

## View locally

From this directory:

```bash
cd /workspace/ozark-wire
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

> **Note:** Opening `index.html` via `file://` will not load JSON (browser CORS). Use a tiny HTTP server.

Alternate:

```bash
npx --yes serve -p 8080
```

## Structure

```
ozark-wire/
├── index.html          # Shell + sticky header + nav
├── css/styles.css      # Dark Citadel-style news-desk theme
├── js/app.js           # Loads content/*.json, switches views
├── js/i18n.js          # EN/NL/RU UI chrome dictionaries + lang switcher
├── content/
│   ├── index.json      # Manifest of Daily/Weekly/Forward editions
│   ├── daily-*.json
│   ├── weekly-*.json
│   ├── forward-*.json
│   ├── odds.json       # Fixed path — prediction markets board
│   ├── talks.json      # Fixed path — interviews + podcasts
│   ├── favorites.json  # Featured guests / shows (★)
│   ├── youtube-subs.json  # Christopher YouTube subscription universe
│   ├── reads.json
│   ├── ukraine.json    # Ukraine war desk (map + alt wires)
│   ├── ews.json        # EWS / Apocalypse Early Warning threat level (weekday morning)
│   ├── btc-chain.json   # BTC tip height + medium next-block fee (sat/vB, mempool.space)
│   ├── collum-quote.json # Dave Collum daily footer quote bank
│   └── portfolio.json  # Model Portfolio weights / day% / YTD% vs SPX (no $ totals)
├── scripts/
│   └── export_portfolio.py  # Rebuild portfolio.json from 10% Plan xlsx
└── README.md
```

## Nav

| Tab     | Purpose                                                                 |
|---------|-------------------------------------------------------------------------|
| Daily   | Weekday morning brief + compact Odds strip + Fresh talks rail           |
| Weekly  | Week distilled                                                          |
| Forward | Longer-horizon scenarios                                                |
| Talks   | Interviews (Alden / Gromen / Doomberg / Yarvin / Collum) + podcast desk |
| Ukraine | War desk (*Provoked*/Duran realist): pulsing AMK map + TASS / TF Rodovka / Duran / Diesen / Sonar21 / Antiwar–Horton circle; WSJ/FT headlines only |
| Odds    | Polymarket board: Brazil, French/EU, Hormuz/energy risk, FOMC; NL when live |
| Model Portfolio | Holdings desk (Alt investments as Other); Ex-MUEL toggle; YTD chart + YTD/1Y/3Y vs SPX (no $ totals) |
| About   | Beat + how Grok Bot drops briefs / refreshes desk JSON                  |

Odds, talks, favorites, youtube-subs, reads, **ukraine**, EWS threat level, and portfolio are **fixed files** (`content/odds.json`, `content/talks.json`, `content/favorites.json`, `content/youtube-subs.json`, `content/reads.json`, `content/ukraine.json`, `content/ews.json`, `content/btc-chain.json`, `content/portfolio.json`) — they are not listed in `index.json`.

### Portfolio refresh

Christopher’s **10% Plan.xlsx** is the portfolio source of truth. Morning sync from the CPMOffice Daily Data path whenever numbers change; local export input defaults to `/workspace/uploads/10pct-plan.xlsx`.

```bash
python3 scripts/export_portfolio.py /workspace/uploads/10pct-plan.xlsx
```

Public fields only: symbol, sector, weight %, last price, day %, weighted day % (full + **ex-MUEL**), YTD % series (full + **ex-MUEL**), and horizon stats (calendar YTD / 1Y / 3Y). Never commit market values, shares, cost basis, or absolute portfolio dollars. **Do not use the Plot sheet** for published performance.

**Weights:** Rebased to the full book **including Alternative investments** (UI label: **Other**). Other sleeve = flat 0%. Cash sleeve = **USFR** ETF total return (Yahoo). Never publish the word Insurance in the UI.

**Performance method:** Weight-snapshot backtest — **current weights × public daily price history** (Yahoo). Labeled as reconstruction, **not** actual trade / book history. Do **not** proxy horizons with avg purchase / unrealized gain %.

**Ex-MUEL:** UI toggle. Holdings table, day %, YTD chart, and YTD/1Y/3Y stats drop MUEL and renormalize remaining weights to 100% (Other stays flat 0% day; Cash = USFR). Horizons show portfolio %, SPX (^GSPC), and relative. Toggle OFF restores full-book weights including MUEL.

**Chart:** Calendar YTD cumulative % under current weights. UI title: **Model Portfolio** (`#model-portfolio`). No methodology disclaimer on the page.

## Edition JSON schema (Daily / Weekly / Forward)

```json
{
  "type": "daily",
  "date": "2026-09-17",
  "label": "SAMPLE",
  "title": "Daily Brief",
  "prices": { "btc": 83636, "gold": 4194, "shaGoldPrem": 20, "copper": 6.63, "cattle": 220.9, "feeder": 334.4, "wti": 89.51, "brent": 96.20, "tenY": 5.26, "muel": 460 },
  "items": [
    {
      "n": 1,
      "category": "GEO",
      "headline": "Headline text",
      "bullets": [
        "First bullet — context.",
        "Second bullet — implication."
      ]
    }
  ]
}
```

**`type`:** `daily` | `weekly` | `forward`  
**`category`:** `BTC` | `GOLD` | `COPPER` | `MACRO` | `10Y` | `GEO` | `EU` | `ENERGY` | `DIESEL` | `LIQUIDITY` | `INTEL` | `TECH`  
**`prices` keys:** `btc`, `gold`, optional `shaGoldPrem` (Shanghai gold vs COMEX/LBMA in **USD/oz**; positive = premium, negative = discount → **subline under GOLD**, e.g. `SHA +$20`), `copper` ($/lb), **`cattle`** (CME Live Cattle **LE**, cents/lb → ticker `LE`; Yahoo `LE=F`), **`feeder`** (CME Feeder Cattle **GF**, cents/lb → ticker `GF`; Yahoo `GF=F`), `wti`, optional `brent`, `tenY` (percent number → UI shows `5.26%`), optional `muel` (Paul Mueller Co. equity when quoted).  
**`label`:** optional; use `"SAMPLE"` for demo content (renders as a badge).

## Odds schema (`content/odds.json`)

```json
{
  "updated": "2026-09-29T12:00:00-05:00",
  "markets": [
    {
      "id": "brazil-2026",
      "title": "Brazil 2026 presidential",
      "source": "Polymarket",
      "url": "https://polymarket.com/event/brazil-presidential-election",
      "volume": "$157M",
      "outcomes": [
        { "name": "Flávio Bolsonaro", "prob": 0.598 },
        { "name": "Luiz Inácio Lula da Silva", "prob": 0.405 }
      ],
      "note": "optional one-liner"
    }
  ]
}
```

- `prob` is 0–1 (UI renders amber probability bars as %).
- Leading outcome (highest `prob`) drives the large % and top bar.
- Optional: `volume`, `note`, `label: "SAMPLE"` if data is placeholder.


## Ukraine schema (`content/ukraine.json`)

Dedicated war desk (nav: **Ukraine**). Pulsing SVG front line at top from AMK Mapping best-guess; update feed below.

```json
{
  "updated": "2026-10-02T10:50:00-05:00",
  "title": "Ukraine",
  "blurb": "War desk — maps + alt wires. Mainstream US/EU excluded except major WSJ/FT headlines.",
  "map": {
    "asOf": "2026-10-02",
    "source": "AMK Mapping",
    "sourceUrl": "https://x.com/AMK_Mapping_",
    "telegramUrl": "https://t.me/AMK_Mapping",
    "disclaimer": "Best-guess front line…",
    "viewBox": "0 0 900 600",
    "outlinePath": "M… Z",
    "frontline": [[x,y], …],
    "frontlineLonLat": [[lon,lat], …],
    "hotspots": [{ "id": "kyiv", "name": "Kyiv", "lon": 30.52, "lat": 50.45, "x": 423.1, "y": 152.4, "note": "…", "pulse": "strike" }]
  },
  "sources": [
    { "id": "tass", "name": "TASS", "url": "https://tass.com/", "kind": "wire", "major": true }
  ],
  "items": [
    {
      "id": "unique-id",
      "date": "2026-10-02",
      "source": "TASS",
      "sourceId": "tass",
      "category": "FRONT",
      "headline": "…",
      "summary": "…",
      "url": "https://…",
      "tags": ["Kharkov"]
    }
  ]
}
```

**`category`:** `FRONT` | `MAP` | `AIR` | `DIPLO` | `SITREP` | `ANALYSIS` | `INTERVIEW` | `WIRE` | `WSJ` | `FT`  
**Major sources (always):** TASS, TF Rodovka (Rybar-related Telegram maps if Rodovka feed down), AMK Mapping (`@AMK_Mapping_`), The Duran, **Glenn Diesen**, **Sonar21** (Larry Johnson), Antiwar.com, Scott Horton, Kyle Anzalone, Dave DeCamp, Moon of Alabama, Military Summary.

**Desk frame:** Scott Horton’s *Provoked* + The Duran (realist / NATO-expansion / negotiation-skeptical of Western narrative). Not Atlanticist “unprovoked / Ukraine is winning” voice. Optional `frame` object in `ukraine.json`.  
**Also:** Judging Freedom / Mercouris-cited guests.  
**Exclude:** mainstream US/EU wires **except** major **WSJ** or **FT** headlines.  
**Map:** Reproject `frontlineLonLat` with the stored `bbox`/`project` when AMK posts a material line change; keep `outlinePath` stable. Hotspot `pulse`: `hot` | `strike` | `contested`.

## Talks schema (`content/talks.json`)

```json
{
  "updated": "2026-09-29T12:00:00-05:00",
  "interviews": [
    {
      "guest": "Luke Gromen",
      "show": "Macroscopic Podcast",
      "title": "Episode title",
      "date": "2026-09-24",
      "url": "https://...",
      "takeaway": "one sentence",
      "tags": ["MACRO", "GOLD"]
    }
  ],
  "podcasts": [
    {
      "show": "Forward Guidance",
      "title": "Episode title",
      "date": "2026-09-25",
      "url": "https://...",
      "why": "why it made the desk"
    }
  ]
}
```

**Public sub lists:** `content/podcast-subs.json` (Podcast Addict ~120 shows), `content/youtube-subs.json` (~88 channels), and `content/reads.json` (39 curated Audible titles). Nav: **Podcast Subs** / **YouTube Subs** / **Reads** — searchable alphabetized lists (subs: name+link; Reads: title+author). Exclusions in `content/subs-excludes.json` (dutch / after party / camp of the saints / brownstone; megyn kelly on YouTube only).

**Show universe:** `content/youtube-subs.json` — Christopher’s YouTube subscription list (podcast/show desk). Morning routine scans these channels (RSS / YouTube feeds where available); do not invent URLs.  
**Interview watch list / favorites:** see `content/favorites.json` (Luke Gromen, Lyn Alden, Doomberg, Curtis Yarvin, Dave Collum / David Collum, Michael Howell — not Nik Bhatia). Featured shows: TFTC, What Bitcoin Did, BTC Sessions, Scott Horton Show, The Duran, plus **Luke Gromen - FFTT, LLC** (his own channel uploads = favorite-show). Any episode on any subscription channel that features a favorite guest → Featured ★. UI stars matches and pins them under **Featured**.  
**Dedupe:** `js/app.js` collapses duplicate episodes by url / title+date (richest wins) and podcasts to one card per show; interview URLs win over the same episode in podcasts.

Do **not** invent interview URLs or odds. If a source cannot be fetched, set `"label": "SAMPLE"` and leave lists empty/partial.

## Drop a new brief

1. Add a file, e.g. `content/daily-2026-09-18.json`, matching the edition schema.
2. Prepend an entry in `content/index.json` (newest first per type).
3. Refresh the browser.

## Grok Bot morning routine

On weekday mornings, a Grok Bot job should:

1. **Daily brief** — research overnight tape (BTC, gold, **Shanghai gold prem/disc**, copper, **CME live cattle LE** / **feeder GF**, energy, macro, geo, intel); write `content/daily-YYYY-MM-DD.json` (include `prices.shaGoldPrem` from FindBullionPrices SHAU AM − COMEX; `prices.cattle` from Yahoo `LE=F` cents/lb; `prices.feeder` from Yahoo `GF=F` cents/lb); prepend in `content/index.json`.
2. **Overwrite `content/odds.json`** — fetch live Polymarket (gamma API or site) for:
   - Brazil 2026 presidential (overall winner)
   - Next FOMC decision
   - Other major financial/news markets on the desk
   - Set `updated` to America/Chicago ISO timestamp
3. **Overwrite `content/ews.json`** — fetch live emergency level from [Apocalypse Early Warning System](https://ews.kylemcdonald.net/) (dashboard: `https://pub-49bb6a6f314c47be9b481c25e5f6ca9e.r2.dev/dashboard.json` → `current.emergencyLevel`). Write `emergencyLevel`, `levelText` (`N/5`), `alertLevel`, `asOf`, `updated` (America/Chicago). Do **not** invent the level. Desk chip on the Daily/front ticker links to the live site.
4b. **Overwrite `content/ukraine.json`** — weekday morning Ukraine war desk:
   - Refresh **map** from [AMK Mapping](https://x.com/AMK_Mapping_) / [Telegram](https://t.me/AMK_Mapping): update `frontlineLonLat` (reproject to `frontline` x,y), hotspots, `asOf`, `notes`. Do not invent lines far from AMK.
   - Scan **TASS**, **TF Rodovka** (fallback: Rybar EN / related Telegram war maps), **The Duran** (RSS/YT), **Glenn Diesen** (Greater Eurasia), **Sonar21**, **Antiwar.com** / **Dave DeCamp**, **Scott Horton**, **Kyle Anzalone**, **Moon of Alabama** Ukraine threads, **Military Summary**, Judging Freedom guests Mercouris cites.
   - Keep desk **frame** (*Provoked* + Duran realist / NATO-expansion lens); do not Atlanticize the copy.
   - Optional: **one** major **WSJ** or **FT** headline only if it truly moves the desk.
   - **Exclude** other mainstream US/EU (CNN, BBC, NYT, Reuters, AP, Guardian, etc.).
   - Newest items first; real URLs only; set `updated` to America/Chicago ISO.

4. **Overwrite `content/talks.json`** — scan RSS/YouTube from `content/youtube-subs.json` (at least favorite shows + hosts likely to seat favorites: Thoughtful Money, Wealthion, Kitco, Palisades, Forward Guidance, Macro Voices, David Lin, Natalie Brunell, Soar, etc.) + search for new Alden / Gromen / Doomberg / Yarvin / Collum / Howell long-forms; keep newest first; only real URLs. Honor `content/favorites.json` (do not invent URLs; do not star Nik Bhatia). UI dedupes by url/title+date and one-card-per-show; Featured pins favorite guests/shows (incl. Luke Gromen channel uploads).
5. Leave Weekly / Forward alone unless it is that cadence’s day.
6. Do **not** require a rebuild — static files only. Do **not** deploy from the routine unless separately asked.

Suggested fetch helpers:

```bash
# Polymarket event (example)
curl -s 'https://gamma-api.polymarket.com/events?slug=brazil-presidential-election'

# Podcast / YouTube RSS (examples from youtube-subs.json universe)
curl -s 'https://feeds.megaphone.fm/forwardguidance'
curl -s 'https://feeds.transistor.fm/making-sense'   # Eurodollar University
curl -s 'https://anchor.fm/s/11e95d20/podcast/rss'  # BTC Sessions

# CME cattle (cents/lb; Yahoo USX)
curl -s 'https://query1.finance.yahoo.com/v8/finance/chart/LE=F?interval=1d&range=5d' | python3 -c "import sys,json; m=json.load(sys.stdin)['chart']['result'][0]['meta']; print('LE', round(m['regularMarketPrice'],2))"
curl -s 'https://query1.finance.yahoo.com/v8/finance/chart/GF=F?interval=1d&range=5d' | python3 -c "import sys,json; m=json.load(sys.stdin)['chart']['result'][0]['meta']; print('GF', round(m['regularMarketPrice'],2))"

# EWS threat level (weekday mornings)
curl -s 'https://pub-49bb6a6f314c47be9b481c25e5f6ca9e.r2.dev/dashboard.json' | python3 -c "import sys,json; c=json.load(sys.stdin)['current']; print(c['emergencyLevel'], c.get('alertLevel'), c.get('asOf'))"
```


## Shanghai gold premium (`shaGoldPrem`) — morning refresh

China physical demand / arb signal. Desk: subline under **GOLD** as `SHA +$N` / `SHA -$N` (green premium / red discount). No separate SHA+/- ticker cell.

1. Open [FindBullionPrices — Shanghai gold](https://findbullionprices.com/spot-prices/gold-price/shanghai).
2. Latest row in **Last 30 Trading Days**: take `AM $/oz` (SHAU) and `COMEX $/oz`.
3. Set `prices.shaGoldPrem` = `round(AM_USD − COMEX_USD)` (integer USD/oz).
4. Optional: note source date in the GOLD bullet if the print matters to the brief.

Alternates: World Gold Council Weekly Markets Monitor (Au9999 vs LBMA PM), SGE English daily report, Kitco/Reuters snippets. Do **not** invent the number. Detail note: `content/SHA-GOLD-PREM.md`.



## EWS threat level (`ews.json`) — morning refresh

Compact **EWS** chip on the Daily/front ticker. Source of truth: [ews.kylemcdonald.net](https://ews.kylemcdonald.net/) (Apocalypse Early Warning System — private-jet concurrent-activity anomaly, emergency levels 1–5).

1. Weekday mornings, fetch `https://pub-49bb6a6f314c47be9b481c25e5f6ca9e.r2.dev/dashboard.json`.
2. Read `current.emergencyLevel` (integer 1–5) and `current.alertLevel` / `current.asOf`.
3. Overwrite `content/ews.json` with `label: "EWS"`, `levelText: "N/5"`, colors implied by level (site dial: 1 white → 5 deep red). Link the chip to `https://ews.kylemcdonald.net/`.
4. Do **not** invent the level. If the fetch fails, leave the prior file in place.

## Sample content

Edition briefs labeled **SAMPLE** may ship for format demos. Odds and talks seeds should prefer **live** Polymarket + RSS data; mark `"label": "SAMPLE"` only when inventing structure without numbers/URLs.

Voice: Citadel Wire–style — terse, high-signal, hard assets + map.



## Language switcher (EN / NL / RU)

Flag buttons sit in the **top-right** of the brand row (order: US · NL · RU). They are black SVG chips. Clicking a flag translates the full visible SPA in-page; English restores the source text.

Chrome's translate bar is opted out (`<meta name="google" content="notranslate">` plus `translate="no"` on `<html>`). There is no Google Website Translator widget and no `googtrans` cookie, so dismissing Chrome UI cannot snap the page back to English. UI chrome comes from dictionaries in `js/i18n.js`. Dynamic copy (briefs, talks, odds, and the rest) is translated from the browser via `translate.googleapis.com` and written into the text nodes. Results are cached in `sessionStorage`.

- **Default:** English (`en`). Choice persists in `localStorage` key `ozark-wire-lang`.
- **What is translated:** The full visible SPA — brand **Ozark Wire**, nav (including Model Portfolio), section titles, buttons, briefs, Talks, Odds, Model Portfolio (Ex-MUEL, chart labels, holdings sectors), Podcast Subs, YouTube Subs, Reads, Odds, Ukraine, About, and word ticker labels such as **GOLD** / **COPPER**. Dictionaries keep chrome stable; content translation re-scans after every view change.
- **What stays unchanged:** Finance **codes** only — BTC, MUEL, SPX, LE, GF, SHA+/−, WTI, Brent, 10Y, EWS, and ticker-like portfolio symbols — via selective `notranslate`. Flag chips (SVG) stay put. Numeric prices stay untranslated.
- **Quotes:** One row, on the masthead ticker. The edition price strip is not rendered (it repeated the same tape).
- **No server API keys.**

## Donate

Footer CTA: **Donate to OpenSats** → [opensats.org/donate](https://opensats.org/donate).

## License

Personal / internal desk use. Sample prices are illustrative, not live feeds. Prediction-market odds are snapshots, not advice.
