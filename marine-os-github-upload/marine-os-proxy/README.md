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

## Netlify (static edition)
The repository includes a Netlify build configuration at its root. Import the GitHub
repository in Netlify and keep the repository root as the base directory; Netlify will
read `netlify.toml` and build the static edition automatically. The build command is
`node marine-os-proxy/scripts/build-netlify.js` and the publish directory is
`marine-os-proxy/dist`.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/goofygooberr60-boop/marine-OS)

This edition serves the Marine OS interface and local tools. The built-in Browser and
proxy-powered launchers are disabled because Netlify publishes static files and does
not run this project's always-on Wisp server. Use the Render deployment above for the
full server edition. The Game Center's Seraph catalog is static metadata and cover links;
game pages still open directly from Seraph's published host. The Netlify build intentionally
excludes the nested copy of this repository and proxy service-worker files.

## Engines and speed
Settings > Browser > **Proxy engine**:
- **Auto (default):** tries **Scramjet** (newer, faster); if it is missing, or a page has not
  loaded after 15 seconds, it switches to **Ultraviolet** by itself.
- Scramjet / Ultraviolet: force one. If a site looks broken on one, try the other.
- **Test the proxy** (same place) is the first thing to run if pages don't load. It reports
  three things: whether the SERVER can reach real sites (and whether a search engine is
  blocking it), then whether Ultraviolet and Scramjet can load example.com, Wikipedia and a
  search page. Send that whole result if you ever need help.
- If a page fails to load, a yellow bar shows the real error and a one-click **Try the other
  engine** button.
- Search engines often block free hosting addresses with a captcha. Bing is the default;
  switch to another in Settings > Browser > Search engine if one gives a captcha.

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
- `public/marine-games.js`, `public/seraph-games.json`  Game Center interface and catalog index
- `public/sw.js`, `public/uv/uv.config.js`  Ultraviolet service worker + settings
- `public/sjsw.js`  Scramjet service worker
- `src/index.js`  serves everything and the /wisp/ tunnel the proxies use

Ultraviolet (Titanium Network) and Scramjet, bare-mux, Epoxy, libcurl-transport and wisp-js
(Mercury Workshop). Check their licenses before publishing a public site.
