# Marine OS (with built-in Scramjet + Ultraviolet proxy)

Everything is in this one folder. Marine OS is `public/index.html`; its **Browser** app sends
pages through a proxy, using the small Node server in `src/` (it uses only Node's built-in
parts plus the proxy packages).

## Easiest: run it on your computer
1. Install Node.js (the LTS version) from https://nodejs.org
2. Double-click **Start Marine OS (Windows).bat**  (Mac/Linux: **Start Marine OS (Mac-Linux).command**)
   The first run installs things, then your browser opens Marine OS at http://localhost:8080
3. Unlock it and open **Browser**.

(Or in a terminal: `npm install` then `npm start`.)

## Put it online so it works anywhere
The proxy needs a host that runs Node and allows WebSockets. A static host
(GitHub Pages, Netlify, Vercel, Site123) can NOT run it.
- **Render (free tier):** put this folder in a GitHub repo, then on render.com choose
  New > Blueprint and pick the repo (`render.yaml` is set up), or New > Web Service with
  build `npm install`, start `npm start`, and Health Check Path `/healthz`.
- **Anything else (Railway, Fly.io, Replit, a VPS):** build `npm install`, start `npm start`.
  A `Dockerfile` is included too. The host provides PORT automatically.
Use the https address it gives you. Service workers need HTTPS (localhost is exempt).

## Engines and speed
Settings > Browser > **Proxy engine**:
- **Auto (default):** tries **Scramjet** (newer, faster); if it is missing, or a page has not
  loaded after 15 seconds, it switches to **Ultraviolet** by itself.
- Scramjet / Ultraviolet: force one. If a site looks broken on one, try the other.
- **Test the proxy** (same place) loads a test page through each engine and shows which one
  works and how fast. Send that result if you ever need help.

What makes things slow, and what is already done about it:
- The tunnel server was changed from the deprecated `wisp-server-node` to `@mercuryworkshop/wisp-js`.
- The server compresses and caches its big files (the page is about 6x smaller on the wire),
  keeps connections alive the way Render expects, and prefers IPv4 (free hosts often have no IPv6).
- **Settings > Display > Performance mode** turns off blur, animation and shadows. It is on
  by default for slower computers.
- **Render's free plan sleeps** after 15 minutes without visitors; the first load then takes
  up to a minute. A free uptime pinger (for example UptimeRobot) that opens
  `https://YOUR-SITE.onrender.com/healthz` every 5 minutes keeps it awake.
- Pick the Render region nearest to you when you create the service.
- Free hosts are slow for video and heavy sites. Lighter pages are much faster.

## Troubleshooting
- **"Proxy offline" in the Browser:** you opened `index.html` as a file or from a static host.
  Open the address of this Node server instead.
- **Logs say "Scramjet engine: not installed":** the Browser still works using Ultraviolet.
- **Browser opens but sites never appear:** restart with `ISOLATE=1 npm start`
  (Windows PowerShell: `$env:ISOLATE=1; npm start`). This can blank game embeds.
- **`npm install` complains about a version:** copy the dependency versions from the official
  repos: https://github.com/titaniumnetwork-dev/Ultraviolet-App and
  https://github.com/MercuryWorkshop/Scramjet-App
- Some sites (logins, video, heavy web apps) will not work. Heavy traffic from one free-host
  address can also make some sites refuse the connection.

## Files
- `public/index.html`  Marine OS
- `public/sw.js`, `public/uv/uv.config.js`  Ultraviolet service worker + settings
- `public/sjsw.js`  Scramjet service worker
- `src/index.js`  serves everything and the /wisp/ tunnel the proxies use

Ultraviolet (Titanium Network) and Scramjet, bare-mux, Epoxy, libcurl-transport and wisp-js
(Mercury Workshop). Check their licenses before publishing a public site.
