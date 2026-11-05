// Refuse to scan private / loopback / link-local / metadata addresses unless --allow-private.
import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

function v4Private(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** True for loopback, RFC1918, link-local (incl. cloud metadata 169.254.169.254), ULA fc00::/7. */
export function isPrivateIp(ip) {
  const s = String(ip)
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  const fam = isIP(s);
  if (fam === 4) return v4Private(s);
  if (fam !== 6) return false;
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return v4Private(mapped[1]);
  const mappedHex = s.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16),
      lo = parseInt(mappedHex[2], 16);
    return v4Private(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (s === "::1" || s === "::") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(s)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(s)) return true; // fe80::/10 link-local
  return false;
}

/** Throws if the host is (or resolves to) a private address. */
export async function assertPublicHost(urlStr, lookup = dnsLookup) {
  const host = new URL(urlStr).hostname;
  const bare = host.replace(/^\[|\]$/g, "");
  const blocked = () =>
    new Error(
      `Refusing to scan ${host}: it is a private, loopback or link-local address. Use --allow-private if you really mean to scan an internal site.`,
    );
  if (isIP(bare)) {
    if (isPrivateIp(bare)) throw blocked();
    return;
  }
  const lower = bare.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) throw blocked();
  let addrs;
  try {
    addrs = await lookup(bare, { all: true });
  } catch {
    throw new Error(`Could not resolve ${host}`);
  }
  if (!Array.isArray(addrs)) addrs = [addrs];
  if (addrs.some((a) => isPrivateIp(a.address))) throw blocked();
}
