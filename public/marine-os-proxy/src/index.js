import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../public");
const modulesDir = path.resolve(here, "../node_modules");

// ---------- Wisp (the tunnel both proxies use) ----------
try { logging.set_level(logging.NONE); } catch {}
wisp.options.allow_udp_streams = false;      // not needed for web pages
wisp.options.allow_loopback_ips = false;     // users must not reach this server's own network
wisp.options.allow_private_ips = false;
wisp.options.dns_result_order = "ipv4first"; // free hosts often have no IPv6; avoids slow timeouts

// ---------- find optional packages (Scramjet, libcurl) without depending on export names ----------
export function findDir(pkg, file) {
  const root = path.join(modulesDir, pkg);
  if (!fs.existsSync(root)) return null;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "src") stack.push(p); }
      else if (e.name === file) return dir;
    }
  }
  return null;
}

// ---------- static files (built-in only: fast, cached, compressed) ----------
const MOUNTS = [
  { prefix: "/", dir: publicDir, vendor: false }, // Marine OS + our config files win over vendor copies
  { prefix: "/uv/", dir: uvPath, vendor: true },
  { prefix: "/epoxy/", dir: epoxyPath, vendor: true },
  { prefix: "/baremux/", dir: baremuxPath, vendor: true },
];
const scramDir = findDir("@mercuryworkshop/scramjet", "scramjet.all.js");
const curlDir = findDir("@mercuryworkshop/libcurl-transport", "index.mjs");
if (scramDir && curlDir) {
  MOUNTS.push({ prefix: "/scram/", dir: scramDir, vendor: true }, { prefix: "/libcurl/", dir: curlDir, vendor: true });
  console.log("Scramjet engine: available");
} else {
  console.log("Scramjet engine: not installed (the Browser will use Ultraviolet)");
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".wasm": "application/wasm", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".map": "application/json", ".woff2": "font/woff2" };
const COMPRESSIBLE = new Set([".html", ".js", ".mjs", ".css", ".json", ".wasm", ".svg", ".txt", ".map"]);
const gzip = promisify(zlib.gzip), brotli = promisify(zlib.brotliCompress);
const cache = new Map(); let cacheBytes = 0;          // compressed copies are made once, then reused
const inflight = new Map();

function resolveFile(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]); } catch { return null; }
  if (p.includes("\0")) return null;
  for (const m of MOUNTS) {
    if (!p.startsWith(m.prefix)) continue;
    let rel = p.slice(m.prefix.length);
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const file = path.resolve(m.dir, "." + path.sep + rel);
    if (!file.startsWith(m.dir + path.sep)) continue;   // block ../ tricks
    try { if (fs.statSync(file).isFile()) return { file, vendor: m.vendor }; } catch {}
  }
  return null;
}

async function compressed(file, etag, enc, raw) {
  const key = file + "|" + etag + "|" + enc;
  if (cache.has(key)) return cache.get(key);
  if (!inflight.has(key)) {
    inflight.set(key, (async () => {
      const body = enc === "br"
        ? await brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
        : await gzip(raw, { level: 6 });
      if (cacheBytes + body.length > 80 * 1024 * 1024) { cache.clear(); cacheBytes = 0; }
      cache.set(key, body); cacheBytes += body.length; inflight.delete(key); return body;
    })());
  }
  return inflight.get(key);
}

async function sendFile(req, res, { file, vendor }) {
  const st = fs.statSync(file), ext = path.extname(file).toLowerCase();
  const etag = `W/"${st.size}-${Math.floor(st.mtimeMs)}"`;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", vendor ? "public, max-age=86400" : "no-cache");
  if (req.headers["if-none-match"] === etag) { res.statusCode = 304; res.end(); return; }
  const ae = req.headers["accept-encoding"] || "";
  const enc = COMPRESSIBLE.has(ext) && st.size > 1024 && st.size < 40 * 1024 * 1024 ? (/\bbr\b/.test(ae) ? "br" : /\bgzip\b/.test(ae) ? "gzip" : null) : null;
  if (enc) {
    const body = await compressed(file, etag, enc, fs.readFileSync(file));
    res.setHeader("Content-Encoding", enc); res.setHeader("Vary", "Accept-Encoding"); res.setHeader("Content-Length", body.length);
    res.end(req.method === "HEAD" ? undefined : body); return;
  }
  res.setHeader("Content-Length", st.size);
  if (req.method === "HEAD") { res.end(); return; }
  fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/healthz") { res.setHeader("Cache-Control", "no-store"); res.end("ok"); return; }
    // Optional: only if the proxy loads but pages never arrive.  ISOLATE=1 npm start  (can blank game embeds)
    if (process.env.ISOLATE) {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    }
    if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; res.end(); return; }
    const hit = resolveFile(req.url);
    if (!hit) { res.statusCode = 404; res.setHeader("Content-Type", "text/plain"); res.end("Not found"); return; }
    await sendFile(req, res, hit);
  } catch (e) {
    console.error("request error:", e.message);
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  }
});

// Render's load balancer keeps connections open longer than Node's default; matching it avoids random failures.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) {
    socket.setNoDelay(true);            // send small packets immediately (lower latency)
    socket.setKeepAlive(true, 30000);   // stop idle tunnels being dropped
    wisp.routeRequest(req, socket, head);
  } else socket.destroy();
});

// One bad connection should never take the whole server down.
process.on("uncaughtException", (e) => console.error("uncaught:", e.message));
process.on("unhandledRejection", (e) => console.error("unhandled:", e && e.message));

const port = Number(process.env.PORT) || 8080;
server.listen({ port, host: "0.0.0.0" }, () => console.log(`Marine OS is running:  http://localhost:${port}`));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { server.close(); process.exit(0); });
