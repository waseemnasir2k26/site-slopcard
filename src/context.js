// Build the immutable "ctx" every rule reads. Pure: no I/O happens here.
import {
  stripComments,
  findTags,
  findElements,
  textOf,
  parseJsonLd,
} from "./html.js";
import { parseRobots } from "./robots.js";

export function buildContext({
  url = "",
  mode = "url",
  html = "",
  headers = null,
  status = 200,
  css = "",
  robotsTxt = null,
  llmsTxt = null,
  sitemapXml = null,
  formProbes = null,
} = {}) {
  const clean = stripComments(html);
  const headMatch = clean.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = clean.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const head = headMatch ? headMatch[1] : "";
  const body = bodyMatch ? bodyMatch[1] : clean;

  const styles = findElements(clean, "style").map((s) => s.inner);
  const styleAttrs = findTags(clean, "[a-z][a-z0-9-]*")
    .map((t) => t.attrs.style)
    .filter(Boolean)
    .map((s) => `x{${s}}`);
  const allCss = [...styles, ...styleAttrs, css || ""].join("\n");

  const metas = findTags(clean, "meta").map((t) => t.attrs);
  const meta = (key, val) =>
    metas.find((m) => (m[key] || "").toLowerCase() === val.toLowerCase());
  const links = findTags(clean, "link").map((t) => t.attrs);
  const scripts = findElements(clean, "script").map((s) => ({
    attrs: s.attrs,
    inner: s.inner,
  }));
  // <script src="..."></script> written as void-ish tags are already captured above; keep tag form too
  const scriptTags = findTags(clean, "script").map((t) => t.attrs);
  const anchors = findElements(clean, "a").map((a) => ({
    attrs: a.attrs,
    text: textOf(a.inner),
  }));
  const buttons = findElements(clean, "button").map((b) => ({
    attrs: b.attrs,
    text: textOf(b.inner),
  }));
  const inputs = [
    ...findTags(clean, "input"),
    ...findTags(clean, "textarea"),
    ...findTags(clean, "select"),
  ];
  const forms = findElements(clean, "form").map((f) => ({
    attrs: f.attrs,
    inner: f.inner,
  }));
  const labels = findElements(clean, "label").map((l) => ({
    attrs: l.attrs,
    inner: l.inner,
  }));
  const imgs = findTags(clean, "img").map((t) => t.attrs);
  const heading = (n) =>
    findElements(clean, `h${n}`).map((h) => textOf(h.inner));
  const htmlTag = findTags(clean, "html")[0];
  const titleEl = findElements(clean, "title")[0];

  const doc = {
    raw: html,
    html: clean,
    head,
    body,
    text: textOf(body),
    lang: htmlTag ? htmlTag.attrs.lang || "" : "",
    title: titleEl ? textOf(titleEl.inner) : null,
    metas,
    meta,
    links,
    scripts,
    scriptTags,
    anchors,
    buttons,
    inputs,
    forms,
    labels,
    imgs,
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    paragraphs: findElements(body, "p").map((p) => textOf(p.inner)),
    listItems: findElements(clean, "li").map((li) => textOf(li.inner)),
    jsonld: parseJsonLd(clean),
  };

  let pageUrl = null;
  try {
    pageUrl = url ? new URL(url) : null;
  } catch {
    pageUrl = null;
  }

  return Object.freeze({
    url,
    pageUrl,
    mode,
    status,
    headers: headers ? lowerKeys(headers) : null,
    css: allCss,
    robotsTxt,
    robots: robotsTxt == null ? null : parseRobots(robotsTxt),
    llmsTxt,
    sitemapXml,
    formProbes,
    doc,
  });
}

function lowerKeys(h) {
  const out = {};
  for (const [k, v] of Object.entries(h)) out[k.toLowerCase()] = String(v);
  return out;
}
