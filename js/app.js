/**
 * Ozark Wire — static edition loader
 * Daily | Weekly | Forward | Talks | Podcast Subs | YouTube Subs | Reads | Odds | Ukraine | Model Portfolio | About
 */

(function () {
  "use strict";

  const CONTENT_BASE = "content/";
  const INDEX_URL = CONTENT_BASE + "index.json";
  const ODDS_URL = CONTENT_BASE + "odds.json";
  const TALKS_URL = CONTENT_BASE + "talks.json";
  const FAVORITES_URL = CONTENT_BASE + "favorites.json";
  const PORTFOLIO_URL = CONTENT_BASE + "portfolio.json";
  const EWS_URL = CONTENT_BASE + "ews.json";
  const EWS_SITE = "https://ews.kylemcdonald.net/";
  const BTC_CHAIN_URL = CONTENT_BASE + "btc-chain.json";
  const PODCAST_SUBS_URL = CONTENT_BASE + "podcast-subs.json";
  const YOUTUBE_SUBS_URL = CONTENT_BASE + "youtube-subs.json";
  const READS_URL = CONTENT_BASE + "reads.json";
  const UKRAINE_URL = CONTENT_BASE + "ukraine.json";
  const SUBS_EXCLUDES_URL = CONTENT_BASE + "subs-excludes.json";
  const COLLUM_QUOTE_URL = CONTENT_BASE + "collum-quote.json";
  const LIVE_QUOTES_URL = "api/quotes";
  const LIVE_FED_NEXT_URL = "api/fed-next";
  /** Client-side ticker refresh interval (ms). 3 min within the 2–5 min desk window. */
  const PRICE_REFRESH_MS = 3 * 60 * 1000;
  /** Fed-next odds refresh (ms). Same desk cadence as quotes. */
  const FED_NEXT_REFRESH_MS = 3 * 60 * 1000;
  /** Re-evaluate open/closed label colors between price fetches. */
  const MARKET_HOURS_MS = 60 * 1000;

  const DEFAULT_FAVORITES = {
    guests: [
      { name: "Luke Gromen", aliases: ["Luke Gromen"] },
      { name: "Lyn Alden", aliases: ["Lyn Alden"] },
      { name: "Doomberg", aliases: ["Doomberg"] },
      { name: "Curtis Yarvin", aliases: ["Curtis Yarvin"] },
      { name: "Dave Collum", aliases: ["Dave Collum", "David Collum"] },
      { name: "Michael Howell", aliases: ["Michael Howell", "CrossBorder Cap", "CrossBorder Capital"] },
    ],
    excludeGuests: ["Nik Bhatia", "Nikhil Bhatia"],
    shows: [
      "TFTC",
      "What Bitcoin Did",
      "BTC Sessions",
      "Scott Horton Show",
      "The Duran",
    ],
  };

  const state = {
    editions: [],
    byType: {},
    currentView: "daily",
    cache: {},
    odds: null,
    talks: null,
    favorites: null,
    portfolio: null,
    ews: null,
    btcChain: null,
    podcastSubs: null,
    youtubeSubs: null,
    subsExcludes: null,
    collumQuote: null,
    ukraine: null,
    ukraineFilter: "all",
    lastPrices: null,
    seedPrices: null,
    livePrices: null,
    priceRefreshTimer: null,
    marketHoursTimer: null,
    fedNextTimer: null,
    fedNext: null,
    exMuel: false,
    chartRange: "ytd", // ytd | sixMonth | oneYear | threeYear
  };

  const els = {};

  function t(key, vars) {
    if (window.OzarkI18n && typeof window.OzarkI18n.t === "function") {
      return window.OzarkI18n.t(key, vars);
    }
    return key;
  }

  function reapplyChrome() {
    if (window.OzarkI18n && typeof window.OzarkI18n.applyDom === "function") {
      window.OzarkI18n.applyDom();
    }
  }

  /** True for ticker/finance codes that must stay untranslated (BTC, MUEL, …). */
  function isFinanceCode(label) {
    if (window.OzarkI18n && typeof window.OzarkI18n.isFinanceCode === "function") {
      return window.OzarkI18n.isFinanceCode(label);
    }
    var s = String(label || "").trim().toUpperCase();
    return /^(BTC|MUEL|WTI|BRENT|SPX|EWS|10Y|LE|GF|SHA\+\/-|NLY)$/.test(s);
  }

  function codeClass(label) {
    return isFinanceCode(label) ? " notranslate" : "";
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Strip tags/entities from RSS-style HTML so takeaways render as clean prose. */
  function stripHtml(html) {
    if (html == null || html === "") return "";
    var s = String(html);
    if (s.indexOf("<") === -1 && s.indexOf("&") === -1) {
      return s.replace(/\s+/g, " ").trim();
    }
    s = s.replace(/<\s*br\s*\/?\s*>/gi, " ");
    s = s.replace(/<\s*\/\s*p\s*>/gi, " ");
    s = s.replace(/<\s*\/\s*div\s*>/gi, " ");
    s = s.replace(/<\s*\/\s*li\s*>/gi, " ");
    var tmp = document.createElement("div");
    tmp.innerHTML = s;
    var text = tmp.textContent || tmp.innerText || "";
    return text.replace(/\s+/g, " ").trim();
  }

  function formatMoney(n, decimals) {
    if (n == null || Number.isNaN(n)) return "—";
    const d = decimals != null ? decimals : n < 1000 ? 2 : 0;
    return (
      "$" +
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })
    );
  }

  /** US 10Y yield — stored as percent number e.g. 5.26 → "5.26%" */
  function formatYield(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return (
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%"
    );
  }

  function formatCopper(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return formatMoney(n, 2);
  }

  /** Shanghai gold premium vs COMEX/LBMA — USD/oz; +prem / −disc */
  function formatShaPrem(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Math.round(Number(n));
    if (v > 0) return "+$" + v;
    if (v < 0) return "-$" + Math.abs(v);
    return "$0";
  }

  /** CME cattle futures — cents/lb (Yahoo LE=F live / GF=F feeder; USX). */
  function formatCattle(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return (
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "¢"
    );
  }

  function goldShaSub(prices) {
    if (prices == null || prices.shaGoldPrem == null) return null;
    if (Number.isNaN(Number(prices.shaGoldPrem))) return null;
    var prem = Number(prices.shaGoldPrem);
    return {
      text: "SHA " + formatShaPrem(prem),
      tone: prem > 0 ? "up" : prem < 0 ? "down" : null,
      title: "Shanghai gold premium vs COMEX (USD/oz)",
    };
  }

  function formatDate(iso) {
    if (!iso) return "";
    const parts = String(iso).split("T")[0].split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] || 1);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatShortDate(iso) {
    if (!iso) return "";
    const parts = String(iso).split("T")[0].split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] || 1);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function pct(prob) {
    if (prob == null || Number.isNaN(Number(prob))) return "—";
    return Math.round(Number(prob) * 100) + "%";
  }

  function formatBlockHeight(n) {
    if (n == null || Number.isNaN(Number(n))) return null;
    return Number(n).toLocaleString("en-US");
  }

  function formatFeeSatVb(n) {
    if (n == null || Number.isNaN(Number(n))) return null;
    return (
      Number(n).toLocaleString("en-US", {
        maximumFractionDigits: 1,
      }) + " sat/vB"
    );
  }

  /** Medium next-block fee + tip height under BTC (from content/btc-chain.json). */
  function btcChainSub(chain) {
    if (!chain) return "";
    var feeRaw =
      chain.mediumFeeSatVb != null ? chain.mediumFeeSatVb : chain.halfHourFee;
    if (
      feeRaw == null &&
      chain.fees &&
      chain.fees.halfHourFee != null
    ) {
      feeRaw = chain.fees.halfHourFee;
    }
    var h = formatBlockHeight(chain.height);
    var f = formatFeeSatVb(feeRaw);
    if (!h && !f) return "";
    var parts = [];
    if (h) parts.push(h);
    if (f) parts.push(f);
    return parts.join(" · ");
  }


  /**
   * TradingView chart symbols for ticker cells (open in new tab).
   * BTCUSD, XAUUSD, HG1!, LE1!, GF1!, CL1!, BRN1!, TVC:US10Y, MUEL.
   */
  function tradingViewUrl(label) {
    var map = {
      BTC: "BTCUSD",
      GOLD: "XAUUSD",
      COPPER: "HG1!",
      LE: "LE1!",
      GF: "GF1!",
      WTI: "CL1!",
      BRENT: "BRN1!",
      "10Y": "TVC:US10Y",
      MUEL: "MUEL",
    };
    var sym = map[label];
    if (!sym) return null;
    return (
      "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(sym)
    );
  }

  /**
   * Market-open hours (America/Chicago). Weekends closed except BTC.
   *
   * BTC: always open 24/7 — label ALWAYS green (never white).
   * GOLD / COPPER (COMEX / CME Globex metals): Sun 17:00 → Fri 16:00 CT;
   *   daily maintenance halt Mon–Thu 16:00–17:00 CT.
   * WTI / BRENT (CME Globex energy; Brent via Yahoo BZ=F / TV BRN1!): same
   *   Globex window Sun 17:00 → Fri 16:00 CT, halt Mon–Thu 16:00–17:00 CT.
   * LE / GF (CME livestock Globex): Mon–Fri 08:30–13:05 CT.
   * 10Y / MUEL (US rates / equity — mark open on NYSE weekdays):
   *   Mon–Fri 08:30–15:00 CT.
   */
  function chicagoClock(d) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d || new Date())
      .forEach(function (p) {
        if (p.type !== "literal") parts[p.type] = p.value;
      });
    var wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var wd = wdMap[parts.weekday];
    var hour = parseInt(parts.hour, 10);
    var minute = parseInt(parts.minute, 10);
    if (hour === 24) hour = 0;
    return { wd: wd, mins: hour * 60 + minute };
  }

  function isGlobexMetalsEnergyOpen(clock) {
    var wd = clock.wd;
    var m = clock.mins;
    var openSun = 17 * 60;
    var closeFri = 16 * 60;
    var haltStart = 16 * 60;
    var haltEnd = 17 * 60;
    if (wd === 6) return false; // Saturday
    if (wd === 0) return m >= openSun; // Sunday after 17:00
    if (wd >= 1 && wd <= 4) {
      // Mon–Thu: open except 16:00–17:00 halt
      return m < haltStart || m >= haltEnd;
    }
    if (wd === 5) return m < closeFri; // Friday before 16:00
    return false;
  }

  function isLivestockOpen(clock) {
    if (clock.wd < 1 || clock.wd > 5) return false;
    return clock.mins >= 8 * 60 + 30 && clock.mins < 13 * 60 + 5;
  }

  function isNyseOpen(clock) {
    if (clock.wd < 1 || clock.wd > 5) return false;
    return clock.mins >= 8 * 60 + 30 && clock.mins < 15 * 60;
  }

  /** BTC always true. Others per hours above. */
  function isTickerMarketOpen(label, now) {
    if (label === "BTC") return true;
    var clock = chicagoClock(now);
    if (label === "GOLD" || label === "COPPER") return isGlobexMetalsEnergyOpen(clock);
    if (label === "WTI" || label === "BRENT") return isGlobexMetalsEnergyOpen(clock);
    if (label === "LE" || label === "GF") return isLivestockOpen(clock);
    if (label === "10Y" || label === "MUEL") return isNyseOpen(clock);
    return false;
  }

  function mergePrices(seed, live) {
    var out = {};
    if (seed) {
      Object.keys(seed).forEach(function (k) {
        out[k] = seed[k];
      });
    }
    if (live) {
      Object.keys(live).forEach(function (k) {
        if (live[k] != null && !Number.isNaN(Number(live[k]))) {
          out[k] = live[k];
        }
      });
    }
    return out;
  }

  function activePrices() {
    return mergePrices(state.seedPrices, state.livePrices);
  }

  async function fetchLiveQuotes() {
    try {
      var res = await fetch(LIVE_QUOTES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("quotes " + res.status);
      var data = await res.json();
      if (!data || !data.prices) throw new Error("no prices");
      state.livePrices = data.prices;
      var merged = activePrices();
      if (Object.keys(merged).length) {
        setTicker(merged);
      }
      return true;
    } catch (err) {
      // Fall back to morning/daily JSON seed (already on ticker).
      console.warn("live quotes failed; keeping seed", err);
      if (state.seedPrices) setTicker(state.seedPrices);
      return false;
    }
  }

  function startLivePriceRefresh() {
    if (state.priceRefreshTimer) clearInterval(state.priceRefreshTimer);
    if (state.marketHoursTimer) clearInterval(state.marketHoursTimer);
    fetchLiveQuotes();
    state.priceRefreshTimer = setInterval(fetchLiveQuotes, PRICE_REFRESH_MS);
    state.marketHoursTimer = setInterval(function () {
      var p = activePrices();
      if (p && Object.keys(p).length) setTicker(p);
    }, MARKET_HOURS_MS);
  }

  function pctWhole(p) {
    if (p == null || Number.isNaN(Number(p))) return "—";
    return Math.round(Number(p) * 100) + "%";
  }

  /** Build compact FED NEXT line; prefer hike probability (Christopher). */
  function formatFedNextLabel(data) {
    if (!data) return "FED NEXT: …";
    if (data.label && typeof data.label === "string" && data.hike != null) {
      return data.label;
    }
    if (data.hike == null && data.hold == null) return "FED NEXT: …";
    return (
      "FED NEXT: hike " +
      pctWhole(data.hike) +
      " / hold " +
      pctWhole(data.hold)
    );
  }

  function renderFedNext(data) {
    var el = els.fedNext;
    if (!el) return;
    if (!data || (data.hike == null && data.hold == null)) {
      el.classList.add("is-loading");
      el.textContent = "FED NEXT: …";
      return;
    }
    state.fedNext = data;
    el.classList.remove("is-loading");
    var hikePct = pctWhole(data.hike);
    var holdPct = pctWhole(data.hold);
    el.innerHTML =
      'FED NEXT: hike <span class="fn-hike notranslate">' +
      hikePct +
      '</span> / hold <span class="fn-hold notranslate">' +
      holdPct +
      "</span>";
    var src = data.source ? String(data.source) : "desk";
    var meet = data.meetingLabel || data.meeting || "next FOMC";
    el.title = src + " · " + meet + " · hike " + hikePct + " / hold " + holdPct;
    if (data.url) el.href = data.url;
  }

  /** Derive hike/hold from odds.json FOMC market when live API is down. */
  function fedNextFromOdds(odds) {
    if (!odds || !Array.isArray(odds.markets)) return null;
    var m =
      odds.markets.find(function (x) {
        return x && (x.id === "fomc-oct" || /fomc|fed decision/i.test(x.id + " " + (x.title || "")));
      }) || null;
    if (!m || !Array.isArray(m.outcomes)) return null;
    var hike = 0;
    var hold = 0;
    var cut = 0;
    m.outcomes.forEach(function (o) {
      var name = String(o.name || "").toLowerCase();
      var p = Number(o.prob) || 0;
      if (/no change|hold/.test(name)) hold += p;
      else if (/hike|increase/.test(name)) hike += p;
      else if (/cut|decrease/.test(name)) cut += p;
    });
    if (hike + hold <= 0) return null;
    return {
      hike: hike,
      hold: hold,
      cut: cut,
      meetingLabel: m.title || "Next FOMC",
      source: m.source || "Odds",
      url: m.url || null,
      asOf: odds.updated || null,
      label: formatFedNextLabel({ hike: hike, hold: hold }),
    };
  }

  async function fetchFedNext() {
    try {
      var res = await fetch(LIVE_FED_NEXT_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("fed-next " + res.status);
      var data = await res.json();
      if (!data || data.hike == null) throw new Error("no hike");
      renderFedNext(data);
      return true;
    } catch (err) {
      console.warn("live fed-next failed; trying odds seed", err);
      var seeded = fedNextFromOdds(state.odds);
      if (seeded) {
        renderFedNext(seeded);
        return false;
      }
      if (els.fedNext) {
        els.fedNext.classList.add("is-loading");
        els.fedNext.textContent = "FED NEXT: …";
      }
      return false;
    }
  }

  function startFedNextRefresh() {
    if (state.fedNextTimer) clearInterval(state.fedNextTimer);
    if (els.fedNext) els.fedNext.classList.add("is-loading");
    fetchFedNext();
    state.fedNextTimer = setInterval(fetchFedNext, FED_NEXT_REFRESH_MS);
  }


  function priceCells(prices, chain) {
    var sha = goldShaSub(prices);
    const cells = [
      {
        label: "BTC",
        value: formatMoney(prices.btc, 0),
        sub: btcChainSub(chain || state.btcChain) || null,
        subTitle: "Bitcoin tip height · medium next-block fee (sat/vB)",
        stack: "ticker-btc",
      },
      {
        label: "GOLD",
        value: formatMoney(prices.gold, 0),
        sub: sha ? sha.text : null,
        subTitle: sha ? sha.title : null,
        subTone: sha ? sha.tone : null,
        stack: sha ? "ticker-gold" : null,
      },
      { label: "COPPER", value: formatCopper(prices.copper) },
      // CME Live Cattle (LE) + Feeder Cattle (GF) — cents/lb (Yahoo LE=F / GF=F)
      { label: "LE", value: formatCattle(prices.cattle) },
      { label: "GF", value: formatCattle(prices.feeder) },
      { label: "WTI", value: formatMoney(prices.wti, 2) },
      { label: "10Y", value: formatYield(prices.tenY) },
    ];
    // BRENT inserts before 10Y
    if (prices.brent != null && !Number.isNaN(Number(prices.brent))) {
      const tenYIdx = cells.findIndex(function (c) { return c.label === "10Y"; });
      cells.splice(tenYIdx >= 0 ? tenYIdx : cells.length, 0, {
        label: "BRENT",
        value: formatMoney(prices.brent, 2),
      });
    }
    if (prices.muel != null && !Number.isNaN(Number(prices.muel))) {
      cells.push({ label: "MUEL", value: formatMoney(prices.muel, 0) });
    }
    return cells.map(function (c) {
      c.href = tradingViewUrl(c.label);
      // BTC: always open → green. Others: Chicago session hours.
      c.marketOpen = isTickerMarketOpen(c.label);
      return c;
    });
  }

  function setTicker(prices) {
    if (!els.tickerPrices || !prices) return;
    state.lastPrices = prices;
    els.tickerPrices.innerHTML = priceCells(prices, state.btcChain)
      .map(function (c) {
        const tone = c.tone ? " " + c.tone : "";
        // Open → green label; closed → white. BTC is always open (green).
        const openCls = c.marketOpen ? " open" : " closed";
        // Word labels (GOLD, COPPER) translate; codes (BTC, MUEL, LE, …) stay.
        const main =
          '<span class="ticker-main"><span class="ticker-label' +
          openCls +
          codeClass(c.label) +
          '">' +
          c.label +
          '</span><span class="ticker-price notranslate' +
          tone +
          '">' +
          c.value +
          "</span></span>";
        const subTone = c.subTone ? " " + c.subTone : "";
        const subTitle = c.subTitle
          ? ' title="' + escapeHtml(c.subTitle) + '"'
          : "";
        const sub = c.sub
          ? '<span class="ticker-sub notranslate' +
            subTone +
            '"' +
            subTitle +
            ">" +
            escapeHtml(c.sub) +
            "</span>"
          : "";
        const stack =
          c.sub && c.stack ? " " + c.stack : c.sub ? " ticker-stack" : "";
        const tvTitle = c.href
          ? ' title="TradingView ' + escapeHtml(c.label) + '"'
          : "";
        if (c.href) {
          return (
            '<a class="ticker-item ticker-link' +
            stack +
            '" href="' +
            escapeHtml(c.href) +
            '" target="_blank" rel="noopener noreferrer"' +
            tvTitle +
            ">" +
            main +
            sub +
            "</a>"
          );
        }
        return (
          '<span class="ticker-item' +
          stack +
          '">' +
          main +
          sub +
          "</span>"
        );
      })
      .join("");
  }


  function renderEwsChip(data) {
    if (!els.ewsChip || !els.ewsChipLevel) return;
    if (!data || data.emergencyLevel == null) {
      els.ewsChip.classList.add("hidden");
      return;
    }
    var level = Math.min(5, Math.max(1, Math.round(Number(data.emergencyLevel))));
    var levelText = data.levelText || level + "/5";
    var label = data.label || "EWS";
    els.ewsChip.classList.remove("hidden");
    // reset level classes
    for (var i = 1; i <= 5; i++) els.ewsChip.classList.remove("ews-level-" + i);
    els.ewsChip.classList.add("ews-level-" + level);
    els.ewsChip.classList.add("notranslate");
    els.ewsChip.setAttribute("translate", "no");
    var labelEl = els.ewsChip.querySelector(".ews-chip-label");
    if (labelEl) labelEl.textContent = label;
    els.ewsChipLevel.textContent = levelText;
    els.ewsChip.href = data.source || EWS_SITE;
    els.ewsChip.setAttribute(
      "aria-label",
      "EWS emergency level " + levelText + " — Apocalypse Early Warning System"
    );
    els.ewsChip.title =
      "EWS emergency level " + levelText + " (ews.kylemcdonald.net)";
  }


  function renderPriceStrip(prices) {
    // Same quotes already sit on the masthead ticker. Filling this strip
    // painted BTC/GOLD/WTI/… a second time under the edition title.
    if (els.priceStrip) {
      els.priceStrip.classList.add("hidden");
      els.priceStrip.innerHTML = "";
    }
    if (prices) state.lastPrices = prices;
  }

  function renderItem(item) {
    const bullets = (item.bullets || [])
      .map(function (b) {
        return "<li>" + escapeHtml(b) + "</li>";
      })
      .join("");

    return (
      '<article class="item">' +
      '<div class="item-head">' +
      '<span class="item-num">' +
      escapeHtml(String(item.n)) +
      ".</span>" +
      '<div class="item-headline-wrap">' +
      '<span class="cat-chip' +
      codeClass(item.category) +
      '">' +
      escapeHtml(item.category) +
      "</span>" +
      '<h2 class="item-headline">' +
      escapeHtml(item.headline) +
      "</h2>" +
      "</div>" +
      "</div>" +
      '<ul class="bullets">' +
      bullets +
      "</ul>" +
      "</article>"
    );
  }

  function topOutcome(market) {
    const outs = market.outcomes || [];
    if (!outs.length) return null;
    return outs.slice().sort(function (a, b) {
      return (b.prob || 0) - (a.prob || 0);
    })[0];
  }

  function renderMarketCard(market, compact) {
    const top = topOutcome(market);
    const prob = top ? top.prob : 0;
    const titleHtml = market.url
      ? '<a href="' +
        escapeHtml(market.url) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(market.title) +
        "</a>"
      : escapeHtml(market.title || "");

    let outcomesHtml = "";
    const outs = (market.outcomes || []).slice(0, compact ? 2 : 6);
    outs.forEach(function (o) {
      const w = Math.max(0, Math.min(100, Math.round((o.prob || 0) * 100)));
      outcomesHtml +=
        '<div class="outcome-row">' +
        '<span class="oname">' +
        escapeHtml(o.name) +
        "</span>" +
        '<div class="outcome-mini-bar"><span style="width:' +
        w +
        '%"></span></div>' +
        '<span class="oprob">' +
        pct(o.prob) +
        "</span>" +
        "</div>";
    });

    const note =
      !compact && market.note
        ? '<p class="market-note">' + escapeHtml(market.note) + "</p>"
        : "";
    const vol = market.volume
      ? '<span class="market-meta">' + escapeHtml(market.volume) + "</span>"
      : "";

    return (
      '<article class="market-card' +
      (compact ? " compact" : " full") +
      '">' +
      '<div class="market-top">' +
      '<span class="market-prob">' +
      pct(prob) +
      "</span>" +
      '<div class="market-title">' +
      titleHtml +
      "</div>" +
      vol +
      "</div>" +
      '<div class="prob-bar"><div class="prob-bar-fill" style="width:' +
      Math.round((prob || 0) * 100) +
      '%"></div></div>' +
      '<div class="market-meta">' +
      (top ? escapeHtml(top.name) : "") +
      (market.source
        ? ' · <span class="market-source">' +
          escapeHtml(market.source) +
          "</span>"
        : "") +
      "</div>" +
      outcomesHtml +
      note +
      "</article>"
    );
  }


  function normKey(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function richness(item) {
    var score = 0;
    var summary = item.takeaway || item.why || "";
    if (summary) score += 10 + Math.min(40, String(summary).length);
    if (item.url) score += 5;
    if (item.guest) score += 3;
    if (item.tags && item.tags.length) score += item.tags.length;
    if (item.date) score += 1;
    return score;
  }

  function episodeKey(item) {
    if (item.url) return "url:" + normKey(item.url);
    return "td:" + normKey(item.title) + "|" + normKey(item.date);
  }

  function preferRicher(a, b) {
    var ra = richness(a);
    var rb = richness(b);
    if (ra !== rb) return ra >= rb ? a : b;
    // Prefer newer date on tie
    var da = String(a.date || "");
    var db = String(b.date || "");
    return da >= db ? a : b;
  }

  /** Dedupe list by stable episode key; keep richest entry. */
  function dedupeEpisodes(list) {
    var map = {};
    var order = [];
    (list || []).forEach(function (item) {
      var k = episodeKey(item);
      if (!map[k]) {
        map[k] = item;
        order.push(k);
      } else {
        map[k] = preferRicher(map[k], item);
      }
    });
    return order.map(function (k) {
      return map[k];
    });
  }

  /** One card per show — keep newest, then richest. */
  function collapseByShow(list) {
    var map = {};
    var order = [];
    (list || []).forEach(function (item) {
      var k = normKey(item.show) || episodeKey(item);
      if (!map[k]) {
        map[k] = item;
        order.push(k);
        return;
      }
      var cur = map[k];
      var da = String(item.date || "");
      var db = String(cur.date || "");
      if (da > db) {
        map[k] = item;
      } else if (da === db) {
        map[k] = preferRicher(cur, item);
      }
    });
    return order.map(function (k) {
      return map[k];
    });
  }

  function favConfig() {
    return state.favorites || DEFAULT_FAVORITES;
  }

  function aliasList(guests) {
    var out = [];
    (guests || []).forEach(function (g) {
      if (typeof g === "string") {
        out.push(normKey(g));
        return;
      }
      out.push(normKey(g.name));
      (g.aliases || []).forEach(function (a) {
        out.push(normKey(a));
      });
    });
    return out.filter(Boolean);
  }

  function isExcludedGuest(hay) {
    var excludes = aliasList(favConfig().excludeGuests || []);
    var h = normKey(hay);
    return excludes.some(function (ex) {
      return h.indexOf(ex) >= 0;
    });
  }

  function matchedFavoriteGuest(item) {
    var hay = normKey((item.guest || "") + " " + (item.title || ""));
    if (isExcludedGuest(hay)) return null;
    var guests = favConfig().guests || [];
    for (var i = 0; i < guests.length; i++) {
      var g = guests[i];
      var names = typeof g === "string" ? [g] : [g.name].concat(g.aliases || []);
      for (var j = 0; j < names.length; j++) {
        var n = normKey(names[j]);
        if (n && hay.indexOf(n) >= 0) {
          return typeof g === "string" ? g : g.name;
        }
      }
    }
    return null;
  }

  function isFavoriteShow(item) {
    var show = normKey(item.show);
    return (favConfig().shows || []).some(function (s) {
      return normKey(s) === show;
    });
  }

  function isFeaturedInterview(item) {
    // Favorite guests OR episodes from favorite shows (so Featured still shows
    // TFTC / WBD / etc. after podcast↔interview URL collapse).
    return !!matchedFavoriteGuest(item) || isFavoriteShow(item);
  }

  function isFeaturedPodcast(item) {
    return isFavoriteShow(item) || !!matchedFavoriteGuest(item);
  }

  /** Featured/top strip only: episode date within last N days (client clock). */
  function isRecentTalk(item, days) {
    var raw = String((item && item.date) || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
    var parts = raw.split("-");
    var then = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
    if (Number.isNaN(then.getTime())) return false;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diffDays = Math.floor((today.getTime() - then.getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= (days == null ? 7 : days);
  }

  function prepareTalks(talks) {
    var interviews = dedupeEpisodes(talks && talks.interviews);
    var podcasts = collapseByShow(dedupeEpisodes(talks && talks.podcasts));
    var interviewUrls = {};
    interviews.forEach(function (i) {
      if (i.url) interviewUrls[normKey(i.url)] = true;
    });
    // Drop podcast cards that are the same episode as an interview (prefer interview card)
    podcasts = podcasts.filter(function (p) {
      return !(p.url && interviewUrls[normKey(p.url)]);
    });
    return { interviews: interviews, podcasts: podcasts };
  }

  function renderTalkCard(inv, compact) {
    const favGuest = matchedFavoriteGuest(inv);
    const favShow = isFavoriteShow(inv);
    const starred = !!favGuest || favShow;
    const tags = (inv.tags || [])
      .map(function (t) {
        return '<span class="tag-chip' + codeClass(t) + '">' + escapeHtml(t) + "</span>";
      })
      .join("");
    const titleInner = escapeHtml(inv.title || "");
    const titleHtml = inv.url
      ? '<a href="' +
        escapeHtml(inv.url) +
        '" target="_blank" rel="noopener">' +
        titleInner +
        "</a>"
      : titleInner;
    const takeawayPlain = stripHtml(inv.takeaway);
    const takeaway =
      !compact && takeawayPlain
        ? '<p class="talk-takeaway">' + escapeHtml(takeawayPlain) + "</p>"
        : "";
    const starHint = favGuest
      ? t("talks.favGuest", { name: favGuest })
      : favShow
        ? t("talks.favShow")
        : t("talks.fav");
    const star =
      starred
        ? '<span class="fav-star" title="' +
          escapeHtml(starHint) +
          '" aria-label="' +
          escapeHtml(t("talks.fav")) +
          '">★</span>'
        : "";
    const guestLabel = starred
      ? star + escapeHtml(inv.guest || "Guest")
      : escapeHtml(inv.guest || "Guest");

    return (
      '<article class="talk-card' +
      (compact ? " compact" : "") +
      (starred ? " is-favorite" : "") +
      '">' +
      '<div class="play-glyph" aria-hidden="true">▶</div>' +
      '<div class="talk-body">' +
      '<div><span class="talk-chip guest' +
      (starred ? " favorite" : "") +
      '">' +
      guestLabel +
      '</span><span class="talk-date">' +
      escapeHtml(formatShortDate(inv.date)) +
      "</span></div>" +
      '<h3 class="talk-title' +
      (starred ? " favorite-title" : "") +
      '">' +
      titleHtml +
      "</h3>" +
      '<div class="talk-meta">' +
      escapeHtml(inv.show || "") +
      "</div>" +
      takeaway +
      (tags && !compact ? '<div class="tag-row">' + tags + "</div>" : "") +
      "</div></article>"
    );
  }

  function renderPodCard(pod) {
    const favShow = isFavoriteShow(pod);
    const favGuest = matchedFavoriteGuest(pod);
    const starred = favShow || !!favGuest;
    const titleInner = escapeHtml(pod.title || "");
    const titleHtml = pod.url
      ? '<a href="' +
        escapeHtml(pod.url) +
        '" target="_blank" rel="noopener">' +
        titleInner +
        "</a>"
      : titleInner;
    const whyPlain = stripHtml(pod.why);
    const why = whyPlain
      ? '<p class="pod-why">' + escapeHtml(whyPlain) + "</p>"
      : "";
    const star = starred
      ? '<span class="fav-star" title="' +
        escapeHtml(t("talks.favShow")) +
        '" aria-label="' +
        escapeHtml(t("talks.fav")) +
        '">★</span>'
      : "";
    const latestLabel = t("talks.latest");
    const chipLabel = starred
      ? star + latestLabel + " · " + escapeHtml(pod.show || "")
      : latestLabel + " · " + escapeHtml(pod.show || "");

    return (
      '<article class="pod-card' +
      (starred ? " is-favorite" : "") +
      '">' +
      '<div class="play-glyph" aria-hidden="true">▶</div>' +
      '<div class="talk-body">' +
      '<div><span class="talk-chip' +
      (starred ? " favorite" : "") +
      '">' +
      chipLabel +
      '</span><span class="talk-date">' +
      escapeHtml(formatShortDate(pod.date)) +
      "</span></div>" +
      '<h3 class="talk-title' +
      (starred ? " favorite-title" : "") +
      '">' +
      titleHtml +
      "</h3>" +
      why +
      "</div></article>"
    );
  }


  function formatPctSigned(n, digits) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const d = digits != null ? digits : 2;
    const v = Number(n);
    const abs = Math.abs(v).toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    if (v > 0) return "+" + abs + "%";
    if (v < 0) return "−" + abs + "%";
    return abs + "%";
  }

  function toneClass(n) {
    if (n == null || Number.isNaN(Number(n))) return "flat";
    const v = Number(n);
    if (v > 0) return "up";
    if (v < 0) return "down";
    return "flat";
  }

  function formatWeight(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return (
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%"
    );
  }

  /** Last price only — never portfolio $ totals. */
  function formatLastPrice(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    const d = v >= 1000 ? 0 : v >= 100 ? 2 : v >= 1 ? 2 : 4;
    return (
      "$" +
      v.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })
    );
  }

  var CHART_RANGE_META = {
    ytd: { key: "ytd", btn: "YTD", horizon: "ytd" },
    sixMonth: { key: "sixMonth", btn: "6M", horizon: "sixMonth" },
    oneYear: { key: "oneYear", btn: "1Y", horizon: "oneYear" },
    threeYear: { key: "threeYear", btn: "3Y", horizon: "threeYear" },
  };

  function chartPackForRange(data, rangeKey) {
    var cs = (data && data.chartSeries) || {};
    var pack = cs[rangeKey];
    if (pack && (pack.model || pack.exMuel)) return pack;
    // Legacy fallback: only YTD series fields
    if (rangeKey === "ytd") {
      return {
        label: (data && data.chartLabel) || "YTD",
        model: (data && data.ytdSeries) || [],
        exMuel: (data && data.ytdSeriesExMuel) || [],
        spx: (data && data.ytdSeriesSpx) || [],
      };
    }
    return { label: (CHART_RANGE_META[rangeKey] || {}).btn || rangeKey, model: [], exMuel: [], spx: [] };
  }

  function seriesForChart(data, rangeKey, exMuel) {
    var pack = chartPackForRange(data, rangeKey);
    var s = exMuel ? pack.exMuel : pack.model;
    return s || [];
  }

  function latestPctForRange(data, rangeKey, exMuel) {
    var pack = chartPackForRange(data, rangeKey);
    var s = exMuel ? pack.exMuel : pack.model;
    if (s && s.length) return s[s.length - 1].pct;
    if (rangeKey === "ytd") {
      return exMuel ? data.ytdLatestPctExMuel : data.ytdLatestPct;
    }
    var hz = ((data && data.horizons) || {})[rangeKey] || {};
    if (hz.status === "ok") return exMuel ? hz.pctExMuel : hz.pct;
    return null;
  }

  function drawYtdChart(canvas, series) {
    if (!canvas || !series || !series.length) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 960;
    const cssH = 280;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 16, r: 16, b: 36, l: 48 };
    const w = cssW - pad.l - pad.r;
    const h = cssH - pad.t - pad.b;
    const vals = series.map(function (p) { return p.pct; });
    let minV = Math.min.apply(null, vals.concat([0]));
    let maxV = Math.max.apply(null, vals.concat([0]));
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const span = maxV - minV;
    minV -= span * 0.08;
    maxV += span * 0.08;

    function xAt(i) {
      return pad.l + (series.length === 1 ? w / 2 : (i / (series.length - 1)) * w);
    }
    function yAt(v) {
      return pad.t + ((maxV - v) / (maxV - minV)) * h;
    }

    ctx.clearRect(0, 0, cssW, cssH);

    // grid + zero line
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 1;
    const ticks = 4;
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillStyle = "#7a746c";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let t = 0; t <= ticks; t++) {
      const v = maxV - ((maxV - minV) * t) / ticks;
      const y = yAt(v);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + w, y);
      ctx.stroke();
      ctx.fillText(
        (v >= 0 ? "+" : "") + v.toFixed(1) + "%",
        pad.l - 8,
        y
      );
    }
    const y0 = yAt(0);
    ctx.strokeStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(pad.l, y0);
    ctx.lineTo(pad.l + w, y0);
    ctx.stroke();

    const last = vals[vals.length - 1];
    const stroke = last > 0 ? "#3d9a6a" : last < 0 ? "#c45c4a" : "#b5aea3";
    const fillTop = last > 0 ? "rgba(61,154,106,0.18)" : last < 0 ? "rgba(196,92,74,0.18)" : "rgba(181,174,163,0.12)";

    // area
    ctx.beginPath();
    series.forEach(function (p, i) {
      const x = xAt(i);
      const y = yAt(p.pct);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xAt(series.length - 1), y0);
    ctx.lineTo(xAt(0), y0);
    ctx.closePath();
    ctx.fillStyle = fillTop;
    ctx.fill();

    // line
    ctx.beginPath();
    series.forEach(function (p, i) {
      const x = xAt(i);
      const y = yAt(p.pct);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // end dot
    const ex = xAt(series.length - 1);
    const ey = yAt(last);
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // x labels: first / mid / last
    ctx.fillStyle = "#7a746c";
    ctx.textBaseline = "top";
    const labelIdx = [0, Math.floor((series.length - 1) / 2), series.length - 1];
    labelIdx.forEach(function (i, n) {
      const p = series[i];
      if (!p) return;
      const x = xAt(i);
      ctx.textAlign = n === 0 ? "left" : n === 2 ? "right" : "center";
      const parts = String(p.date).split("-");
      const label =
        parts.length === 3
          ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(parts[1]) - 1] +
            " " +
            Number(parts[2])
          : p.date;
      ctx.fillText(label, x, pad.t + h + 10);
    });
  }

  function renderPortfolioView() {
    hideAllPanels();
    els.portfolioView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    const data = state.portfolio;
    const updated = data && data.updated ? formatDate(data.updated) : "";
    const ex = !!state.exMuel;

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("portfolio.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(updated ? t("portfolio.updated", { date: updated }) : "") +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("portfolio.title");

    if (!data || !(data.holdings || []).length) {
      els.portfolioStrip.innerHTML =
        '<p class="error">' + escapeHtml(t("portfolio.loadError")) + "</p>";
      if (els.portfolioHorizons) els.portfolioHorizons.innerHTML = "";
      els.portfolioTbody.innerHTML = "";
      if (els.portfolioNote) {
        els.portfolioNote.textContent = "";
        els.portfolioNote.classList.add("hidden");
      }
      if (els.portfolioYtdBadge) els.portfolioYtdBadge.textContent = "";
      return;
    }

    const dayW = ex ? data.dayWeightedPctExMuel : data.dayWeightedPct;
    const tone = toneClass(dayW);
    const dayLabel = ex ? t("portfolio.dayExMuel") : t("portfolio.dayWeighted");
    function _classKey(h) {
      var sym = String(h.symbol || "");
      var sector = h.sector || "";
      if (sym.toUpperCase() === "MUEL") return "MUEL";
      if (sym.toLowerCase() === "insurance") return "Alternatives";
      if (sym.toUpperCase() === "NLY" || /mortgage\s*reit/i.test(sector)) return "REITs";
      if (/alternative/i.test(sector)) return "Alternatives";
      if (/^btc$/i.test(sector)) return "Bitcoin";
      if (/gold/i.test(sector)) return "Gold";
      if (/^cash$/i.test(sector) || sym.toUpperCase() === "CASH") return "Cash";
      if (/^energy$/i.test(sector)) return "Energy";
      if (/^industrial$/i.test(sector)) return "Industrial";
      if (/^international$/i.test(sector)) return "International";
      if (/^financials$/i.test(sector)) return "Financials";
      return sector || sym || "Other";
    }
    function _classCount(list) {
      var seen = {};
      (list || []).forEach(function (h) {
        seen[_classKey(h)] = true;
      });
      return Object.keys(seen).length;
    }
    const nHoldFull = _classCount(data.holdings || []);
    const nHoldEx = _classCount(
      (data.holdings || []).filter(function (h) {
        return String(h.symbol || "").toUpperCase() !== "MUEL";
      })
    );
    const dayMeta = ex
      ? t("portfolio.metaEx", { n: nHoldEx })
      : t("portfolio.metaFull", { n: nHoldFull });

    els.portfolioStrip.innerHTML =
      '<div class="ps-main">' +
      '<div class="ps-label">' +
      escapeHtml(dayLabel) +
      "</div>" +
      '<div class="ps-value ' +
      tone +
      '">' +
      escapeHtml(formatPctSigned(dayW, 2)) +
      "</div></div>" +
      '<button type="button" class="ex-muel-toggle' +
      (ex ? " active" : "") +
      '" id="ex-muel-toggle" aria-pressed="' +
      (ex ? "true" : "false") +
      '" title="' +
      escapeHtml(t("portfolio.exMuelTitle")) +
      '">' +
      escapeHtml(t("portfolio.exMuel")) +
      "</button>" +
      '<div class="ps-meta">' +
      escapeHtml(dayMeta) +
      "</div>";

    const toggle = $("#ex-muel-toggle", els.portfolioStrip);
    if (toggle) {
      toggle.addEventListener("click", function () {
        state.exMuel = !state.exMuel;
        renderPortfolioView();
      });
    }

    // Horizons: YTD / 6M / 1Y / 3Y vs SPX — Ex-MUEL applies to portfolio leg
    // Active chip tracks chart timeframe button
    if (!state.chartRange || !CHART_RANGE_META[state.chartRange]) {
      state.chartRange = "ytd";
    }
    const rangeKey = state.chartRange;

    if (els.portfolioHorizons) {
      const hz = data.horizons || {};
      const keys = [
        ["ytd", "YTD"],
        ["sixMonth", "6M"],
        ["oneYear", "1Y"],
        ["threeYear", "3Y"],
      ];
      els.portfolioHorizons.innerHTML = keys
        .map(function (pair) {
          const key = pair[0];
          const shortLabel = pair[1];
          const row = hz[key] || {};
          const label = row.label || shortLabel;
          let body;
          let cls = "flat";
          let sub = "";
          if (row.status === "ok") {
            const v = ex ? row.pctExMuel : row.pct;
            const spx = row.spxPct;
            const vs = ex ? row.vsSpxExMuel : row.vsSpx;
            cls = toneClass(v);
            body = formatPctSigned(v, 2);
            const spxLine =
              spx != null
                ? '<div class="ph-bench">SPX ' +
                  escapeHtml(formatPctSigned(spx, 2)) +
                  "</div>"
                : "";
            const vsLine =
              vs != null
                ? '<div class="ph-rel ' +
                  toneClass(vs) +
                  '">' +
                  escapeHtml(formatPctSigned(vs, 2)) +
                  " " +
                  escapeHtml(t("portfolio.vsSpx")) +
                  "</div>"
                : "";
            sub = spxLine + vsLine;
          } else {
            body = "n/a";
            cls = "na";
            sub =
              row.reason
                ? '<div class="ph-reason">' +
                  escapeHtml(String(row.reason).replace(/^n\/a — /, "")) +
                  "</div>"
                : "";
          }
          const active = key === rangeKey ? " is-active" : "";
          return (
            '<div class="ph-chip' +
            active +
            '" data-range="' +
            escapeHtml(key) +
            '" role="button" tabindex="0" title="' +
            escapeHtml(row.reason || "Show " + shortLabel + " chart") +
            '">' +
            '<div class="ph-label">' +
            escapeHtml(label) +
            (ex && row.status === "ok" ? " · ex-MUEL" : "") +
            "</div>" +
            '<div class="ph-value ' +
            cls +
            '">' +
            escapeHtml(body) +
            "</div>" +
            sub +
            "</div>"
          );
        })
        .join("");

      $all(".ph-chip", els.portfolioHorizons).forEach(function (chip) {
        function activate() {
          const r = chip.getAttribute("data-range");
          if (!r || !CHART_RANGE_META[r]) return;
          state.chartRange = r;
          renderPortfolioView();
        }
        chip.addEventListener("click", activate);
        chip.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            activate();
          }
        });
      });
    }

    // Timeframe buttons on chart
    if (els.portfolioRangeBtns) {
      $all(".pr-btn", els.portfolioRangeBtns).forEach(function (btn) {
        const r = btn.getAttribute("data-range");
        if (r === rangeKey) btn.classList.add("active");
        else btn.classList.remove("active");
        btn.onclick = function () {
          if (!r || !CHART_RANGE_META[r]) return;
          state.chartRange = r;
          renderPortfolioView();
        };
      });
    }

    const pack = chartPackForRange(data, rangeKey);
    const series = seriesForChart(data, rangeKey, ex);
    const latest = latestPctForRange(data, rangeKey, ex);
    const chartLabel = pack.label || (CHART_RANGE_META[rangeKey] || {}).btn || "YTD";

    if (els.portfolioChartTitle) {
      els.portfolioChartTitle.innerHTML =
        escapeHtml(chartLabel) +
        ' <span class="section-sub" id="portfolio-chart-sub">' +
        escapeHtml(ex ? t("portfolio.totalReturnEx") : t("portfolio.chartSub")) +
        "</span>";
    }

    if (els.portfolioYtdBadge) {
      els.portfolioYtdBadge.className = "portfolio-ytd-badge " + toneClass(latest);
      els.portfolioYtdBadge.textContent = formatPctSigned(latest, 2);
    }

    drawYtdChart(els.portfolioChart, series);

    // Holdings table: roll up by asset class / sector (not tickers).
    // Ex-MUEL ON → drop MUEL weight, renormalize class weights to 100%.
    function portfolioClassLabel(h) {
      var sym = String(h.symbol || "");
      var sector = h.sector || "";
      if (sym.toUpperCase() === "MUEL") return "MUEL";
      if (sym.toLowerCase() === "insurance") {
        return "Alternatives";
      }
      if (sym.toUpperCase() === "NLY" || /mortgage\s*reit/i.test(sector)) {
        return "REITs";
      }
      if (/alternative/i.test(sector)) return "Alternatives";
      if (/^btc$/i.test(sector)) return "Bitcoin";
      if (/gold/i.test(sector)) return "Gold";
      if (/^cash$/i.test(sector) || sym.toUpperCase() === "CASH") return "Cash";
      if (/^energy$/i.test(sector)) return "Energy";
      if (/^industrial$/i.test(sector)) return "Industrial";
      if (/^international$/i.test(sector)) return "International";
      if (/^financials$/i.test(sector)) return "Financials";
      return sector || sym || "Other";
    }

    let holdingsRows = (data.holdings || []).slice();
    if (ex) {
      holdingsRows = holdingsRows.filter(function (h) {
        return String(h.symbol || "").toUpperCase() !== "MUEL";
      });
    }
    const classMap = {};
    const classOrder = [];
    holdingsRows.forEach(function (h) {
      const label = portfolioClassLabel(h);
      const w = Number(h.weight) || 0;
      const d = Number(h.dayPct);
      if (!classMap[label]) {
        classMap[label] = { label: label, weight: 0, dayNum: 0, dayDen: 0 };
        classOrder.push(label);
      }
      const row = classMap[label];
      row.weight += w;
      if (!Number.isNaN(d)) {
        row.dayNum += d * w;
        row.dayDen += w;
      }
    });
    let classRows = classOrder.map(function (k) {
      const row = classMap[k];
      return {
        label: row.label,
        weight: row.weight,
        dayPct: row.dayDen > 0 ? row.dayNum / row.dayDen : 0,
      };
    });
    let weightScale = 1;
    const wsum = classRows.reduce(function (s, h) {
      return s + (Number(h.weight) || 0);
    }, 0);
    weightScale = wsum > 0 ? 100 / wsum : 1;
    classRows = classRows
      .map(function (h) {
        return {
          label: h.label,
          weight: (Number(h.weight) || 0) * weightScale,
          dayPct: h.dayPct,
        };
      })
      .sort(function (a, b) {
        return (Number(b.weight) || 0) - (Number(a.weight) || 0);
      });

    const rows = classRows
      .map(function (h) {
        const dTone = toneClass(h.dayPct);
        return (
          "<tr>" +
          '<td class="sym' +
          codeClass(h.label) +
          '">' +
          escapeHtml(h.label) +
          "</td>" +
          '<td class="num">' +
          escapeHtml(formatWeight(h.weight)) +
          "</td>" +
          '<td class="num ' +
          dTone +
          '">' +
          escapeHtml(formatPctSigned(h.dayPct, 2)) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    els.portfolioTbody.innerHTML = rows;

    // No methodology lecture on the page — privacy lives in export code only
    if (els.portfolioNote) {
      els.portfolioNote.textContent = "";
      els.portfolioNote.classList.add("hidden");
    }
    refreshFullPageTranslation();
  }






  function subsExcludePatterns() {
    var ex = state.subsExcludes;
    return (ex && ex.patterns) || [];
  }

  function isSubExcluded(name, aliases, scope) {
    var hay = normKey(
      [name || ""]
        .concat(aliases || [])
        .join(" ")
    );
    var patterns = subsExcludePatterns();
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i] || {};
      var sc = (p.scope || "both").toLowerCase();
      if (sc !== "both" && sc !== scope) continue;
      var pat = normKey(p.pattern || "");
      if (pat && hay.indexOf(pat) >= 0) return true;
    }
    return false;
  }

  function filterSubsItems(items, scope) {
    return (items || []).filter(function (it) {
      return !isSubExcluded(it.name, it.aliases, scope);
    });
  }

  function sortSubsByName(items) {
    return (items || []).slice().sort(function (a, b) {
      return (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
    });
  }

  function isRssLikeUrl(u) {
    if (!u) return true;
    var s = String(u).toLowerCase();
    if (/\.(xml|rss)(\?|$)/.test(s)) return true;
    if (/\/(rss|feed)(\/|\?|$)/.test(s)) return true;
    if (/podcast\.rss/.test(s)) return true;
    if (/(^|\/)feeds?[./]/.test(s)) return true;
    if (/(^|\/)rss[./]/.test(s)) return true;
    if (
      /(megaphone\.fm|simplecast\.com|libsyn\.com|buzzsprout\.com|anchor\.fm|omnycontent\.com|acast\.com|art19\.com|flightcast\.com|beyondwords\.io|audioboom\.com)\b/.test(
        s
      )
    ) {
      return true;
    }
    if (/substack\.com\/feed\//.test(s)) return true;
    return false;
  }

  function subsLinkFor(item, scope) {
    if (scope === "youtube") {
      // YouTube rows should open the channel, not a podcast RSS feed.
      return item.youtubeUrl || item.youtube || item.channelUrl || item.url || item.link || "";
    }
    // Prefer human homepage / Apple / Spotify / website — never RSS XML.
    var candidates = [
      item.homepage,
      item.website,
      item.site,
      item.apple,
      item.appleUrl,
      item.spotify,
      item.spotifyUrl,
      item.link,
      item.url,
      item.feed,
      item.rss,
    ];
    for (var i = 0; i < candidates.length; i++) {
      var u = candidates[i];
      if (u && !isRssLikeUrl(u)) return u;
    }
    return "";
  }

  function renderSubsRow(item, scope) {
    var link = subsLinkFor(item, scope);
    var nameHtml = escapeHtml(item.name || "");
    var nameBlock = link
      ? '<a href="' +
        escapeHtml(link) +
        '" target="_blank" rel="noopener noreferrer">' +
        nameHtml +
        "</a>"
      : nameHtml;
    var outLink = link
      ? '<a class="subs-link" href="' +
        escapeHtml(link) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(t("subs.open")) +
        "</a>"
      : "";
    return (
      '<div class="subs-row">' +
      '<div class="subs-name">' +
      nameBlock +
      "</div>" +
      outLink +
      "</div>"
    );
  }

  function renderSubsGrouped(listEl, countEl, items, query, scope) {
    var q = normKey(query || "");
    var filtered = items.filter(function (it) {
      if (!q) return true;
      var hay = normKey(
        [it.name || ""]
          .concat(it.aliases || [])
          .join(" ")
      );
      return hay.indexOf(q) >= 0;
    });
    if (countEl) {
      countEl.textContent =
        t("subs.shown", { n: filtered.length }) +
        (q ? t("subs.filterOn") : "") +
        (items.length !== filtered.length
          ? t("subs.listed", { n: items.length })
          : "");
    }
    if (!filtered.length) {
      listEl.innerHTML =
        '<p class="empty">' + escapeHtml(t("subs.noMatches")) + "</p>";
      return;
    }
    var bits = [];
    var lastLetter = "";
    filtered.forEach(function (it) {
      var letter = (it.name || "?").charAt(0).toUpperCase();
      if (!/[A-Z]/.test(letter)) letter = "#";
      if (letter !== lastLetter) {
        bits.push(
          '<div class="subs-letter" aria-hidden="true">' +
            escapeHtml(letter) +
            "</div>"
        );
        lastLetter = letter;
      }
      bits.push(renderSubsRow(it, scope));
    });
    listEl.innerHTML = bits.join("");
  }

  function renderPodcastSubsView() {
    hideAllPanels();
    els.podcastSubsView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    var updated =
      state.podcastSubs && state.podcastSubs.updated
        ? formatDate(state.podcastSubs.updated)
        : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("podsubs.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(
        updated
          ? t("portfolio.updated", { date: updated })
          : t("podsubs.fallbackDate")
      ) +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("podsubs.title");

    if (!state.podcastSubs) {
      els.podcastSubsList.innerHTML =
        '<p class="error">' + escapeHtml(t("podsubs.loadError")) + "</p>";
      if (els.podcastSubsCount) els.podcastSubsCount.textContent = "";
      return;
    }

    var items = sortSubsByName(
      filterSubsItems(state.podcastSubs.shows || [], "podcasts")
    );
    state._podcastSubsVisible = items;
    var q = els.podcastSubsSearch ? els.podcastSubsSearch.value : "";
    renderSubsGrouped(els.podcastSubsList, els.podcastSubsCount, items, q, "podcasts");
  }

  function renderYoutubeSubsView() {
    hideAllPanels();
    els.youtubeSubsView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    var updated =
      state.youtubeSubs && state.youtubeSubs.updated
        ? formatDate(state.youtubeSubs.updated)
        : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("ytsubs.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(
        updated
          ? t("portfolio.updated", { date: updated })
          : t("ytsubs.fallbackDate")
      ) +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("ytsubs.title");

    if (!state.youtubeSubs) {
      els.youtubeSubsList.innerHTML =
        '<p class="error">' + escapeHtml(t("ytsubs.loadError")) + "</p>";
      if (els.youtubeSubsCount) els.youtubeSubsCount.textContent = "";
      return;
    }

    var items = sortSubsByName(
      filterSubsItems(state.youtubeSubs.channels || [], "youtube")
    );
    state._youtubeSubsVisible = items;
    var q = els.youtubeSubsSearch ? els.youtubeSubsSearch.value : "";
    renderSubsGrouped(els.youtubeSubsList, els.youtubeSubsCount, items, q, "youtube");
  }

  function sortReadsByTitle(items) {
    return (items || []).slice().sort(function (a, b) {
      return (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      });
    });
  }

  function renderReadsRow(item) {
    var titleHtml = escapeHtml(item.title || "");
    var author = item.author || "";
    var authorBlock = author
      ? '<div class="subs-author">' + escapeHtml(author) + "</div>"
      : "";
    return (
      '<div class="subs-row">' +
      '<div class="subs-name">' +
      titleHtml +
      authorBlock +
      "</div>" +
      "</div>"
    );
  }

  function renderReadsGrouped(listEl, countEl, items, query) {
    var q = normKey(query || "");
    var filtered = items.filter(function (it) {
      if (!q) return true;
      var hay = normKey((it.title || "") + " " + (it.author || ""));
      return hay.indexOf(q) >= 0;
    });
    if (countEl) {
      countEl.textContent =
        t("subs.shown", { n: filtered.length }) +
        (q ? t("subs.filterOn") : "") +
        (items.length !== filtered.length
          ? t("subs.listed", { n: items.length })
          : "");
    }
    if (!filtered.length) {
      listEl.innerHTML =
        '<p class="empty">' + escapeHtml(t("subs.noMatches")) + "</p>";
      return;
    }
    var bits = [];
    var lastLetter = "";
    filtered.forEach(function (it) {
      var letter = (it.title || "?").charAt(0).toUpperCase();
      if (!/[A-Z]/.test(letter)) letter = "#";
      if (letter !== lastLetter) {
        bits.push(
          '<div class="subs-letter" aria-hidden="true">' +
            escapeHtml(letter) +
            "</div>"
        );
        lastLetter = letter;
      }
      bits.push(renderReadsRow(it));
    });
    listEl.innerHTML = bits.join("");
  }

  function renderReadsView() {
    hideAllPanels();
    els.readsView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    var updated =
      state.reads && state.reads.updated
        ? formatDate(state.reads.updated)
        : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("reads.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(
        updated
          ? t("portfolio.updated", { date: updated })
          : t("reads.fallbackDate")
      ) +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("reads.title");

    if (!state.reads) {
      els.readsList.innerHTML =
        '<p class="error">' + escapeHtml(t("reads.loadError")) + "</p>";
      if (els.readsCount) els.readsCount.textContent = "";
      return;
    }

    var items = sortReadsByTitle(state.reads.items || []);
    state._readsVisible = items;
    var q = els.readsSearch ? els.readsSearch.value : "";
    renderReadsGrouped(els.readsList, els.readsCount, items, q);
  }

    function collumDateKey() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    var vals = {};
    parts.forEach(function (part) { vals[part.type] = part.value; });
    return vals.year + "-" + vals.month + "-" + vals.day;
  }

  function collumQuoteIndex(count) {
    var key = collumDateKey();
    var n = 0;
    for (var i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) >>> 0;
    return count ? n % count : 0;
  }

  function renderCollumQuote(data) {
    if (!els.collumQuote || !els.collumQuoteText || !data || !data.quotes || !data.quotes.length) return;
    var quote = data.quotes[collumQuoteIndex(data.quotes.length)];
    if (!quote || !quote.text) return;
    if (els.collumQuoteKicker) els.collumQuoteKicker.textContent = t("collum.label");
    els.collumQuoteText.textContent = quote.text;
    if (els.collumQuoteByline) els.collumQuoteByline.textContent = t("collum.byline");
    if (els.collumQuoteSource) {
      if (quote.sourceUrl) {
        els.collumQuoteSource.href = quote.sourceUrl;
        els.collumQuoteSource.textContent = t("collum.source");
        els.collumQuoteSource.classList.remove("hidden");
      } else {
        els.collumQuoteSource.classList.add("hidden");
      }
    }
    els.collumQuote.classList.remove("hidden");
    refreshFullPageTranslation();
  }

  async function loadCollumQuote() {
    try {
      state.collumQuote = await fetchJson(COLLUM_QUOTE_URL);
      renderCollumQuote(state.collumQuote);
    } catch (err) {
      console.error(err);
    }
  }

  function hideAllPanels() {
    els.about.classList.add("hidden");
    els.talksView.classList.add("hidden");
    if (els.podcastSubsView) els.podcastSubsView.classList.add("hidden");
    if (els.youtubeSubsView) els.youtubeSubsView.classList.add("hidden");
    if (els.readsView) els.readsView.classList.add("hidden");
    if (els.ukraineView) els.ukraineView.classList.add("hidden");
    els.oddsView.classList.add("hidden");
    if (els.portfolioView) els.portfolioView.classList.add("hidden");
    els.deskRails.classList.add("hidden");
    els.editionMeta.classList.add("hidden");
    els.priceStrip.classList.add("hidden");
    els.items.classList.add("hidden");
  }

  function showLoading() {
    hideAllPanels();
    els.editionMeta.classList.remove("hidden");
    els.items.classList.remove("hidden");
    els.items.innerHTML =
      '<p class="loading">' + escapeHtml(t("loading")) + "</p>";
  }

  function showError(msg) {
    els.items.classList.remove("hidden");
    els.items.innerHTML =
      '<p class="error">' +
      escapeHtml(msg || t("error.generic")) +
      "</p>";
  }

  function renderDeskRails() {
    if (!state.odds && !state.talks) {
      els.deskRails.classList.add("hidden");
      return;
    }
    els.deskRails.classList.remove("hidden");

    if (state.odds && state.odds.markets) {
      els.oddsStrip.innerHTML = state.odds.markets
        .slice(0, 4)
        .map(function (m) {
          return renderMarketCard(m, true);
        })
        .join("");
    } else {
      els.oddsStrip.innerHTML =
        '<p class="empty">' + escapeHtml(t("empty.odds")) + "</p>";
    }

    if (state.talks) {
      const prepared = prepareTalks(state.talks);
      const featuredInv = prepared.interviews.filter(function (i) {
        return isFeaturedInterview(i) && isRecentTalk(i, 7);
      });
      const featuredPod = prepared.podcasts.filter(function (p) {
        return isFeaturedPodcast(p) && isRecentTalk(p, 7);
      });
      // Prefer recent featured, then fill with newest remaining
      const invRest = prepared.interviews.filter(function (i) {
        return !(isFeaturedInterview(i) && isRecentTalk(i, 7));
      });
      const podRest = prepared.podcasts.filter(function (p) {
        return !(isFeaturedPodcast(p) && isRecentTalk(p, 7));
      });
      const invPick = featuredInv.concat(invRest).slice(0, 3);
      const podPick = featuredPod.concat(podRest).slice(0, 2);
      const bits = invPick.map(function (i) {
        return renderTalkCard(i, true);
      });
      podPick.forEach(function (p) {
        bits.push(renderPodCard(p).replace("pod-card", "pod-card talk-card compact"));
      });
      els.talksStrip.innerHTML =
        bits.join("") ||
        '<p class="empty">' + escapeHtml(t("empty.talks")) + "</p>";
    } else {
      els.talksStrip.innerHTML =
        '<p class="empty">' + escapeHtml(t("empty.talks")) + "</p>";
    }
  }

  function renderEdition(data) {
    hideAllPanels();
    els.editionMeta.classList.remove("hidden");
    els.items.classList.remove("hidden");

    const label = data.label
      ? '<span class="sample-badge">' + escapeHtml(data.label) + "</span>"
      : "";

    // The masthead dateline is the single date source for editions. Keeping
    // the edition date out of this block avoids showing the same date twice.
    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(data.title || data.type) +
      "</h1>" +
      label +
      "</div>";

    if (data.prices) {
      state.seedPrices = data.prices;
      setTicker(activePrices());
      renderPriceStrip(activePrices());
    } else {
      renderPriceStrip(null);
    }

    if (els.dateline) {
      els.dateline.textContent = formatDate(data.date);
    }

    if (state.currentView === "daily") {
      renderDeskRails();
    }

    const items = data.items || [];
    if (!items.length) {
      els.items.innerHTML =
        '<p class="empty">' + escapeHtml(t("empty.items")) + "</p>";
      return;
    }

    els.items.innerHTML = items.map(renderItem).join("");
  }

  function renderTalksView() {
    hideAllPanels();
    els.talksView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    const updated = state.talks && state.talks.updated
      ? formatDate(state.talks.updated)
      : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("talks.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(updated ? t("talks.updated", { date: updated }) : "") +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("talks.title");

    if (!state.talks) {
      if (els.featuredList) els.featuredList.innerHTML = "";
      if (els.featuredSection) els.featuredSection.classList.add("hidden");
      els.interviewsList.innerHTML =
        '<p class="error">' + escapeHtml(t("talks.loadError")) + "</p>";
      els.podcastsList.innerHTML = "";
      return;
    }

    const prepared = prepareTalks(state.talks);
    // Featured strip: ★ matches only if published within last 7 days
    const featuredInv = prepared.interviews.filter(function (i) {
      return isFeaturedInterview(i) && isRecentTalk(i, 7);
    });
    const featuredPod = prepared.podcasts.filter(function (p) {
      return isFeaturedPodcast(p) && isRecentTalk(p, 7);
    });
    // Older ★ items fall through to the regular lists
    const interviews = prepared.interviews.filter(function (i) {
      return !(isFeaturedInterview(i) && isRecentTalk(i, 7));
    });
    const podcasts = prepared.podcasts.filter(function (p) {
      return !(isFeaturedPodcast(p) && isRecentTalk(p, 7));
    });

    // Featured: guest interviews first, then favorite-show latest eps
    const featuredBits = featuredInv
      .map(function (i) {
        return renderTalkCard(i, false);
      })
      .concat(featuredPod.map(renderPodCard));

    if (els.featuredList) {
      if (featuredBits.length) {
        if (els.featuredSection) els.featuredSection.classList.remove("hidden");
        els.featuredList.innerHTML = featuredBits.join("");
      } else {
        if (els.featuredSection) els.featuredSection.classList.add("hidden");
        els.featuredList.innerHTML = "";
      }
    }

    els.interviewsList.innerHTML = interviews.length
      ? interviews.map(function (i) {
          return renderTalkCard(i, false);
        }).join("")
      : '<p class="empty">' + escapeHtml(t("talks.noInterviews")) + "</p>";

    els.podcastsList.innerHTML = podcasts.length
      ? podcasts.map(renderPodCard).join("")
      : '<p class="empty">' + escapeHtml(t("talks.noPodcasts")) + "</p>";
  }



  function renderUkraineFrame(frame) {
    // Visible manifesto / frame block removed — Provoked/Duran stay as quiet
    // editorial sources in ukraine.json (sources + optional frame.anchors metadata).
    return "";
  }

  function ukraineSourceChip(id) {
    var map = {
      tass: "TASS",
      "tf-rodovka": "TF Rodovka",
      amk: "AMK",
      duran: "Duran",
      diesen: "Diesen",
      sonar21: "Sonar21",
      antiwar: "Antiwar",
      horton: "Horton",
      anzalone: "Anzalone",
      decamp: "DeCamp",
      moa: "MoA",
      milsum: "MilSum",
      judge: "Judge",
      rybar: "Rybar",
      wsj: "WSJ",
      ft: "FT",
    };
    return map[id] || id || "";
  }

  function renderUkraineMap(map) {
    if (!els.ukraineMap || !map) return;
    var vb = map.viewBox || "0 0 900 600";
    var path = map.outlinePath || "";
    var front = map.frontline || [];
    var poly = front
      .map(function (pt, i) {
        return (i === 0 ? "M" : "L") + pt[0] + "," + pt[1];
      })
      .join(" ");
    var hot = (map.hotspots || [])
      .map(function (h) {
        var cls = "ukraine-hotspot pulse-" + (h.pulse || "hot");
        return (
          '<g class="' +
          cls +
          '" transform="translate(' +
          h.x +
          "," +
          h.y +
          ')">' +
          '<circle class="hot-ring" r="14"></circle>' +
          '<circle class="hot-core" r="4.5"></circle>' +
          '<text class="hot-label" x="10" y="4">' +
          escapeHtml(h.name) +
          "</text>" +
          '<title>' +
          escapeHtml((h.name || "") + " — " + (h.note || "")) +
          "</title>" +
          "</g>"
        );
      })
      .join("");

    els.ukraineMap.innerHTML =
      '<svg class="ukraine-svg" viewBox="' +
      escapeHtml(vb) +
      '" xmlns="http://www.w3.org/2000/svg" role="presentation">' +
      "<defs>" +
      '<filter id="ukr-outline-glow" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feGaussianBlur stdDeviation="1.6" result="ob"/>' +
      '<feMerge><feMergeNode in="ob"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      "</filter>" +
      '<filter id="ukr-glow" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="3.4" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      "</filter>" +
      "</defs>" +
      // Clear outline map (no filled land blob) — border pulses softly
      '<path class="ukraine-land-fill" d="' +
      path +
      '" fill="rgba(18,36,28,0.35)" stroke="none"/>' +
      '<path class="ukraine-outline ukraine-outline-pulse" d="' +
      path +
      '" fill="none" stroke="#7ec8a0" stroke-width="2.6" stroke-linejoin="round" filter="url(#ukr-outline-glow)"/>' +
      '<path class="ukraine-front-glow" d="' +
      poly +
      '" fill="none" stroke="#ffb84a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#ukr-glow)" opacity="0.45"/>' +
      '<path class="ukraine-front ukraine-front-pulse" d="' +
      poly +
      '" fill="none" stroke="#ffd27a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="ukraine-front-dash" d="' +
      poly +
      '" fill="none" stroke="#fff3d0" stroke-width="1.35" stroke-dasharray="6 8" stroke-linecap="round"/>' +
      hot +
      "</svg>";

    if (els.ukraineMapSub) {
      els.ukraineMapSub.textContent =
        (map.source || "AMK Mapping") +
        " · " +
        (map.asOf || "") +
        " · " +
        t("ukraine.mapSub");
    }
    if (els.ukraineMapSource) {
      els.ukraineMapSource.href = map.sourceUrl || "https://x.com/AMK_Mapping_";
      els.ukraineMapSource.textContent = "@AMK_Mapping_ · maps";
      els.ukraineMapSource.title = map.source || "AMK Mapping · Rybar / Suriyak";
    }
  }

  function renderUkraineCard(item) {
    var href = item.url
      ? '<a class="ukraine-headline" href="' +
        escapeHtml(item.url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(item.headline || "") +
        "</a>"
      : '<span class="ukraine-headline">' +
        escapeHtml(item.headline || "") +
        "</span>";
    var tags = (item.tags || [])
      .map(function (tg) {
        return '<span class="ukraine-tag">' + escapeHtml(tg) + "</span>";
      })
      .join("");
    return (
      '<article class="ukraine-card" data-source="' +
      escapeHtml(item.sourceId || "") +
      '">' +
      '<div class="ukraine-card-meta">' +
      '<span class="talk-chip">' +
      escapeHtml(item.category || "GEO") +
      "</span>" +
      '<span class="talk-chip guest">' +
      escapeHtml(item.source || ukraineSourceChip(item.sourceId)) +
      "</span>" +
      '<span class="ukraine-date">' +
      escapeHtml(item.date || "") +
      "</span>" +
      "</div>" +
      href +
      '<p class="ukraine-summary">' +
      escapeHtml(item.summary || "") +
      "</p>" +
      (tags ? '<div class="ukraine-tags">' + tags + "</div>" : "") +
      "</article>"
    );
  }

  function ukraineVisibleItems() {
    var data = state.ukraine;
    if (!data) return [];
    var items = (data.items || []).slice();
    var filt = state.ukraineFilter || "all";
    if (filt && filt !== "all") {
      items = items.filter(function (it) {
        return it.sourceId === filt;
      });
    }
    var q = (els.ukraineSearch && els.ukraineSearch.value
      ? els.ukraineSearch.value
      : ""
    )
      .trim()
      .toLowerCase();
    if (q) {
      items = items.filter(function (it) {
        var blob = [
          it.headline,
          it.summary,
          it.source,
          it.category,
          (it.tags || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    return items;
  }

  function renderUkraineFilters() {
    if (!els.ukraineFilters || !state.ukraine) return;
    var sources = (state.ukraine.sources || []).filter(function (s) {
      return s.major;
    });
    var bits = [
      '<button type="button" class="ukr-filter-btn' +
        (state.ukraineFilter === "all" ? " active" : "") +
        '" data-ukr-filter="all">' +
        escapeHtml(t("ukraine.filterAll")) +
        "</button>",
    ];
    sources.forEach(function (s) {
      bits.push(
        '<button type="button" class="ukr-filter-btn' +
          (state.ukraineFilter === s.id ? " active" : "") +
          '" data-ukr-filter="' +
          escapeHtml(s.id) +
          '">' +
          escapeHtml(ukraineSourceChip(s.id) || s.name) +
          "</button>"
      );
    });
    els.ukraineFilters.innerHTML = bits.join("");
    $all("[data-ukr-filter]", els.ukraineFilters).forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.ukraineFilter = btn.getAttribute("data-ukr-filter") || "all";
        renderUkraineFilters();
        renderUkraineList();
        refreshFullPageTranslation();
      });
    });
  }

  function renderUkraineList() {
    if (!els.ukraineList) return;
    if (!state.ukraine) {
      els.ukraineList.innerHTML =
        '<p class="error">' + escapeHtml(t("ukraine.loadError")) + "</p>";
      if (els.ukraineCount) els.ukraineCount.textContent = "";
      return;
    }
    var items = ukraineVisibleItems();
    var total = (state.ukraine.items || []).length;
    if (els.ukraineCount) {
      els.ukraineCount.textContent =
        t("subs.shown", { n: items.length }) +
        (items.length !== total ? t("subs.listed", { n: total }) : "");
    }
    els.ukraineList.innerHTML = items.length
      ? items.map(renderUkraineCard).join("")
      : '<p class="empty">' + escapeHtml(t("ukraine.empty")) + "</p>";
  }

  function renderUkraineView() {
    hideAllPanels();
    if (els.ukraineView) els.ukraineView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    var updated =
      state.ukraine && state.ukraine.updated
        ? formatDate(state.ukraine.updated)
        : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("ukraine.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(updated ? t("ukraine.updated", { date: updated }) : "") +
      "</span>" +
      (state.ukraine && state.ukraine.blurb
        ? '<p class="ukraine-blurb">' +
          escapeHtml(state.ukraine.blurb) +
          "</p>"
        : "") +
      renderUkraineFrame(state.ukraine && state.ukraine.frame);

    if (els.dateline) els.dateline.textContent = t("ukraine.title");

    if (!state.ukraine) {
      if (els.ukraineMap) els.ukraineMap.innerHTML = "";
      if (els.ukraineList)
        els.ukraineList.innerHTML =
          '<p class="error">' + escapeHtml(t("ukraine.loadError")) + "</p>";
      return;
    }

    renderUkraineMap(state.ukraine.map);
    renderUkraineFilters();
    renderUkraineList();
  }

  function renderOddsView() {
    hideAllPanels();
    els.oddsView.classList.remove("hidden");
    els.editionMeta.classList.remove("hidden");

    const updated = state.odds && state.odds.updated
      ? formatDate(state.odds.updated)
      : "";

    els.editionMeta.innerHTML =
      '<div class="edition-title-block">' +
      '<h1 class="edition-title">' +
      escapeHtml(t("odds.title")) +
      "</h1>" +
      "</div>" +
      '<span class="edition-date">' +
      escapeHtml(updated ? t("odds.updated", { date: updated }) : "") +
      "</span>";

    if (els.dateline) els.dateline.textContent = t("odds.title");

    if (!state.odds || !(state.odds.markets || []).length) {
      els.oddsBoard.innerHTML =
        '<p class="error">' + escapeHtml(t("odds.loadError")) + "</p>";
      return;
    }

    els.oddsBoard.innerHTML =
      '<p class="updated-stamp">' +
      escapeHtml(t("odds.stamp", { ts: state.odds.updated || "" })) +
      "</p>" +
      state.odds.markets
        .map(function (m) {
          return renderMarketCard(m, false);
        })
        .join("");
  }

  function renderAbout() {
    hideAllPanels();
    els.about.classList.remove("hidden");
    if (els.dateline) els.dateline.textContent = t("nav.about");
    reapplyChrome();
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
    return res.json();
  }

  async function ensureDeskData() {
    const jobs = [];
    if (!state.odds) {
      jobs.push(
        fetchJson(ODDS_URL)
          .then(function (d) {
            state.odds = d;
            state.cache["odds.json"] = d;
            // Seed FED NEXT from desk odds if live API has not painted yet.
            if (!state.fedNext || state.fedNext.hike == null) {
              var seeded = fedNextFromOdds(d);
              if (seeded) renderFedNext(seeded);
            }
          })
          .catch(function (err) {
            console.error(err);
            state.odds = null;
          })
      );
    }
    if (!state.talks) {
      jobs.push(
        fetchJson(TALKS_URL)
          .then(function (d) {
            state.talks = d;
            state.cache["talks.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.talks = null;
          })
      );
    }
    if (!state.favorites) {
      jobs.push(
        fetchJson(FAVORITES_URL)
          .then(function (d) {
            state.favorites = d;
            state.cache["favorites.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.favorites = DEFAULT_FAVORITES;
          })
      );
    }

    if (!state.portfolio) {
      jobs.push(
        fetchJson(PORTFOLIO_URL)
          .then(function (d) {
            state.portfolio = d;
            state.cache["portfolio.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.portfolio = null;
          })
      );
    }
    if (!state.ews) {
      jobs.push(
        fetchJson(EWS_URL)
          .then(function (d) {
            state.ews = d;
            state.cache["ews.json"] = d;
            renderEwsChip(d);
          })
          .catch(function (err) {
            console.error(err);
            state.ews = null;
            renderEwsChip(null);
          })
      );
    } else {
      renderEwsChip(state.ews);
    }

    if (!state.btcChain) {
      jobs.push(
        fetchJson(BTC_CHAIN_URL)
          .then(function (d) {
            state.btcChain = d;
            state.cache["btc-chain.json"] = d;
            if (state.lastPrices) {
              setTicker(state.lastPrices);
              if (els.priceStrip && !els.priceStrip.classList.contains("hidden")) {
                renderPriceStrip(state.lastPrices);
              }
            }
          })
          .catch(function (err) {
            console.error(err);
            state.btcChain = null;
          })
      );
    }

    if (!state.subsExcludes) {
      jobs.push(
        fetchJson(SUBS_EXCLUDES_URL)
          .then(function (d) {
            state.subsExcludes = d;
            state.cache["subs-excludes.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.subsExcludes = { patterns: [] };
          })
      );
    }

    if (!state.podcastSubs) {
      jobs.push(
        fetchJson(PODCAST_SUBS_URL)
          .then(function (d) {
            state.podcastSubs = d;
            state.cache["podcast-subs.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.podcastSubs = null;
          })
      );
    }

    if (!state.youtubeSubs) {
      jobs.push(
        fetchJson(YOUTUBE_SUBS_URL)
          .then(function (d) {
            state.youtubeSubs = d;
            state.cache["youtube-subs.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.youtubeSubs = null;
          })
      );
    }


    if (!state.ukraine) {
      jobs.push(
        fetchJson(UKRAINE_URL)
          .then(function (d) {
            state.ukraine = d;
            state.cache["ukraine.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.ukraine = null;
          })
      );
    }

    if (!state.reads) {
      jobs.push(
        fetchJson(READS_URL)
          .then(function (d) {
            state.reads = d;
            state.cache["reads.json"] = d;
          })
          .catch(function (err) {
            console.error(err);
            state.reads = null;
          })
      );
    }

    if (jobs.length) await Promise.all(jobs);
  }

  async function loadEdition(type) {
    const entry = state.byType[type];
    if (!entry) {
      hideAllPanels();
      els.items.classList.remove("hidden");
      showError(t("error.noEdition", { type: type }));
      return;
    }

    showLoading();
    if (type === "daily") await ensureDeskData();

    try {
      let data = state.cache[entry.file];
      if (!data) {
        data = await fetchJson(CONTENT_BASE + entry.file);
        state.cache[entry.file] = data;
      }
      renderEdition(data);
    } catch (err) {
      console.error(err);
      showError(t("error.loadFile", { file: entry.file }));
    }
  }

  function setActiveNav(view) {
    state.currentView = view;
    if (els.taglineRow) els.taglineRow.classList.toggle("hidden", view === "ukraine");
    else if (els.tagline) els.tagline.classList.toggle("hidden", view === "ukraine");
    els.navBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }

  function refreshFullPageTranslation() {
    if (window.OzarkI18n && typeof window.OzarkI18n.refreshTranslation === "function") {
      window.OzarkI18n.refreshTranslation();
    }
  }

  async function navigate(view) {
    setActiveNav(view);
    history.replaceState(null, "", "#" + view);

    if (view === "about") {
      renderAbout();
      refreshFullPageTranslation();
      return;
    }
    if (view === "talks") {
      await ensureDeskData();
      renderTalksView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "podcast-subs" || view === "podcasts") {
      await ensureDeskData();
      renderPodcastSubsView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "youtube-subs" || view === "youtube") {
      await ensureDeskData();
      renderYoutubeSubsView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "reads") {
      await ensureDeskData();
      renderReadsView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "ukraine") {
      await ensureDeskData();
      renderUkraineView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "odds") {
      await ensureDeskData();
      renderOddsView();
      refreshFullPageTranslation();
      return;
    }
    if (view === "model-portfolio" || view === "portfolio") {
      await ensureDeskData();
      renderPortfolioView();
      refreshFullPageTranslation();
      return;
    }
    await loadEdition(view);
    refreshFullPageTranslation();
  }


  function bindLangSwitch() {
    $all(".lang-btn[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang") || "en";
        if (window.OzarkI18n) window.OzarkI18n.setLang(lang);
        stampFooter();
        // Re-render active view so dynamic chrome picks up new strings
        navigate(state.currentView || viewFromHash());
      });
    });
  }

  function bindNav() {
    els.navBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        navigate(btn.dataset.view);
      });
    });

    const logo = $(".logo");
    if (logo) {
      logo.addEventListener("click", function () {
        navigate("daily");
      });
    }

    $all("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        navigate(btn.getAttribute("data-goto"));
      });
    });
  }

  function viewFromHash() {
    const h = (location.hash || "#daily").replace(/^#/, "").toLowerCase();
    if (h === "portfolio") return "model-portfolio"; // legacy hash
    if (h === "podcasts") return "podcast-subs";
    if (h === "youtube") return "youtube-subs";
    if (
      [
        "daily",
        "weekly",
        "forward",
        "talks",
        "podcast-subs",
        "youtube-subs",
        "reads",
        "odds",
        "ukraine",
        "model-portfolio",
        "about",
      ].indexOf(h) >= 0
    ) {
      return h;
    }
    return "daily";
  }

  function stampFooter() {
    if (!els.footerStamp) return;
    const now = new Date();
    const stamp = now.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    els.footerStamp.textContent = stamp + t("footer.suffix");
  }

  async function init() {
    els.tickerPrices = $("#ticker-prices");
    els.ewsChip = $("#ews-chip");
    els.ewsChipLevel = $("#ews-chip-level");
    els.main = $("#main");
    els.tagline = $(".tagline");
    els.taglineRow = $("#tagline-row");
    els.fedNext = $("#fed-next");
    els.editionMeta = $("#edition-meta");
    els.priceStrip = $("#price-strip");
    els.items = $("#items");
    els.about = $("#about");
    els.deskRails = $("#desk-rails");
    els.oddsStrip = $("#odds-strip");
    els.talksStrip = $("#talks-strip");
    els.talksView = $("#talks-view");
    els.podcastSubsView = $("#podcast-subs-view");
    els.podcastSubsList = $("#podcast-subs-list");
    els.podcastSubsSearch = $("#podcast-subs-search");
    els.podcastSubsCount = $("#podcast-subs-count");
    els.youtubeSubsView = $("#youtube-subs-view");
    els.youtubeSubsList = $("#youtube-subs-list");
    els.youtubeSubsSearch = $("#youtube-subs-search");
    els.youtubeSubsCount = $("#youtube-subs-count");
    els.readsView = $("#reads-view");
    els.readsList = $("#reads-list");
    els.readsSearch = $("#reads-search");
    els.readsCount = $("#reads-count");
    els.ukraineView = $("#ukraine-view");
    els.ukraineMapWrap = $("#ukraine-map-wrap");
    els.ukraineMap = $("#ukraine-map");
    els.ukraineMapSub = $("#ukraine-map-sub");
    els.ukraineMapSource = $("#ukraine-map-source");
    els.ukraineSearch = $("#ukraine-search");
    els.ukraineFilters = $("#ukraine-filters");
    els.ukraineCount = $("#ukraine-count");
    els.ukraineList = $("#ukraine-list");
    els.oddsView = $("#odds-view");
    els.portfolioView = $("#portfolio-view");
    els.portfolioStrip = $("#portfolio-strip");
    els.portfolioHorizons = $("#portfolio-horizons");
    els.portfolioChart = $("#portfolio-chart");
    els.portfolioChartTitle = $("#portfolio-chart-title");
    els.portfolioRangeBtns = $("#portfolio-range-btns");
    els.portfolioYtdBadge = $("#portfolio-ytd-badge");
    els.portfolioTbody = $("#portfolio-tbody");
    els.portfolioNote = $("#portfolio-note");
    els.featuredSection = $("#featured-section");
    els.featuredList = $("#featured-list");
    els.interviewsList = $("#interviews-list");
    els.podcastsList = $("#podcasts-list");
    els.oddsBoard = $("#odds-board");
    els.navBtns = $all(".nav-btn");
    els.dateline = $("#dateline");
    els.footerStamp = $("#footer-stamp");
    els.collumQuote = $("#collum-quote");
    els.collumQuoteKicker = $("#collum-quote-kicker");
    els.collumQuoteText = $("#collum-quote-text");
    els.collumQuoteByline = $("#collum-quote-byline");
    els.collumQuoteSource = $("#collum-quote-source");

    if (window.OzarkI18n) window.OzarkI18n.init();
    bindLangSwitch();
    bindNav();
    if (els.podcastSubsSearch) {
      els.podcastSubsSearch.addEventListener("input", function () {
        if (state.currentView !== "podcast-subs") return;
        renderSubsGrouped(
          els.podcastSubsList,
          els.podcastSubsCount,
          state._podcastSubsVisible || [],
          els.podcastSubsSearch.value,
          "podcasts"
        );
        refreshFullPageTranslation();
      });
    }
    if (els.youtubeSubsSearch) {
      els.youtubeSubsSearch.addEventListener("input", function () {
        if (state.currentView !== "youtube-subs") return;
        renderSubsGrouped(
          els.youtubeSubsList,
          els.youtubeSubsCount,
          state._youtubeSubsVisible || [],
          els.youtubeSubsSearch.value,
          "youtube"
        );
        refreshFullPageTranslation();
      });
    }
    if (els.readsSearch) {
      els.readsSearch.addEventListener("input", function () {
        if (state.currentView !== "reads") return;
        renderReadsGrouped(
          els.readsList,
          els.readsCount,
          state._readsVisible || [],
          els.readsSearch.value
        );
        refreshFullPageTranslation();
      });
    }
    if (els.ukraineSearch) {
      els.ukraineSearch.addEventListener("input", function () {
        if (state.currentView !== "ukraine") return;
        renderUkraineList();
        refreshFullPageTranslation();
      });
    }
    stampFooter();
    var bootPrices = {
      btc: 83636,
      gold: 4194,
      shaGoldPrem: 20,
      copper: 6.63,
      wti: 89.51,
      brent: 96.20,
      tenY: 5.26,
      muel: 460,
    };
    state.seedPrices = bootPrices;
    setTicker(bootPrices);
    startLivePriceRefresh();
    startFedNextRefresh();
    loadCollumQuote();

    // Prefetch desk data in background
    ensureDeskData();

    try {
      const index = await fetchJson(INDEX_URL);
      state.editions = index.editions || [];
      state.byType = {};
      state.editions.forEach(function (e) {
        if (!state.byType[e.type]) state.byType[e.type] = e;
      });
    } catch (err) {
      console.error(err);
      hideAllPanels();
      els.items.classList.remove("hidden");
      showError(t("error.index"));
      return;
    }

    const view = viewFromHash();
    navigate(view);

    window.addEventListener("hashchange", function () {
      navigate(viewFromHash());
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if ((state.currentView !== "model-portfolio" && state.currentView !== "portfolio") || !state.portfolio) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var s = seriesForChart(
          state.portfolio,
          state.chartRange || "ytd",
          !!state.exMuel
        );
        drawYtdChart(els.portfolioChart, s);
      }, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
