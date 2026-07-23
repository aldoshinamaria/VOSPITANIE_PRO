import { spawn } from "node:child_process";

const port = Number(process.env.SMOKE_PORT ?? 3107);
const baseUrl = `http://127.0.0.1:${port}`;
const routes = [
  "/",
  "/launch-readiness",
  "/login",
  "/school-passport",
  "/educational-system",
  "/events",
  "/kpvr",
  "/work-program",
  "/compliance-check",
  "/document-processing",
  "/import-history",
  "/activity-reports",
  "/inspection-center",
  "/demo"
];
const isWindows = process.platform === "win32";
const command = isWindows ? process.env.ComSpec ?? "cmd.exe" : "npm";
const args = isWindows
  ? ["/d", "/s", "/c", `npm.cmd run start -- --hostname 127.0.0.1 --port ${port}`]
  : ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)];
const server = spawn(command, args, {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";

server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await waitForServer();
  const assetUrls = new Set();

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const html = await response.text();

    if (response.status !== 200 || html.includes("Application error")) {
      throw new Error(`${route}: HTTP ${response.status}, applicationError=${html.includes("Application error")}`);
    }

    for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) {
      assetUrls.add(match[1]);
    }

    console.log(`ok - ${route} ${response.status}`);
  }

  for (const assetUrl of [...assetUrls].slice(0, 30)) {
    const response = await fetch(`${baseUrl}${assetUrl}`);

    if (response.status !== 200) {
      throw new Error(`${assetUrl}: HTTP ${response.status}`);
    }
  }

  console.log(`ok - checked ${Math.min(assetUrls.size, 30)} CSS/JS assets`);
} catch (error) {
  console.error(serverOutput);
  console.error(error);
  process.exitCode = 1;
} finally {
  if (isWindows) {
    const killer = spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      detached: true,
      stdio: "ignore"
    });
    killer.unref();
    server.stdout.destroy();
    server.stderr.destroy();
    server.unref();
  } else {
    server.kill("SIGTERM");
  }
}


async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.status < 500) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Production server did not start at ${baseUrl}`);
}
