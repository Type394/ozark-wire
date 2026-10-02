/**
 * Cloudflare Pages Function — next-FOMC hike / hold odds for Ozark Wire tagline.
 * Prefer CME FedWatch (official API if CME_FEDWATCH_API_KEY is set, else public
 * tool JSON when reachable). Fall back to Polymarket, then Kalshi.
 *
 * GET /api/fed-next → {
 *   hike, hold, cut, meeting, meetingLabel, source, asOf, url, label
 * }
 */
const UA =
  "Mozilla/5.0 (compatible; OzarkWire/1.0; +https://ozark-wire.pages.dev)";

const PM_SLUGS = [
  "fed-decision-in-october-20260617190323537",
  "fed-decision-in-october",
  "fed-decision-in-november",
  "fed-decision-in-december",
];

function jsonResponse(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control":
        maxAge != null
          ? "public, max-age=" + maxAge
          : "public, max-age=120",
      "access-control-allow-origin": "*",
    },
  });
}

function roundProb(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  var x = Number(n);
  if (x > 1.5) x = x / 100; // accept percent inputs
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  return Math.round(x * 1000) / 1000;
}

function pctLabel(p) {
  if (p == null) return "—";
  return Math.round(p * 100) + "%";
}

function pack(result) {
  var hike = roundProb(result.hike);
  var hold = roundProb(result.hold);
  var cut = roundProb(result.cut);
  if (hike == null || hold == null) return null;
  return {
    hike: hike,
    hold: hold,
    cut: cut,
    meeting: result.meeting || null,
    meetingLabel: result.meetingLabel || null,
    source: result.source,
    asOf: result.asOf || new Date().toISOString(),
    url: result.url || null,
    label:
      "FED NEXT: hike " +
      pctLabel(hike) +
      " / hold " +
      pctLabel(hold),
  };
}

async function fetchJson(url, init) {
  var headers = Object.assign(
    { Accept: "application/json", "User-Agent": UA },
    (init && init.headers) || {}
  );
  var res = await fetch(url, Object.assign({}, init || {}, { headers: headers }));
  if (!res.ok) throw new Error("http " + res.status + " " + url);
  return res.json();
}

/** Sum rate-range probs above current upper bound → hike; at range → hold. */
function fromRateRanges(ranges, currentLower, currentUpper, meta) {
  if (!ranges || !ranges.length) return null;
  var hike = 0;
  var hold = 0;
  var cut = 0;
  ranges.forEach(function (r) {
    var p = Number(r.probability);
    if (Number.isNaN(p) || p == null) return;
    var lo = Number(r.lowerRt != null ? r.lowerRt : r.lower);
    var hi = Number(r.upperRt != null ? r.upperRt : r.upper);
    if (Number.isNaN(lo) || Number.isNaN(hi)) return;
    // CME API uses basis points (375 = 3.75%)
    if (lo > 50) {
      /* already bp */
    } else {
      lo = Math.round(lo * 100);
      hi = Math.round(hi * 100);
    }
    if (lo >= currentUpper) hike += p;
    else if (hi <= currentLower) cut += p;
    else hold += p;
  });
  var total = hike + hold + cut;
  if (total > 0 && Math.abs(total - 1) > 0.05) {
    hike /= total;
    hold /= total;
    cut /= total;
  }
  return pack(
    Object.assign(
      {
        hike: hike,
        hold: hold,
        cut: cut,
      },
      meta || {}
    )
  );
}

async function fromCmeOfficial(env) {
  var key =
    (env && (env.CME_FEDWATCH_API_KEY || env.CME_API_KEY)) || null;
  if (!key) return null;
  var url =
    "https://markets.api.cmegroup.com/fedwatch/v1/forecasts/latest";
  var data = await fetchJson(url, {
    headers: {
      Authorization: "Bearer " + key,
      "x-api-key": key,
    },
  });
  var row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  var ranges = row.rateRange || row.rateRanges || [];
  // Current target 3.75–4.00% after Sep 2026 hike (override if API supplies).
  var currentLower = 375;
  var currentUpper = 400;
  var cur = row.currentReportingRt || row.currentTargetRange;
  if (typeof cur === "string") {
    var m = cur.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (m) {
      currentLower = Math.round(parseFloat(m[1]) * (parseFloat(m[1]) > 50 ? 1 : 100));
      currentUpper = Math.round(parseFloat(m[2]) * (parseFloat(m[2]) > 50 ? 1 : 100));
    }
  }
  return fromRateRanges(ranges, currentLower, currentUpper, {
    meeting: row.meetingDt || null,
    meetingLabel: row.meetingDt
      ? "FOMC " + String(row.meetingDt).slice(0, 10)
      : "Next FOMC",
    source: "CME FedWatch",
    asOf: row.calculationTimestamp || new Date().toISOString(),
    url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html",
  });
}

