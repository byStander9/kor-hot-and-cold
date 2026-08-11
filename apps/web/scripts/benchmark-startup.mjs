import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(appDirectory, "node_modules", "next", "dist", "bin", "next");
const rounds = Number.parseInt(process.env.BENCHMARK_ROUNDS ?? "5", 10);
const port = Number.parseInt(process.env.BENCHMARK_PORT ?? "3211", 10);
const settleMs = Number.parseInt(process.env.BENCHMARK_SETTLE_MS ?? "2500", 10);
const baseUrl = `http://127.0.0.1:${port}`;

if (!Number.isInteger(rounds) || rounds < 1) {
  throw new Error("BENCHMARK_ROUNDS must be a positive integer.");
}

function waitForServer(timeoutMs = 10_000) {
  const deadline = performance.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const connect = () => {
      const socket = net.createConnection({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (performance.now() >= deadline) {
          reject(new Error(`Next.js server did not listen on port ${port}.`));
          return;
        }
        setTimeout(connect, 50);
      });
    };

    connect();
  });
}

async function request(pathname, init) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const body = await response.text();
  const durationMs = performance.now() - startedAt;

  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}: ${body}`);
  }

  return durationMs;
}

function post(pathname, body) {
  return request(pathname, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function percentile(values, fraction) {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

function summarize(samples) {
  const metrics = Object.keys(samples[0]);
  return Object.fromEntries(
    metrics.map((metric) => {
      const values = samples.map((sample) => sample[metric]);
      return [
        metric,
        {
          p50: Number(percentile(values, 0.5).toFixed(1)),
          p95: Number(percentile(values, 0.95).toFixed(1)),
          min: Number(Math.min(...values).toFixed(1)),
          max: Number(Math.max(...values).toFixed(1)),
        },
      ];
    }),
  );
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}

const samples = [];

for (let round = 0; round < rounds; round += 1) {
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: appDirectory,
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  let serverError = "";
  server.stderr.setEncoding("utf8");
  server.stderr.on("data", (chunk) => {
    serverError += chunk;
  });

  try {
    await waitForServer();
    const baseSeed = 100_000 + round * 100;
    const gameCold = await request(`/api/game?seed=${baseSeed}&v=1`);
    await new Promise((resolve) => setTimeout(resolve, settleMs));
    const firstGuessCold = await post("/api/guess", {
      guess: "기술",
      seed: baseSeed,
      version: 1,
    });
    const gameWarm = await request(`/api/game?seed=${baseSeed + 1}&v=1`);
    await new Promise((resolve) => setTimeout(resolve, settleMs));
    const firstGuessWarm = await post("/api/guess", {
      guess: "사랑",
      seed: baseSeed,
      version: 1,
    });
    const hintCold = await post("/api/hint", {
      bestRank: 100_000,
      seed: baseSeed + 2,
      version: 1,
    });
    const rankingsCold = await request(
      `/api/rankings?seed=${baseSeed + 3}&v=1&offset=0&limit=500`,
    );
    const rankingsWarm = await request(
      `/api/rankings?seed=${baseSeed + 3}&v=1&offset=500&limit=500`,
    );
    const concurrentStartedAt = performance.now();
    await Promise.all([
      post("/api/guess", {
        guess: "기술",
        seed: baseSeed + 4,
        version: 1,
      }),
      post("/api/guess", {
        guess: "사랑",
        seed: baseSeed + 4,
        version: 1,
      }),
    ]);
    const sameSeedConcurrent = performance.now() - concurrentStartedAt;

    samples.push({
      gameCold,
      gameWarm,
      firstGuessCold,
      firstGuessWarm,
      hintCold,
      rankingsCold,
      rankingsWarm,
      sameSeedConcurrent,
    });
  } finally {
    await stopServer(server);
  }

  if (serverError) process.stderr.write(serverError);
}

console.log(JSON.stringify({ rounds, samples, summary: summarize(samples) }, null, 2));
