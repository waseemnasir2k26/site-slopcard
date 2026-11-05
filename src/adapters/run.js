import { spawn } from "node:child_process";

/**
 * Run a command with a hard timeout. Never throws: resolves { code, stdout, stderr, error }.
 * shell is only used for Windows .cmd shims, and callers must pass pre-validated args.
 */
export function runCommand(
  cmd,
  args,
  { timeoutMs = 90000, cwd, shell = false } = {},
) {
  return new Promise((resolve) => {
    let child;
    let stdout = "";
    let stderr = "";
    let done = false;
    const finish = (r) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, ...r });
      }
    };
    try {
      child = spawn(cmd, args, {
        cwd,
        shell,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      return resolve({
        code: null,
        stdout: "",
        stderr: "",
        error: err.code || err.message,
      });
    }
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      finish({ code: null, error: "timeout" });
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      if (stdout.length < 5e6) stdout += d;
    });
    child.stderr.on("data", (d) => {
      if (stderr.length < 1e6) stderr += d;
    });
    child.on("error", (err) =>
      finish({ code: null, error: err.code || err.message }),
    );
    child.on("close", (code) => finish({ code }));
  });
}

/** Pull the first JSON value out of noisy stdout. */
export function extractJson(text = "") {
  const s = String(text);
  for (const open of ["{", "["]) {
    let i = s.indexOf(open);
    while (i !== -1) {
      const close = open === "{" ? "}" : "]";
      const j = s.lastIndexOf(close);
      if (j > i) {
        try {
          return JSON.parse(s.slice(i, j + 1));
        } catch {}
      }
      i = s.indexOf(open, i + 1);
      if (i > 2000) break;
    }
  }
  return null;
}