/** Best-effort public CME FedWatch tool payload (often blocked off-site). */
async function fromCmePublic() {
  var urls = [
    "https://www.cmegroup.com/CmeWS/mvc/FedWatch/tool",
    "https://www.cmegroup.com/CmeWS/mvc/FedWatch/Probabilities",
  ];
  var lastErr = null;
  for (var i = 0; i < urls.length; i++) {
    try {
      var data = await fetchJson(urls[i]);
      var meeting =
        (data && (data.meeting || data.nextMeeting || data.meetings)) || null;
      var ranges =
        (data && (data.rateRange || data.probabilities || data.rateRanges)) ||
        (meeting && (meeting.rateRange || meeting.probabilities)) ||
        null;
      if (Array.isArray(meeting) && meeting[0]) {
        ranges =
          meeting[0].rateRange ||
          meeting[0].probabilities ||
          meeting[0].rateRanges;
        meeting = meeting[0];
      }
      if (!ranges) continue;
      var packed = fromRateRanges(ranges, 375, 400, {
        meeting: (meeting && (meeting.meetingDt || meeting.date)) || null,
        meetingLabel: "Next FOMC",
        source: "CME FedWatch",
        url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html",
      });
      if (packed) return packed;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

function parseMaybeJson(v) {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
}

function scoreFedEvent(ev) {
  var title = String((ev && ev.title) || "").toLowerCase();
  var slug = String((ev && ev.slug) || "").toLowerCase();
  var score = 0;
  if (/fed decision/.test(title) || /fed-decision/.test(slug)) score += 5;
  if (/october|november|december|january|fomc/.test(title + " " + slug))
    score += 2;
  if (/2026|2027/.test(title + " " + slug)) score += 1;
  return score;
}

async function fromPolymarket() {
  var best = null;
  var bestScore = -1;
  for (var i = 0; i < PM_SLUGS.length; i++) {
    try {
      var data = await fetchJson(
        "https://gamma-api.polymarket.com/events?slug=" +
          encodeURIComponent(PM_SLUGS[i])
      );
      var ev = Array.isArray(data) ? data[0] : data;
      if (!ev || !ev.markets) continue;
      var sc = scoreFedEvent(ev);
      if (sc > bestScore) {
        best = ev;
        bestScore = sc;
      }
      // Prefer exact 2026 October slug when present
      if (PM_SLUGS[i].indexOf("20260617190323537") !== -1) break;
    } catch (e) {
      /* try next */
    }
  }
  if (!best) {
    // Broad search fallback
    var search = await fetchJson(
      "https://gamma-api.polymarket.com/public-search?q=" +
        encodeURIComponent("Fed Decision")
    );
    var events =
      (search && (search.events || search.hits || search)) || [];
    if (!Array.isArray(events)) events = [];
    events.forEach(function (ev) {
      var sc = scoreFedEvent(ev);
      if (sc > bestScore) {
        best = ev;
        bestScore = sc;
      }
    });
  }
  if (!best || !best.markets) return null;

  var hike = 0;
  var hold = 0;
  var cut = 0;
  best.markets.forEach(function (m) {
    var outs = parseMaybeJson(m.outcomes) || [];
    var prices = parseMaybeJson(m.outcomePrices) || [];
    var label = String(
      m.groupItemTitle || m.question || outs[0] || ""
    ).toLowerCase();
    var yes = 0;
    if (outs.length && prices.length) {
      var yi = outs.findIndex(function (o) {
        return String(o).toLowerCase() === "yes";
      });
      if (yi >= 0) yes = Number(prices[yi]) || 0;
      else yes = Number(prices[0]) || 0;
    }
    if (/no change|hold|maintain/.test(label)) hold += yes;
    else if (/increase|hike|\+\s*\d+\s*bps|bps increase/.test(label))
      hike += yes;
    else if (/decrease|cut|\-\s*\d+\s*bps|bps decrease/.test(label))
      cut += yes;
  });

  // Legacy single-market layout: outcomes named directly
  if (hike + hold + cut < 0.05) {
    best.markets.forEach(function (m) {
      var outs = parseMaybeJson(m.outcomes) || [];
      var prices = parseMaybeJson(m.outcomePrices) || [];
      for (var i = 0; i < outs.length; i++) {
        var name = String(outs[i]).toLowerCase();
        var p = Number(prices[i]) || 0;
        if (/no change|hold/.test(name)) hold += p;
        else if (/hike|increase/.test(name)) hike += p;
        else if (/cut|decrease/.test(name)) cut += p;
      }
    });
  }

  var total = hike + hold + cut;
  if (total <= 0) return null;
  if (Math.abs(total - 1) > 0.08) {
    hike /= total;
    hold /= total;
    cut /= total;
  }

  var meetingLabel = best.title || "Next FOMC";
  var end = best.endDate || best.endDateIso || null;
  return pack({
    hike: hike,
    hold: hold,
    cut: cut,
    meeting: end,
    meetingLabel: meetingLabel,
    source: "Polymarket",
    url:
      "https://polymarket.com/event/" +
      (best.slug || "fed-decision-in-october"),
  });
}

/**
 * Kalshi KXFED series: ladder of "Above X%" after next meeting.
 * Current upper bound 4.00% → P(Above 4.00%) ≈ hike; hold ≈ 1 − hike − deep cuts.
 */
async function fromKalshi() {
  var data = await fetchJson(
    "https://api.elections.kalshi.com/trade-api/v2/events?limit=5&status=open&series_ticker=KXFED&with_nested_markets=true"
  );
  var events = (data && data.events) || [];
  if (!events.length) return null;
  // Prefer nearest dated event (e.g. KXFED-26OCT)
  events.sort(function (a, b) {
    return String(a.event_ticker).localeCompare(String(b.event_ticker));
  });
  var ev = events[0];
  var markets = ev.markets || [];
  var above = [];
  markets.forEach(function (m) {
    var strike =
      m.floor_strike != null
        ? Number(m.floor_strike)
        : null;
    if (strike == null) {
      var sub = String(m.yes_sub_title || m.subtitle || "");
      var mm = sub.match(/Above\s+(\d+(?:\.\d+)?)%/i);
      if (mm) strike = parseFloat(mm[1]);
    }
    if (strike == null) return;
    var px =
      m.last_price_dollars != null
        ? Number(m.last_price_dollars)
        : m.yes_bid_dollars != null
          ? Number(m.yes_bid_dollars)
          : null;
    if (px == null || Number.isNaN(px)) return;
    above.push({ strike: strike, px: px });
  });
  if (!above.length) return null;
  above.sort(function (a, b) {
    return a.strike - b.strike;
  });

  // Current target upper = 4.00 after Sep 2026. Hike ⇒ rate above 4.00.
  var currentUpper = 4.0;
  var currentLower = 3.75;
  var hikeRow = above.find(function (r) {
    return Math.abs(r.strike - currentUpper) < 0.001;
  });
  var hike = hikeRow ? hikeRow.px : null;
  // Cut ⇒ end below current lower: approx 1 − P(Above currentLower)
  var holdFloor = above.find(function (r) {
    return Math.abs(r.strike - currentLower) < 0.001;
  });
  var cut = holdFloor ? Math.max(0, 1 - holdFloor.px) : 0;
  if (hike == null) return null;
  var hold = Math.max(0, 1 - hike - cut);
  return pack({
    hike: hike,
    hold: hold,
    cut: cut,
    meeting: ev.event_ticker || null,
    meetingLabel: ev.title || "Next FOMC",
    source: "Kalshi",
    url: "https://kalshi.com/markets/kxfed",
  });
}

export async function onRequestGet(context) {
  var env = (context && context.env) || {};
  var errors = [];

  var attempts = [
    function () {
      return fromCmeOfficial(env);
    },
    function () {
      return fromCmePublic();
    },
    function () {
      return fromPolymarket();
    },
    function () {
      return fromKalshi();
    },
  ];

  for (var i = 0; i < attempts.length; i++) {
    try {
      var packed = await attempts[i]();
      if (packed) return jsonResponse(packed, 200, 120);
    } catch (err) {
      errors.push(String((err && err.message) || err));
    }
  }

  return jsonResponse(
    {
      error: "no fed-next odds",
      errors: errors.slice(0, 4),
      hike: null,
      hold: null,
      label: "FED NEXT: —",
    },
    502,
    30
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}
