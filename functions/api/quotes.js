/**
 * Cloudflare Pages Function — Yahoo chart proxy for Ozark Wire ticker.
 * GET /api/quotes → { prices: { btc, gold, copper, cattle, feeder, wti, brent, tenY, muel }, asOf }
 */
const YAHOO = {
  btc: "BTC-USD",
  gold: "GC=F",
  copper: "HG=F",
  cattle: "LE=F",
  feeder: "GF=F",
  wti: "CL=F",
  brent: "BZ=F",
  tenY: "^TNX",
  muel: "MUEL",
};

function chartUrl(symbol) {
  return (
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?interval=1d&range=1d"
  );
}

async function fetchPrice(symbol) {
  const res = await fetch(chartUrl(symbol), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; OzarkWire/1.0; +https://ozark-wire.pages.dev)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("yahoo " + res.status);
  const data = await res.json();
  const meta = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
  if (!meta || meta.regularMarketPrice == null) throw new Error("no price");
  return Number(meta.regularMarketPrice);
}

function roundKey(key, n) {
  if (n == null || Number.isNaN(n)) return null;
  if (key === "btc" || key === "gold" || key === "muel") return Math.round(n);
  if (key === "tenY") return Math.round(n * 1000) / 1000;
  if (key === "cattle" || key === "feeder") return Math.round(n * 100) / 100;
  return Math.round(n * 100) / 100; // copper, wti, brent
}

export async function onRequestGet() {
  const prices = {};
  const keys = Object.keys(YAHOO);
  const results = await Promise.allSettled(
    keys.map(function (k) {
      return fetchPrice(YAHOO[k]).then(function (n) {
        return [k, n];
      });
    })
  );
  let ok = 0;
  results.forEach(function (r) {
    if (r.status !== "fulfilled") return;
    const key = r.value[0];
    const val = roundKey(key, r.value[1]);
    if (val != null) {
      prices[key] = val;
      ok += 1;
    }
  });
  if (!ok) {
    return new Response(JSON.stringify({ error: "no quotes", prices: {} }), {
      status: 502,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  }
  const body = {
    prices: prices,
    asOf: new Date().toISOString(),
    source: "yahoo",
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
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
