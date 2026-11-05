import { test } from "node:test";
import assert from "node:assert/strict";
import { mapImpeccable, runImpeccable } from "../src/adapters/impeccable.js";
import { mapHallmark, runHallmark } from "../src/adapters/hallmark.js";
import { extractJson, runCommand } from "../src/adapters/run.js";
import { score } from "../src/score.js";

const SAMPLE = {
  findings: [
    {
      rule: "overused-font",
      severity: "warning",
      message: "Inter is the default AI font",
      selector: "body",
    },
    {
      rule: "overused-font",
      severity: "warning",
      message: "Inter again",
      selector: "h1",
    },
    {
      rule: "low-contrast",
      severity: "error",
      message: "Text contrast below 4.5:1",
      selector: ".hero p",
    },
  ],
};

test("impeccable JSON maps to one design finding per rule", () => {
  const rows = mapImpeccable(SAMPLE);
  assert.equal(rows.length, 2);
  const font = rows.find((r) => r.id === "impeccable.overused-font");
  assert.equal(font.group, "design");
  assert.equal(font.severity, "medium");
  assert.equal(font.status, "fail");
  assert.match(font.evidence, /2 hit/);
  assert.match(font.source, /Apache-2\.0.*not vendored/);
  assert.equal(
    rows.find((r) => r.id === "impeccable.low-contrast").severity,
    "high",
  );
});

test("impeccable mapping accepts a bare array and junk safely", () => {
  assert.equal(mapImpeccable([{ id: "x", severity: "info" }]).length, 1);
  assert.deepEqual(mapImpeccable(null), []);
  assert.deepEqual(mapImpeccable({ findings: "nope" }), []);
});

test("impeccable: exit 2 with JSON (findings) is a successful run", async () => {
  const calls = [];
  const runner = async (cmd, args, o) => {
    calls.push({ cmd, args, o });
    return {
      code: 2,
      stdout: "scanning...\n" + JSON.stringify(SAMPLE),
      stderr: "",
    };
  };
  const r = await runImpeccable("https://site.test/", {
    runner,
    platform: "linux",
  });
  assert.equal(r.status, "ok");
  assert.equal(r.findings.length, 2);
  assert.equal(calls[0].cmd, "npx");
  assert.deepEqual(calls[0].args, [
    "--no-install",
    "impeccable",
    "detect",
    "https://site.test/",
    "--json",
  ]);
  assert.equal(calls[0].o.timeoutMs, 90000);
});

test("impeccable: missing npx gives a degraded note, not a crash", async () => {
  const r = await runImpeccable("https://site.test/", {
    runner: async () => ({
      code: null,
      stdout: "",
      stderr: "",
      error: "ENOENT",
    }),
  });
  assert.equal(r.status, "degraded");
  assert.match(r.note, /design: partial/);
  assert.deepEqual(r.findings, []);
});

test("impeccable: timeout gives a degraded note", async () => {
  const r = await runImpeccable("https://site.test/", {
    runner: async () => ({
      code: null,
      stdout: "",
      stderr: "",
      error: "timeout",
    }),
    timeoutMs: 90000,
  });
  assert.equal(r.status, "degraded");
  assert.match(r.note, /timed out after 90s/);
});

test("impeccable: no JSON on stdout is degraded", async () => {
  const r = await runImpeccable("https://site.test/", {
    runner: async () => ({
      code: 1,
      stdout: "npm ERR! could not determine executable",
      stderr: "",
    }),
  });
  assert.equal(r.status, "degraded");
});

test("impeccable: URLs with shell metacharacters are never passed to a shell", async () => {
  let called = false;
  const r = await runImpeccable("https://site.test/?a=1&b=2", {
    runner: async () => {
      called = true;
      return {};
    },
  });
  assert.equal(called, false);
  assert.equal(r.status, "degraded");
});

test("impeccable: Windows uses npx.cmd", async () => {
  let cmd;
  await runImpeccable("https://site.test/", {
    runner: async (c) => {
      cmd = c;
      return { code: 0, stdout: "[]" };
    },
    platform: "win32",
  });
  assert.equal(cmd, "npx.cmd");
});

test("impeccable findings lower the design score", () => {
  const base = [{ group: "design", severity: "high", status: "pass" }];
  const before = score(base).groups.design.score;
  const after = score([...base, ...mapImpeccable(SAMPLE)]).groups.design.score;
  assert.ok(after < before);
});

test("hallmark JSON maps FAIL/REFLEX/WARN to high/medium/low", () => {
  const rows = mapHallmark({
    findings: [
      {
        grade: "FAIL",
        gate: "purple-gradient",
        evidence: "linear-gradient(#7c3aed",
        fix: "flat colour",
      },
      { grade: "REFLEX", gate: "eyebrow", evidence: "uppercase" },
      { grade: "WARN", gate: "em-dash", evidence: "—" },
    ],
  });
  assert.deepEqual(
    rows.map((r) => r.severity),
    ["high", "medium", "low"],
  );
  assert.ok(
    rows.every(
      (r) => r.group === "design" && r.source.includes("Nutlope/hallmark"),
    ),
  );
});

test("hallmark: missing checkout is skipped with a note", async () => {
  const r = await runHallmark("/no/such/dir", "/tmp/x.html", {
    exists: () => false,
  });
  assert.equal(r.status, "degraded");
  assert.match(r.note, /not found/);
});

test("hallmark: runs sloplint with node, never a shell", async () => {
  let seen;
  const r = await runHallmark("/hm", "/tmp/snap/x.html", {
    exists: () => true,
    runner: async (cmd, args, o) => {
      seen = { cmd, args, o };
      return {
        code: 1,
        stdout: JSON.stringify({
          summary: {},
          findings: [{ grade: "FAIL", gate: "g" }],
        }),
      };
    },
  });
  assert.equal(seen.cmd, process.execPath);
  assert.equal(seen.args.at(-1), "--json");
  assert.equal(seen.o.shell, undefined);
  assert.equal(r.findings.length, 1);
});

test("extractJson finds JSON after noise and returns null when absent", () => {
  assert.deepEqual(extractJson('noise\n{"a":1}\n'), { a: 1 });
  assert.deepEqual(extractJson("[1,2]"), [1, 2]);
  assert.equal(extractJson("nothing here"), null);
});

test("runCommand: missing binary resolves with an error, never throws", async () => {
  const r = await runCommand("definitely-not-a-real-binary-xyz", [], {
    timeoutMs: 5000,
  });
  assert.ok(r.error);
});

test("runCommand: enforces its timeout", async () => {
  const r = await runCommand(
    process.execPath,
    ["-e", "setTimeout(()=>{}, 10000)"],
    { timeoutMs: 200 },
  );
  assert.equal(r.error, "timeout");
});
