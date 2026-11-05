// Polite, read-only fetch layer.
// - GET / HEAD / OPTIONS only (anything else throws before touching the network)
// - same-origin only (the origins we were pointed at, plus a same-site www/https redirect)
// - at most 1 request per second, 10 s timeout, honest User-Agent
export const REPO_URL = "https://github.com/waseemnasir2k26/site-slopcard";
export const USER_AGENT = `site-slopcard/1.0 (+${REPO_URL})`;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_BODY = 3 * 1024 * 1024;

/** Read a response body, stopping once maxBytes have arrived (never buffers more). */
export async function readCapped(res, maxBytes = MAX_BODY) {
  if (res.body && typeof res.body.getReader === "function") {
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total >= maxBytes) {
          chunks.push(value.subarray(0, value.byteLength - (total - maxBytes)));
          break;
        }
        chunks.push(value);
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
  }
  if (typeof res.text === "function") {
    const t = await res.text();
    return t.length > maxBytes ? t.slice(0, maxBytes) : t;
  }
  return "";
}

export class RefusedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "RefusedError";
  }
}

export function createFetcher({
  origin,
  fetchImpl = globalThis.fetch,
  minIntervalMs = 1000,
  timeoutMs = 10000,
  userAgent = USER_AGENT,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  now = () => Date.now(),
} = {}) {
  if (!origin) throw new Error("createFetcher needs an origin");
  const allowed = new Set([new URL(origin).origin]);
  const log = [];
  let last = -Infinity;

  async function request(url, method = "GET") {
    const m = String(method).toUpperCase();
    if (!SAFE_METHODS.has(m))
      throw new RefusedError(
        `refused ${m}: site-slopcard is read-only (GET/HEAD/OPTIONS only)`,
      );
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol))
      throw new RefusedError(`refused non-http URL ${u.protocol}`);
    if (!allowed.has(u.origin))
      throw new RefusedError(`refused off-origin request to ${u.origin}`);
    const wait = last + minIntervalMs - now();
    if (wait > 0) await sleep(wait);
    last = now();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetchImpl(u.href, {
        method: m,
        redirect: "manual",
        signal: ac.signal,
        headers: {
          "user-agent": userAgent,
          accept:
            "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5",
        },
      });
      const headers = {};
      if (res.headers && typeof res.headers.forEach === "function")
        res.headers.forEach((v, k) => {
          headers[k.toLowerCase()] = v;
        });
      let body = "";
      if (m === "GET") body = await readCapped(res, MAX_BODY);
      log.push({ method: m, url: u.href, status: res.status });
      return { status: res.status, headers, body, url: u.href };
    } catch (err) {
      log.push({
        method: m,
        url: u.href,
        error: err.name === "AbortError" ? "timeout" : err.message,
      });
      throw err.name === "AbortError"
        ? new Error(`timeout after ${timeoutMs}ms: ${u.href}`)
        : err;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get: (url) => request(url, "GET"),
    head: (url) => request(url, "HEAD"),
    options: (url) => request(url, "OPTIONS"),
    request,
    allowOrigin: (o) => allowed.add(new URL(o).origin),
    isAllowed: (url) => {
      try {
        return allowed.has(new URL(url).origin);
      } catch {
        return false;
      }
    },
    log,
  };
}

/** A redirect hop is acceptable only within the same site (www toggle and/or http->https). */
export function isSameSiteHop(from, to) {
  const a = new URL(from),
    b = new URL(to);
  const strip = (h) => h.replace(/^www\./, "");
  // compare host (hostname + port): a different port is a different service
  if (strip(a.host) !== strip(b.host)) return false;
  return (
    a.protocol === b.protocol ||
    (a.protocol === "http:" && b.protocol === "https:")
  );
}
