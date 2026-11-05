// Lead-capture health. Detection only: we never submit a form.
// Form-discovery idea from waseemnasir2k26/lead-leak-audit (MIT, own project), reimplemented.
import { PASS, NA, fail, trunc } from "./util.js";

const SRC =
  "waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)";
const CTA =
  /\b(book|contact|get (a |an |your |my )?(quote|started|in touch|estimate|demo|offer)|start|call|schedule|hire|talk to|request|buy|order|sign up|try|enquire|inquire|apply|reserve|message|whatsapp)\b/i;

const hrefs = (ctx) => ctx.doc.anchors.map((a) => (a.attrs.href || "").trim());
const fieldInputs = (ctx) =>
  ctx.doc.inputs.filter(
    (i) => !/^(hidden|submit|button|reset|image)$/i.test(i.attrs.type || ""),
  );

export const leadRules = [
  {
    id: "leads.contact-path",
    severity: "high",
    effort: 1,
    title: "Visitors have a way to contact you",
    fix: "Add at least one contact path on the page: a form, a mailto:, a tel: or a WhatsApp link.",
    check(ctx) {
      const h = hrefs(ctx);
      const ok =
        ctx.doc.forms.length ||
        h.some((x) =>
          /^(mailto:|tel:)|wa\.me\/|api\.whatsapp\.com|\/contact/i.test(x),
        );
      return ok
        ? PASS
        : fail("No form, mailto:, tel:, WhatsApp or /contact link found");
    },
  },
  {
    id: "leads.form-present",
    severity: "medium",
    effort: 2,
    title: "Lead form on the page",
    fix: "Add a short lead form (name, email or phone, one question) where the main CTA lands.",
    check: (ctx) =>
      ctx.doc.forms.length ? PASS : fail("No <form> on the page"),
  },
  {
    id: "leads.form-action",
    severity: "high",
    effort: 1,
    title: "Forms point somewhere real",
    fix: 'Give every form a real action (your handler or form service), not "#" or javascript:.',
    check(ctx) {
      if (!ctx.doc.forms.length) return NA;
      const dead = ctx.doc.forms.filter((f) =>
        /^(#.*|javascript:.*)$/i.test((f.attrs.action || "").trim()),
      );
      return dead.length
        ? fail(
            `${dead.length} form(s) with action="${trunc(dead[0].attrs.action, 30)}"`,
          )
        : PASS;
    },
  },
  {
    id: "leads.form-https",
    severity: "high",
    effort: 1,
    title: "Forms submit over HTTPS",
    fix: "Change http:// form actions to https:// so lead data is not sent in clear text.",
    check(ctx) {
      if (!ctx.doc.forms.length) return NA;
      const bad = ctx.doc.forms.filter((f) =>
        /^http:\/\//i.test(f.attrs.action || ""),
      );
      return bad.length
        ? fail(`action="${trunc(bad[0].attrs.action, 50)}"`)
        : PASS;
    },
  },
  {
    id: "leads.form-endpoint",
    severity: "high",
    effort: 2,
    title: "Form endpoint answers (HEAD/OPTIONS probe)",
    fix: "The form handler URL returns an error. Fix or replace it before you lose more leads.",
    check(ctx) {
      const probes = ctx.formProbes;
      if (!probes || !probes.length) return NA;
      const probed = probes.filter((p) => !p.skipped);
      if (!probed.length) return NA;
      const bad = probed.filter(
        (p) => p.error || (p.status >= 400 && p.status !== 405),
      );
      return bad.length
        ? fail(bad.map((p) => `${p.url} -> ${p.error || p.status}`).join("; "))
        : PASS;
    },
  },
  {
    id: "leads.input-labels",
    severity: "medium",
    effort: 1,
    title: "Form fields are labelled",
    fix: "Give every field a <label for>, aria-label or wrapping <label> so screen readers and autofill work.",
    check(ctx) {
      const inputs = fieldInputs(ctx);
      if (!inputs.length) return NA;
      const fors = new Set(
        ctx.doc.labels.map((l) => l.attrs.for).filter(Boolean),
      );
      const wrapped = ctx.doc.labels.map((l) => l.inner).join("\n");
      const unlabelled = inputs.filter((i) => {
        const a = i.attrs;
        return !(
          a["aria-label"] ||
          a["aria-labelledby"] ||
          a.title ||
          (a.id && fors.has(a.id)) ||
          wrapped.includes(i.raw)
        );
      });
      return unlabelled.length
        ? fail(`${unlabelled.length}/${inputs.length} fields without a label`)
        : PASS;
    },
  },
  {
    id: "leads.email-type",
    severity: "low",
    effort: 1,
    title: 'Email fields use type="email"',
    fix: 'Set type="email" on email fields for validation and the right mobile keyboard.',
    check(ctx) {
      const emails = ctx.doc.inputs.filter(
        (i) =>
          /email/i.test(`${i.attrs.name || ""} ${i.attrs.id || ""}`) &&
          !/^(hidden|submit)$/i.test(i.attrs.type || ""),
      );
      if (!emails.length) return NA;
      const bad = emails.filter(
        (i) => (i.attrs.type || "").toLowerCase() !== "email",
      );
      return bad.length
        ? fail(`${bad.length} email field(s) not type="email"`)
        : PASS;
    },
  },
  {
    id: "leads.primary-cta",
    severity: "medium",
    effort: 1,
    title: "A clear call-to-action exists",
    fix: 'Add one primary button with a verb and an outcome ("Get my free quote").',
    check(ctx) {
      const items = [...ctx.doc.anchors, ...ctx.doc.buttons]
        .map((x) => x.text)
        .filter(Boolean);
      return items.some((t) => CTA.test(t) && t.length <= 60)
        ? PASS
        : fail("No button or link with an action verb");
    },
  },
  {
    id: "leads.instant-channel",
    severity: "low",
    effort: 1,
    title: "Instant channel (phone or WhatsApp)",
    fix: "Add a tap-to-call (tel:) or WhatsApp (wa.me) link for visitors ready to talk now.",
    check: (ctx) =>
      hrefs(ctx).some((x) => /^tel:|wa\.me\/|api\.whatsapp\.com/i.test(x))
        ? PASS
        : fail("No tel: or WhatsApp link"),
  },
].map((r) => ({ group: "leads", source: SRC, ...r }));
