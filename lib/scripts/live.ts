import { createServer } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { watch } from "node:fs";
import { resolve } from "node:path";

const LIVE_PORT = 4321;
let currentHash = "";

// --- live hash server ---
// GET  /hash  → current hash (plain text, CORS)
// POST /hash  → set current hash (body = hash string)

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/hash" && req.method === "GET") {
    res.end(currentHash);
  } else if (req.url === "/hash" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      currentHash = body.trim();
      console.log("hash updated:", currentHash);
      res.end("ok");
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
});

// --- watch + run ---

const scriptPath = resolve(process.argv[2] ?? "scripts/playground.ts");
let child: ChildProcess | null = null;

const runScript = () => {
  if (child) child.kill();
  console.log(`\n--- running ${scriptPath} ---`);
  child = spawn(
    process.execPath,
    ["--no-warnings=ExperimentalWarning", "--experimental-strip-types", scriptPath],
    { stdio: "inherit", cwd: process.cwd() }
  );
  child.on("exit", (code) => {
    child = null;
    if (code !== 0 && code !== null) console.log(`--- exited ${code} ---`);
  });
};

server.listen(LIVE_PORT, () => {
  console.log(`live server: http://localhost:${LIVE_PORT}/hash`);
  console.log(`watching: ${scriptPath}`);
  runScript();
});

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(scriptPath, { persistent: true }, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(runScript, 100);
});
