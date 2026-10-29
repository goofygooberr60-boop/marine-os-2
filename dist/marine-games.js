(() => {
  const root = document.getElementById('marineGameCenterRoot');
  if (!root) return;

  const SERAPH_HOME = 'https://seraph.reveriestudios.online';
  const SERAPH_SOURCE = 'https://github.com/a456pur/seraph';
  const SERAPH_GAME_CONTENT = 'https://cdn.jsdelivr.net/gh/a456pur/seraph@main/games/';
  const GN_MATH_SOURCE = 'https://github.com/gn-math';
  const GN_MATH_SITE = 'https://gn-math.github.io/';
  const ITCH_SOURCE = 'https://itch.io/games/free/tag-html5';
  const GN_MATH_ZONES = [
    'https://raw.githubusercontent.com/gn-math/assets/main/zones.json',
    'https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json'
  ];
  const GN_MATH_COVERS = 'https://raw.githubusercontent.com/gn-math/covers/main';
  const GN_MATH_COVERS_FALLBACK = 'https://cdn.jsdelivr.net/gh/gn-math/covers@main';
  const GN_MATH_HTML = 'https://raw.githubusercontent.com/gn-math/html/main';
  const SERAPH_IMAGE_PREFIX = 'https://raw.githubusercontent.com/a456pur/seraph/main/images/thumbnails/';
  const SERAPH_IMAGE_FALLBACK_PREFIX = 'https://cdn.jsdelivr.net/gh/a456pur/seraph@main/images/thumbnails/';
  const SLIDE_BATCH = 36;
  const GAME_FRAME_SANDBOX = 'allow-scripts allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-downloads';
  const safeText = (value) => String(value || '').trim();
  const state = {
    query: '', sort: 'featured', genre: 'all',
    gnGames: [], seraphGames: [], itchGames: [],
    gnStatus: 'loading', seraphStatus: 'loading', itchStatus: 'loading'
  };

  const style = document.createElement('style');
  style.textContent = `
    #marineGameCenterRoot{color:#e8f0ed;font-family:Inter,system-ui,sans-serif;--mgc-accent:var(--pref-accent,#76b9a9);--mgc-radius:var(--pref-window-radius,14px)}
    .mgc-shell{height:100%;display:flex;flex-direction:column;min-height:0;background:radial-gradient(ellipse at 50% -35%,color-mix(in srgb,var(--mgc-accent) 18%,transparent),transparent 60%),#07161d}
    .mgc-top{padding:17px 20px 13px;border-bottom:1px solid rgba(174,210,203,.11);background:rgba(10,29,37,.72)}
    .mgc-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
    .mgc-heading h2{font-size:21px;line-height:1.2;margin:0;font-weight:700;color:#f1f8f4;letter-spacing:-.02em}
    .mgc-heading p{font-size:12px;color:#96afa2;margin:5px 0 0}
    .mgc-source{font-size:11px;color:var(--mgc-accent);white-space:nowrap;text-decoration:none}
    .mgc-source:hover{color:color-mix(in srgb,var(--mgc-accent) 70%,white);text-decoration:underline}
    .mgc-controls{display:grid;grid-template-columns:auto minmax(130px,1fr) 130px 145px;gap:8px;align-items:center}
    .mgc-tabs{display:flex;gap:6px}
    .mgc-tab,.mgc-select,.mgc-search{height:38px;border:1px solid rgba(174,210,203,.16);background:#0b2028;color:#dce9e6;border-radius:var(--mgc-radius)}
    .mgc-tab{padding:0 14px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:650;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s}
    .mgc-tab:hover,.mgc-tab.active{background:color-mix(in srgb,var(--mgc-accent) 26%,#0b2028);border-color:var(--mgc-accent);color:#fff}
    .mgc-search{display:flex;align-items:center;gap:9px;padding:0 12px;min-width:0}
    .mgc-search i{color:var(--mgc-accent);font-size:13px}
    .mgc-search input{width:100%;min-width:0;background:transparent;border:0;outline:0;color:#f3fbf6;font-size:12px}
    .mgc-search input::placeholder{color:#8aa49f}
    .mgc-select{padding:0 10px;font-size:12px;outline:none;cursor:pointer}
    .mgc-summary{font-size:11px;color:var(--mgc-accent);margin:11px 0 0;min-height:14px}
    .mgc-grid{flex:1;min-height:0;overflow:auto;padding:16px 20px 24px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-content:start;gap:13px}
    .mgc-card{min-width:0;overflow:hidden;border-radius:var(--mgc-radius);background:#10232c;border:1px solid rgba(174,210,203,.14);cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s;color:inherit;text-align:left;padding:0;display:flex;flex-direction:column}
    .mgc-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--mgc-accent) 72%,transparent);box-shadow:0 12px 26px rgba(0,0,0,.28)}
    .mgc-card:focus-visible,.mgc-tab:focus-visible,.mgc-select:focus-visible,.mgc-search:focus-within{outline:2px solid var(--mgc-accent);outline-offset:2px}
    .mgc-cover{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:linear-gradient(135deg,#164b4a,#0b1c24);}
    .mgc-cover-fallback{display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:16/10;background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--mgc-accent) 28%,#0b1c24),#0b1c24 74%);color:var(--mgc-accent);font-size:32px}
    .mgc-name{padding:9px 10px 10px;font-size:12px;line-height:1.25;font-weight:650;color:#e6f1ef;min-height:34px;text-transform:capitalize;overflow-wrap:anywhere}
    .mgc-empty{grid-column:1/-1;border:1px dashed color-mix(in srgb,var(--mgc-accent) 38%,transparent);border-radius:var(--mgc-radius);padding:30px 22px;text-align:center;background:rgba(13,37,46,.68);color:#adc2c1}
    .mgc-empty .fa-spinner{animation:mgc-spin .9s linear infinite}@keyframes mgc-spin{to{transform:rotate(360deg)}}
    .mgc-empty i{display:block;font-size:28px;color:var(--mgc-accent);margin:0 auto 10px}
    .mgc-empty strong{display:block;color:#e5f1ef;font-size:14px;margin-bottom:6px}
    .mgc-empty p{font-size:12px;line-height:1.55;max-width:520px;margin:0 auto 13px}
    .mgc-link{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:var(--mgc-radius);padding:8px 12px;background:color-mix(in srgb,var(--mgc-accent) 28%,#0b2028);color:#f4fff7;text-decoration:none;font:650 12px Inter,system-ui,sans-serif;cursor:pointer}
    .mgc-link:hover{background:color-mix(in srgb,var(--mgc-accent) 44%,#0b2028)}
    .mgc-more{grid-column:1/-1;justify-self:center;margin:6px 0 10px;padding:10px 16px;border:1px solid color-mix(in srgb,var(--mgc-accent) 42%,transparent);border-radius:var(--mgc-radius);background:color-mix(in srgb,var(--mgc-accent) 16%,#0b2028);color:#e8f0ed;font:650 12px Inter,system-ui,sans-serif;cursor:pointer}
    .mgc-more:hover{background:color-mix(in srgb,var(--mgc-accent) 30%,#0b2028)}
    .mgc-notice{margin:14px 20px 0;padding:10px 12px;border:1px solid rgba(174,210,203,.14);border-radius:var(--mgc-radius);background:rgba(16,48,58,.45);color:#a6bfbc;font-size:11px;line-height:1.5}
    .mgc-credit{padding:8px 20px;border-top:1px solid rgba(174,210,203,.1);font-size:10px;color:#8ba4a3}
    .mgc-credit a{color:var(--mgc-accent);text-decoration:none}.mgc-credit a:hover{text-decoration:underline}
    body.prefs-light #marineGameCenterRoot{color:#23343a}
    body.prefs-light .mgc-shell{background:radial-gradient(ellipse at 50% -35%,color-mix(in srgb,var(--mgc-accent) 13%,transparent),transparent 60%),#eef4f3}
    body.prefs-light .mgc-top{background:rgba(250,253,252,.88);border-color:rgba(32,66,69,.14)}
    body.prefs-light .mgc-heading h2,body.prefs-light .mgc-name,body.prefs-light .mgc-empty strong{color:#1d3035}
    body.prefs-light .mgc-heading p,body.prefs-light .mgc-notice,body.prefs-light .mgc-credit,body.prefs-light .mgc-empty{color:#536b6e}
    body.prefs-light .mgc-tab,body.prefs-light .mgc-select,body.prefs-light .mgc-search{background:#f8fbfa;color:#243b40;border-color:rgba(32,66,69,.18)}
    body.prefs-light .mgc-search input{color:#1d3035}
    body.prefs-light .mgc-tab:hover,body.prefs-light .mgc-tab.active{background:color-mix(in srgb,var(--mgc-accent) 22%,white);color:#173b39}
    body.prefs-light .mgc-card{background:#f9fcfb;border-color:rgba(32,66,69,.16)}
    body.prefs-light .mgc-more{background:color-mix(in srgb,var(--mgc-accent) 18%,white);color:#1d3035}
    body.prefs-light .mgc-notice,body.prefs-light .mgc-empty{background:rgba(255,255,255,.72)}
    body.prefs-light .mgc-credit{border-color:rgba(32,66,69,.14)}
    #marineGameOrigin{font-size:10px;color:#82aa92;margin-left:4px;text-decoration:none}
    #marineGameOrigin:hover{color:#bcebd0;text-decoration:underline}
    #marineGameOpenTab{height:40px;padding:0 13px;white-space:nowrap;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#d6e5db;font-size:12px;font-weight:650;cursor:pointer}
    #marineGameOpenTab:hover{background:rgba(255,255,255,.12);color:#fff}
    #marineFullscreenExit{position:fixed;z-index:100020;top:9px;right:10px;display:none;align-items:center;gap:8px;border-radius:10px;padding:8px 11px;background:rgba(8,24,18,.94);border:1px solid rgba(153,211,177,.28);color:#eff9f1;font:600 12px Inter,system-ui,sans-serif;box-shadow:0 8px 25px rgba(0,0,0,.24);cursor:pointer;opacity:1;pointer-events:auto}
    #marineFullscreenExit:hover{background:#174a35}
    body.marine-app-fullscreen #osTopBar,body.marine-app-fullscreen .dock-container{display:none!important}
    body.marine-app-fullscreen .os-window.maximized{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important}
    body.marine-app-fullscreen #marineFullscreenExit{display:flex}
    body.marine-browser-fullscreen #browserWindow>.window-header,
    body.marine-browser-fullscreen #browserWindow>div:nth-child(2),
    body.marine-browser-fullscreen #browserWindow>div:nth-child(3),
    body.marine-browser-fullscreen #browserWindow>div:nth-child(4){display:none!important}
    body.marine-browser-fullscreen #browserWindow{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important;background:#000!important}
    body.marine-browser-fullscreen #browserWindow>div:last-child{flex:1 1 auto!important;min-height:0!important}
    .mgc-controls{grid-template-columns:minmax(180px,1fr) 170px 170px}
    .mgc-body{flex:1;min-height:0;overflow:auto;padding:14px 20px 20px;display:flex;flex-direction:column;gap:18px;scrollbar-color:rgba(174,210,203,.3) transparent}
    .mgc-section{min-width:0;padding:12px 13px 13px;border:1px solid rgba(174,210,203,.11);border-radius:var(--mgc-radius);background:rgba(10,29,37,.55)}
    .mgc-section-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 10px}
    .mgc-section-title{min-width:0}.mgc-section-title h3{display:flex;align-items:center;gap:9px;margin:0;color:#f1f8f4;font-size:16px;font-weight:700}
    .mgc-section-title p{margin:4px 0 0;color:#96afa2;font-size:11px}
    .mgc-count{display:inline-flex;align-items:center;justify-content:center;min-height:23px;padding:2px 9px;border:1px solid color-mix(in srgb,var(--mgc-accent) 40%,transparent);border-radius:999px;background:color-mix(in srgb,var(--mgc-accent) 13%,transparent);color:var(--mgc-accent);font-size:11px;font-weight:700;white-space:nowrap}
    .mgc-slider-controls{display:flex;gap:6px;flex:none}
    .mgc-slider-control{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(174,210,203,.18);border-radius:10px;background:#0b2028;color:#e8f0ed;cursor:pointer}
    .mgc-slider-control:hover{background:color-mix(in srgb,var(--mgc-accent) 24%,#0b2028);border-color:var(--mgc-accent)}
    .mgc-slider-control:focus-visible,.mgc-more:focus-visible{outline:2px solid var(--mgc-accent);outline-offset:2px}
    .mgc-slider{display:flex;align-items:stretch;gap:12px;min-width:0;overflow-x:auto;overflow-y:hidden;padding:2px 2px 10px;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:rgba(174,210,203,.32) transparent}
    .mgc-slider::-webkit-scrollbar{height:8px}.mgc-slider::-webkit-scrollbar-thumb{background:rgba(174,210,203,.28);border-radius:99px}
    .mgc-card{flex:0 0 clamp(160px,22vw,220px);width:clamp(160px,22vw,220px);scroll-snap-align:start}
    .mgc-more{flex:0 0 156px;min-width:156px;min-height:150px;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;white-space:normal;line-height:1.4;scroll-snap-align:start}
    .mgc-empty{flex:1 0 100%;min-width:260px;padding:22px 16px}
    body.prefs-light .mgc-section{background:rgba(255,255,255,.66);border-color:rgba(32,66,69,.14)}
    body.prefs-light .mgc-section-title h3{color:#1d3035}
    body.prefs-light .mgc-section-title p{color:#536b6e}
    body.prefs-light .mgc-slider-control{background:#f8fbfa;color:#243b40;border-color:rgba(32,66,69,.18)}
    @media(max-width:1050px){.mgc-controls{grid-template-columns:minmax(150px,1fr) 150px 150px}.mgc-card{flex-basis:clamp(160px,28vw,210px);width:clamp(160px,28vw,210px)}}
    @media(max-width:680px){.mgc-top{padding:12px}.mgc-heading{margin-bottom:10px}.mgc-controls{grid-template-columns:1fr 1fr}.mgc-search{grid-column:1/-1}.mgc-body{padding:10px 12px 14px;gap:12px}.mgc-section{padding:10px}.mgc-section-head{align-items:flex-start}.mgc-section-title h3{font-size:14px}.mgc-card{flex-basis:clamp(145px,58vw,190px);width:clamp(145px,58vw,190px)}.mgc-notice{margin:10px 12px 0}.mgc-credit{padding:8px 12px}}
  `;
  document.head.append(style);

  root.innerHTML = `
    <div class="mgc-shell">
      <div class="mgc-top">
        <div class="mgc-heading"><div><h2>Game Center</h2><p>Browse GN Math and other games. Use the arrows or scroll each slider.</p></div><a class="mgc-source" href="${GN_MATH_SOURCE}" target="_blank" rel="noopener noreferrer" id="mgcSourceLink">Sources <i class="fa-solid fa-arrow-up-right-from-square"></i></a></div>
        <div class="mgc-controls">
          <label class="mgc-search"><i class="fa-solid fa-magnifying-glass"></i><input id="mgcSearch" type="search" placeholder="Search games…" aria-label="Search games"></label>
          <select class="mgc-select" id="mgcSort" aria-label="Sort games"><option value="featured">Featured order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select>
          <select class="mgc-select" id="mgcGenre" aria-label="Filter by category"><option value="all">All categories</option></select>
        </div>
        <div class="mgc-summary" id="mgcSummary" aria-live="polite">Loading game counts…</div>
      </div>
      <div class="mgc-notice" id="mgcNotice">Game pages are loaded from their public sources and run in the isolated player.</div>
      <div class="mgc-body">
        <section class="mgc-section" aria-labelledby="mgcGnHeading">
          <div class="mgc-section-head">
            <div class="mgc-section-title"><h3 id="mgcGnHeading">GN Math <span class="mgc-count" id="mgcGnCount">Loading…</span></h3><p id="mgcGnProgress">Loading catalog…</p></div>
            <div class="mgc-slider-controls"><button class="mgc-slider-control" id="mgcGnPrevious" type="button" aria-label="Previous GN Math games" title="Scroll left"><i class="fa-solid fa-chevron-left"></i></button><button class="mgc-slider-control" id="mgcGnNext" type="button" aria-label="More GN Math games" title="Scroll right"><i class="fa-solid fa-chevron-right"></i></button></div>
          </div>
          <div class="mgc-slider" id="mgcGnSlider" role="region" aria-label="GN Math games"></div>
        </section>
        <section class="mgc-section" aria-labelledby="mgcOtherHeading">
          <div class="mgc-section-head">
            <div class="mgc-section-title"><h3 id="mgcOtherHeading">Other Games <span class="mgc-count" id="mgcOtherCount">Loading…</span></h3><p id="mgcOtherProgress">Seraph and itch.io games</p></div>
            <div class="mgc-slider-controls"><button class="mgc-slider-control" id="mgcOtherPrevious" type="button" aria-label="Previous other games" title="Scroll left"><i class="fa-solid fa-chevron-left"></i></button><button class="mgc-slider-control" id="mgcOtherNext" type="button" aria-label="More other games" title="Scroll right"><i class="fa-solid fa-chevron-right"></i></button></div>
          </div>
          <div class="mgc-slider" id="mgcOtherSlider" role="region" aria-label="Other games"></div>
        </section>
      </div>
      <div class="mgc-credit">Catalogs: <a href="${GN_MATH_SOURCE}" target="_blank" rel="noopener noreferrer">GN Math</a> · <a href="${SERAPH_SOURCE}" target="_blank" rel="noopener noreferrer">Seraph</a> · <a href="${ITCH_SOURCE}" target="_blank" rel="noopener noreferrer">itch.io</a></div>
    </div>`;

  const gnSlider = root.querySelector('#mgcGnSlider');
  const otherSlider = root.querySelector('#mgcOtherSlider');
  const gnCount = root.querySelector('#mgcGnCount');
  const otherCount = root.querySelector('#mgcOtherCount');
  const gnProgress = root.querySelector('#mgcGnProgress');
  const otherProgress = root.querySelector('#mgcOtherProgress');
  const otherSources = root.querySelector('#mgcOtherHeading').parentElement.querySelector('p');
  const search = root.querySelector('#mgcSearch');
  const sort = root.querySelector('#mgcSort');
  const genre = root.querySelector('#mgcGenre');
  const summary = root.querySelector('#mgcSummary');
  const renderVersion = { gn: 0, other: 0 };

  function makeEmpty(container, icon, title, body, buttonText, callback) {
    container.replaceChildren();
    const box = document.createElement('div');
    box.className = 'mgc-empty';
    const glyph = document.createElement('i');
    glyph.className = 'fa-solid ' + icon;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.textContent = body;
    box.append(glyph, heading, copy);
    if (buttonText && typeof callback === 'function') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mgc-link';
      button.textContent = buttonText;
      button.addEventListener('click', callback);
      box.append(button);
    }
    container.append(box);
  }

  function cardFor(game) {
    function fallbackCover() {
      const fallback = document.createElement('div');
      fallback.className = 'mgc-cover-fallback';
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-gamepad';
      fallback.append(icon);
      return fallback;
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mgc-card';
    card.setAttribute('aria-label', 'Open ' + game.name);
    const image = document.createElement('img');
    image.className = 'mgc-cover';
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    const imageCandidates = [...new Set([game.image, game.imageFallback].filter(Boolean))];
    let imageCandidate = 0;
    image.addEventListener('error', () => {
      imageCandidate += 1;
      if (imageCandidate < imageCandidates.length) {
        image.src = imageCandidates[imageCandidate];
        return;
      }
      image.replaceWith(fallbackCover());
    });
    let cover = image;
    if (imageCandidates.length) image.src = imageCandidates[0];
    else cover = fallbackCover();
    const name = document.createElement('span');
    name.className = 'mgc-name';
    name.textContent = game.name;
    card.append(cover, name);
    card.addEventListener('click', () => openGame(game));
    return card;
  }

  function otherGames() {
    return state.seraphGames.concat(state.itchGames);
  }

  function otherStatus() {
    if (state.seraphStatus === 'ready' || state.itchStatus === 'ready') return 'ready';
    if (state.seraphStatus === 'error' && state.itchStatus === 'error') return 'error';
    return 'loading';
  }

  function filteredGames(sourceGames) {
    let games = sourceGames.filter(game => {
      const matchesQuery = !state.query || (game.name + ' ' + game.genre).toLowerCase().includes(state.query);
      const matchesGenre = state.genre === 'all' || game.genre === state.genre;
      return matchesQuery && matchesGenre;
    });
    if (state.sort === 'az') games.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === 'za') games.sort((a, b) => b.name.localeCompare(a.name));
    return games;
  }

  function refreshGenres() {
    const selected = state.genre;
    const allGames = state.gnGames.concat(otherGames());
    const genres = [...new Set(allGames.map(game => safeText(game.genre)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    genre.replaceChildren(new Option('All categories', 'all'));
    genres.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value.replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
      genre.append(option);
    });
    state.genre = selected === 'all' || genres.includes(selected) ? selected : 'all';
    genre.value = state.genre;
  }

  function renderSection(key, slider, countNode, progressNode, games, status, retry) {
    const version = ++renderVersion[key];
    slider.replaceChildren();
    slider.scrollLeft = 0;
    if (status === 'loading') {
      countNode.textContent = 'Loading…';
      progressNode.textContent = 'Loading catalog…';
      makeEmpty(slider, 'fa-spinner', 'Loading games', 'Fetching game names, covers, and links.', '', null);
      return;
    }
    if (status === 'error') {
      countNode.textContent = 'Unavailable';
      progressNode.textContent = 'The catalog could not be loaded.';
      makeEmpty(slider, 'fa-triangle-exclamation', 'Catalog unavailable', 'Check your connection, then retry.', 'Retry', retry);
      return;
    }

    const matches = filteredGames(games);
    const total = games.length;
    countNode.textContent = state.query || state.genre !== 'all'
      ? matches.length.toLocaleString() + ' of ' + total.toLocaleString() + ' games'
      : total.toLocaleString() + ' games';
    if (!matches.length) {
      progressNode.textContent = 'No games match the current search or category.';
      makeEmpty(slider, 'fa-magnifying-glass', 'No games found', 'Try a shorter search or choose another category.', 'Clear filters', () => {
        state.query = '';
        state.genre = 'all';
        search.value = '';
        genre.value = 'all';
        render();
      });
      return;
    }

    let shown = 0;
    function appendBatch() {
      if (version !== renderVersion[key]) return;
      const cards = document.createDocumentFragment();
      matches.slice(shown, shown + SLIDE_BATCH).forEach(game => cards.append(cardFor(game)));
      shown += Math.min(SLIDE_BATCH, matches.length - shown);
      slider.append(cards);
      progressNode.textContent = 'Showing ' + shown.toLocaleString() + ' of ' + matches.length.toLocaleString() + ' matching games';
      if (shown >= matches.length) return;
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'mgc-more';
      more.innerHTML = '<i class="fa-solid fa-arrow-right"></i><span>Load next ' + Math.min(SLIDE_BATCH, matches.length - shown) + ' games</span>';
      more.addEventListener('click', () => {
        if (version !== renderVersion[key]) return;
        more.remove();
        appendBatch();
      }, { once: true });
      slider.append(more);
    }
    appendBatch();
  }

  function render() {
    const combinedOther = otherGames();
    const otherCatalogState = otherStatus();
    if (state.gnStatus === 'error' && otherCatalogState === 'error') summary.textContent = 'Game catalogs are unavailable';
    else {
      const gnLabel = state.gnStatus === 'ready' ? state.gnGames.length.toLocaleString() + ' GN Math games' : state.gnStatus === 'error' ? 'GN Math unavailable' : 'GN Math loading';
      const otherLabel = otherCatalogState === 'ready' ? combinedOther.length.toLocaleString() + ' other games' : otherCatalogState === 'error' ? 'other games unavailable' : 'other games loading';
      summary.textContent = gnLabel + ' · ' + otherLabel;
    }
    renderSection('gn', gnSlider, gnCount, gnProgress, state.gnGames, state.gnStatus, loadGnCatalog);
    const otherRetry = () => { loadSeraphCatalog(); loadItchCatalog(); };
    renderSection('other', otherSlider, otherCount, otherProgress, combinedOther, otherCatalogState, otherRetry);
    const sourceCount = (name, status, games) => status === 'ready' ? games.length.toLocaleString() + ' ' + name : status === 'loading' ? name + ' loading' : name + ' unavailable';
    otherSources.textContent = sourceCount('Seraph', state.seraphStatus, state.seraphGames) + ' · ' + sourceCount('itch.io', state.itchStatus, state.itchGames);
  }

  function bindSliderButton(buttonId, slider, direction) {
    root.querySelector('#' + buttonId).addEventListener('click', () => {
      slider.scrollBy({ left: direction * Math.max(250, slider.clientWidth * 0.82), behavior: 'smooth' });
    });
  }
  bindSliderButton('mgcGnPrevious', gnSlider, -1);
  bindSliderButton('mgcGnNext', gnSlider, 1);
  bindSliderButton('mgcOtherPrevious', otherSlider, -1);
  bindSliderButton('mgcOtherNext', otherSlider, 1);
  search.addEventListener('input', () => { state.query = search.value.trim().toLowerCase(); render(); });
  sort.addEventListener('change', () => { state.sort = sort.value; render(); });
  genre.addEventListener('change', () => { state.genre = genre.value; render(); });

  let openTabButton = document.getElementById('marineGameOpenTab');
  if (!openTabButton) {
    openTabButton = document.createElement('button');
    openTabButton.type = 'button';
    openTabButton.id = 'marineGameOpenTab';
    openTabButton.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> Open in new tab';
    document.querySelector('#gameModal .flex.items-center.gap-3')?.append(openTabButton);
  }
  let currentGame = null;
  openTabButton.disabled = true;
  openTabButton.addEventListener('click', openGameInNewTab);

  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function withGameBase(html, url) {
    if (/<base\b[^>]*\bhref\s*=/i.test(html)) return html;
    const base = '<base href="' + escapeAttribute(url) + '">';
    if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, match => match + base);
    return '<!doctype html><html><head><meta charset="utf-8">' + base + '</head><body>' + html + '</body></html>';
  }

  function openGameInNewTab() {
    if (!currentGame?.url) return;
    if (!currentGame.documentText) {
      window.open(currentGame.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const gameUrl = URL.createObjectURL(new Blob([currentGame.documentText], { type: 'text/html' }));
    const wrapper = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;background:#000;overflow:hidden}</style></head><body><iframe title="' + escapeAttribute(currentGame.name) + '" src="' + escapeAttribute(gameUrl) + '" sandbox="' + GAME_FRAME_SANDBOX + '" allowfullscreen></iframe></body></html>';
    const wrapperUrl = URL.createObjectURL(new Blob([wrapper], { type: 'text/html' }));
    window.open(wrapperUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => { URL.revokeObjectURL(gameUrl); URL.revokeObjectURL(wrapperUrl); }, 60 * 60 * 1000);
  }

  function setCurrentGame(game, target) {
    currentGame = { ...game, url: target.href, documentText: '' };
    window.__marineCurrentGameLaunch = { title: game.name, url: target.href, proxy: false };
    const title = document.getElementById('gameModalTitle');
    if (!title) return;
    title.textContent = game.name;
    const sourceLink = game.provider === 'gn-math'
      ? 'https://github.com/gn-math/html/blob/main/' + target.pathname.slice('/gn-math/html/main/'.length)
      : game.provider === 'seraph' ? (game.source || SERAPH_SOURCE) : target.href;
    let origin = document.getElementById('marineGameOrigin');
    if (!origin) {
      origin = document.createElement('a');
      origin.id = 'marineGameOrigin';
      origin.target = '_blank';
      origin.rel = 'noopener noreferrer';
      origin.setAttribute('aria-label', 'Open the game directly at its published source');
      title.after(origin);
    }
    origin.textContent = game.provider === 'itch' ? ' · ' + target.hostname : ' · source';
    origin.href = sourceLink;
    origin.title = game.provider === 'itch' ? 'Open the direct game address: ' + target.href : 'View the published game source';
  }

  function gameDocumentUrl(game, target) {
    if (game.provider === 'gn-math' && target.hostname === 'raw.githubusercontent.com' && target.pathname.startsWith('/gn-math/html/main/')) return target.href;
    if (game.provider === 'seraph' && target.hostname === 'cdn.jsdelivr.net' && target.pathname.startsWith('/gh/a456pur/seraph@main/games/')) return target.href;
    return '';
  }

  async function openGame(game) {
    let target;
    try { target = new URL(game.url); } catch (_) { return; }
    if (target.protocol !== 'https:' || (game.provider === 'seraph' && (target.hostname !== 'cdn.jsdelivr.net' || !target.pathname.startsWith('/gh/a456pur/seraph@main/games/')))) return;
    if (game.provider === 'itch' && !(target.hostname === 'itch.io' || target.hostname.endsWith('.itch.io'))) return;
    const sourceUrl = gameDocumentUrl(game, target);
    const frame = document.getElementById('gameModalIframe');
    setCurrentGame(game, target);
    openTabButton.disabled = !sourceUrl;
    openTabButton.title = sourceUrl ? 'Open the game in a new tab' : 'Open directly at ' + target.hostname;
    if (!sourceUrl) {
      frame?.removeAttribute('sandbox');
      window.launchGame(game.name, target.href, false);
      openTabButton.disabled = false;
      return;
    }

    const request = currentGame;
    frame?.setAttribute('sandbox', GAME_FRAME_SANDBOX);
    window.launchGame(game.name, target.href, false);
    if (frame) frame.src = 'about:blank';
    try {
      const response = await fetch(sourceUrl, { mode: 'cors', credentials: 'omit', cache: 'no-cache', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Game page request failed');
      const declaredSize = Number(response.headers.get('content-length') || 0);
      if (declaredSize > 20 * 1024 * 1024) throw new Error('Game page is too large to load here');
      const source = await response.text();
      if (!source || source.length > 20 * 1024 * 1024) throw new Error('Game page is empty or too large');
      const documentText = withGameBase(source, sourceUrl);
      if (currentGame !== request || !frame) return;
      currentGame.documentText = documentText;
      frame.src = target.href;
      frame.srcdoc = documentText;
      openTabButton.disabled = false;
      openTabButton.title = 'Open the game in a new tab';
    } catch (_) {
      if (currentGame !== request || !frame) return;
      frame.src = 'about:blank';
      openTabButton.disabled = true;
      openTabButton.title = 'The game source could not be loaded';
      const loader = document.getElementById('iframeLoader');
      const icon = loader?.querySelector('i');
      const message = loader?.querySelector('p');
      if (loader) loader.style.display = 'flex';
      if (icon) icon.className = 'fa-solid fa-triangle-exclamation text-4xl mb-3 text-amber-400';
      if (message) message.textContent = 'Could not fetch this game from its source. Check your connection and retry.';
      const actions = document.getElementById('marineGameRecoveryActions');
      if (actions) actions.style.display = 'flex';
    }
  }

  function expandGnPath(value) {
    return safeText(value)
      .replace(/\{COVER_URL\}/g, GN_MATH_COVERS)
      .replace(/\{HTML_URL\}/g, GN_MATH_HTML);
  }

  function normalizeGnGame(row) {
    if (!row || row.id === -1 || !safeText(row.name) || !safeText(row.url) || row.url === 'local') return null;
    try {
      const url = new URL(expandGnPath(row.url), GN_MATH_SITE);
      if (url.protocol !== 'https:') return null;
      const coverValue = safeText(row.cover || '');
      const coverPath = coverValue.replace(/^\{COVER_URL\}/, '').replace(/^\/+/, '');
      const image = new URL(expandGnPath(coverValue), GN_MATH_COVERS + '/');
      if (image.protocol !== 'https:') return null;
      return {
        id: String(row.id),
        name: safeText(row.name),
        genre: safeText(row.genre || row.category),
        image: image.href,
        imageFallback: coverPath ? new URL(coverPath, GN_MATH_COVERS_FALLBACK + '/').href : '',
        url: url.href,
        provider: 'gn-math'
      };
    } catch (_) { return null; }
  }

  async function loadGnCatalog() {
    state.gnStatus = 'loading';
    render();
    try {
      let rows = null;
      let lastError = null;
      for (const catalogUrl of GN_MATH_ZONES) {
        try {
          const response = await fetch(catalogUrl + '?t=' + Date.now(), { cache: 'no-store' });
          if (!response.ok) throw new Error('Catalog request failed');
          const result = await response.json();
          if (!Array.isArray(result)) throw new Error('Catalog format is invalid');
          rows = result;
          break;
        } catch (error) { lastError = error; }
      }
      if (!rows) throw lastError || new Error('GN Math catalog could not be reached');
      state.gnGames = rows.map(normalizeGnGame).filter(Boolean);
      if (!state.gnGames.length) throw new Error('GN Math catalog contains no playable entries');
      state.gnStatus = 'ready';
    } catch (_) {
      state.gnGames = [];
      state.gnStatus = 'error';
    }
    render();
  }

  async function loadSeraphCatalog() {
    state.seraphStatus = 'loading';
    render();
    try {
      const response = await fetch('/seraph-games.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Catalog request failed');
      const rows = await response.json();
      state.seraphGames = Array.isArray(rows) ? rows.map(row => {
        if (!row || !safeText(row.name) || !safeText(row.id) || !safeText(row.path)) return false;
        try {
          const path = safeText(row.path);
          if (path.startsWith('/') || !/^[A-Za-z0-9._~/-]+$/.test(path) || !path.endsWith('/index.html') || path.split('/').some(part => !part || part === '.' || part === '..')) return false;
          const publishedUrl = new URL(row.url, SERAPH_HOME);
          const expectedPublishedUrl = new URL('/games/' + path, SERAPH_HOME);
          const image = row.image ? new URL(row.image) : null;
          if (publishedUrl.href !== expectedPublishedUrl.href || (image && (image.origin !== 'https://raw.githubusercontent.com' || !image.href.startsWith(SERAPH_IMAGE_PREFIX)))) return false;
          const coverName = image ? image.href.slice(SERAPH_IMAGE_PREFIX.length) : '';
          return { ...row, url: new URL(path, SERAPH_GAME_CONTENT).href, image: image ? image.href : '', imageFallback: coverName ? SERAPH_IMAGE_FALLBACK_PREFIX + coverName : '', provider: 'seraph' };
        } catch (_) { return false; }
      }) : [];
      state.seraphGames = state.seraphGames.filter(Boolean);
      if (!state.seraphGames.length) throw new Error('Seraph catalog contains no playable entries');
      state.seraphStatus = 'ready';
    } catch (_) {
      state.seraphGames = [];
      state.seraphStatus = 'error';
    }
    render();
  }

  async function loadItchCatalog() {
    state.itchStatus = 'loading';
    render();
    try {
      const response = await fetch('/itch-games.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Catalog request failed');
      const rows = await response.json();
      state.itchGames = Array.isArray(rows) ? rows.map(row => {
        if (!row || !safeText(row.name) || !safeText(row.url)) return false;
        try {
          const url = new URL(row.url);
          const image = row.image ? new URL(row.image) : null;
          if (url.protocol !== 'https:' || !(url.hostname === 'itch.io' || url.hostname.endsWith('.itch.io'))) return false;
          if (image && (image.protocol !== 'https:' || image.hostname !== 'img.itch.zone')) return false;
          return { ...row, url: url.href, image: image ? image.href : '', provider: 'itch' };
        } catch (_) { return false; }
      }).filter(Boolean) : [];
      if (!state.itchGames.length) throw new Error('Itch catalog has no valid games');
      state.itchStatus = 'ready';
    } catch (_) {
      state.itchGames = [];
      state.itchStatus = 'error';
    }
    render();
  }

  async function loadCatalog() {
    await Promise.all([loadGnCatalog(), loadSeraphCatalog(), loadItchCatalog()]);
    refreshGenres();
    render();
  }

  const exitFullscreen = document.createElement('button');
  exitFullscreen.type = 'button';
  exitFullscreen.id = 'marineFullscreenExit';
  exitFullscreen.title = 'Restore window (Esc)';
  exitFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> Restore window';
  exitFullscreen.addEventListener('click', () => {
    const full = document.querySelector('.os-window.maximized:not(.hidden),.os-window[data-marine-snap="max"]:not(.hidden)');
    if (full && typeof window.toggleMaximize === 'function') window.toggleMaximize(full.id);
  });
  document.body.append(exitFullscreen);

  function refreshFullscreen() {
    const current = typeof active === 'string' ? document.getElementById(active) : null;
    const isFullscreen = !!current && !current.classList.contains('hidden') && (current.classList.contains('maximized') || current.dataset.marineSnap === 'max');
    document.body.classList.toggle('marine-app-fullscreen', isFullscreen);
    document.body.classList.toggle('marine-browser-fullscreen', isFullscreen && current.id === 'browserWindow');
    exitFullscreen.hidden = !isFullscreen;
    exitFullscreen.style.opacity = isFullscreen ? '1' : '0';
    exitFullscreen.style.pointerEvents = isFullscreen ? 'auto' : 'none';
  }
  const windowObserver = new MutationObserver(refreshFullscreen);
  windowObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'data-marine-snap'] });
  if (typeof setActive === 'function' && !window.__marineFullscreenActiveHook) {
    const setActiveBeforeFullscreen = setActive;
    setActive = function(id) {
      const result = setActiveBeforeFullscreen.apply(this, arguments);
      requestAnimationFrame(refreshFullscreen);
      return result;
    };
    window.__marineFullscreenActiveHook = true;
  }
  window.addEventListener('resize', refreshFullscreen);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !document.body.classList.contains('marine-app-fullscreen')) return;
    const current = typeof active === 'string' ? document.getElementById(active) : null;
    if (!current || typeof window.toggleMaximize !== 'function') return;
    event.preventDefault();
    window.toggleMaximize(current.id);
  });
  document.addEventListener('fullscreenchange', () => {
    const button = document.getElementById('fullscreenBtn');
    if (button) button.innerHTML = document.fullscreenElement ? '<i class="fa-solid fa-compress"></i> Exit fullscreen' : '<i class="fa-solid fa-expand"></i> Fullscreen';
  });
  const fullscreenButton = document.getElementById('fullscreenBtn');
  if (fullscreenButton) fullscreenButton.onclick = () => {
    const wrapper = document.getElementById('iframeWrapper');
    if (!wrapper) return;
    if (!document.fullscreenElement && wrapper.requestFullscreen) wrapper.requestFullscreen().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.();
  };

  const recoveryActions = document.getElementById('marineGameRecoveryActions');
  const retryButton = recoveryActions?.querySelector('button');
  if (retryButton) {
    const replacement = retryButton.cloneNode(true);
    retryButton.replaceWith(replacement);
    replacement.addEventListener('click', () => { if (currentGame) openGame(currentGame); });
  }
  document.getElementById('gameModal')?.addEventListener('close', () => {
    currentGame = null;
    openTabButton.disabled = true;
    document.getElementById('gameModalIframe')?.removeAttribute('sandbox');
    document.getElementById('marineGameRecoveryActions')?.style.setProperty('display', 'none');
  });

  refreshFullscreen();
  render();
  loadCatalog();
})();
