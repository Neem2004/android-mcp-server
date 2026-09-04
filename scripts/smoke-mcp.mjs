import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const SERVER_CMD = process.env.SMOKE_SERVER_CMD || "node";
const SERVER_ARGS = (process.env.SMOKE_SERVER_ARGS || "dist/index.js")
  .split(" ")
  .filter(Boolean);

const results = [];
let passCount = 0;
let failCount = 0;

function report(label, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  if (ok) passCount++;
  else failCount++;
  console.error(`[${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
  results.push({ label, ok });
}

function summarize(label, result) {
  const text = (result.content || [])
    .map((c) => c.text || "")
    .join("")
    .trim();
  const ok = result.isError !== true && text.length > 0;
  report(
    label,
    ok,
    ok ? `(${text.length} chars) ${preview(text)}` : `ERROR: ${preview(text)}`
  );
}

function preview(s, n = 120) {
  const single = s.replace(/\s+/g, " ").trim();
  return single.length > n ? single.slice(0, n) + "…" : single;
}

let seq = 0;
const pending = new Map();

function request(method, params) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    server.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"
    );
  });
}

function notify(method, params) {
  server.stdin.write(
    JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n"
  );
}

const server = spawn(SERVER_CMD, SERVER_ARGS, {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "inherit"],
});

const lineReader = createInterface({ input: server.stdout });

lineReader.on("line", (raw) => {
  const line = raw.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    console.error(
      `[WARN] stdout no-JSON (protocolo corrupto): ${preview(line)}`
    );
    return;
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message || "RPC error"));
    else resolve(msg.result);
  }
});

server.on("error", (err) => {
  console.error(`[FATAL] No se pudo arrancar el server: ${err.message}`);
  process.exit(1);
});
server.on("close", (code) => {
  if (exitCode === null) exitCode = code;
});

let exitCode = null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  try {
    const init = await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke-client", version: "1.0.0" },
    });
    report(
      "initialize",
      init.serverInfo?.name === "android-mcp-server" &&
        !!init.capabilities?.tools,
      `server=${init.serverInfo?.name} v${init.serverInfo?.version}`
    );

    notify("notifications/initialized", {});

    const list = await request("tools/list", {});
    const names = (list.tools || []).map((t) => t.name);
    const expected = [
      "adb_get_logcat",
      "adb_clear_logcat",
      "adb_dump_hierarchy",
      "adb_list_packages",
      "adb_execute_shell",
    ];
    report(
      "tools/list",
      expected.every((n) => names.includes(n)),
      `tools: ${names.join(", ")}`
    );

    await sleep(200);

    const calls = [
      {
        label: "adb_list_packages(filter=com.android, include_system)",
        name: "adb_list_packages",
        args: { filter: "com.android", include_system: true },
      },
      {
        label: "adb_get_logcat(lines=20)",
        name: "adb_get_logcat",
        args: { lines: 20 },
      },
      {
        label: "adb_dump_hierarchy",
        name: "adb_dump_hierarchy",
        args: {},
      },
      {
        label: "adb_execute_shell(getprop …release)",
        name: "adb_execute_shell",
        args: { command: "getprop ro.build.version.release" },
      },
      {
        label: "adb_clear_logcat",
        name: "adb_clear_logcat",
        args: {},
      },
    ];

    for (const c of calls) {
      try {
        const result = await request("tools/call", { name: c.name, arguments: c.args });
        summarize(c.label, result);
      } catch (err) {
        report(c.label, false, `RPC error: ${err.message}`);
      }
      await sleep(150);
    }
  } catch (err) {
    report("handshake", false, err.message);
  } finally {
    server.kill();
  }

  await sleep(300);

  console.error("\n==============================");
  console.error(`RESULTADO: ${passCount} PASS / ${failCount} FAIL`);
  console.error("==============================");

  const ok = failCount === 0;
  process.exitCode = ok ? 0 : 1;
}

main();
