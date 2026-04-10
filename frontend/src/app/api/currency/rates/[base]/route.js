let ratesCache = {};
let ratesCacheTime = {};
const CACHE_TTL = 3600;

export async function GET(request, { params }) {
  const { base } = await params;
  const baseCurrency = base.toUpperCase();
  const now = Date.now() / 1000;

  if (ratesCache[baseCurrency] && (now - (ratesCacheTime[baseCurrency] || 0)) < CACHE_TTL) {
    return Response.json(ratesCache[baseCurrency]);
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      const result = { base: baseCurrency, rates: data.rates || {}, updated_at: data.time_last_update_utc || '' };
      ratesCache[baseCurrency] = result;
      ratesCacheTime[baseCurrency] = now;
      return Response.json(result);
    }
  } catch {}

  if (ratesCache[baseCurrency]) return Response.json(ratesCache[baseCurrency]);
  return Response.json({ detail: 'Failed to fetch exchange rates' }, { status: 502 });
}
