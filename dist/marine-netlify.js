(() => {
  window.MARINE_NETLIFY_STATIC = true;

  let noticeTimer;
  function showNotice() {
    let notice = document.getElementById("netlifyStaticNotice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "netlifyStaticNotice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      notice.style.cssText = [
        "position:fixed", "left:50%", "bottom:104px", "transform:translateX(-50%)",
        "z-index:100010", "max-width:min(560px,92vw)", "padding:12px 16px",
        "border:1px solid rgba(148,163,184,.25)", "border-radius:14px",
        "background:rgba(20,22,30,.96)", "color:#e2e8f0", "font:13px/1.5 Inter,system-ui,sans-serif",
        "box-shadow:0 16px 40px rgba(0,0,0,.4)", "text-align:center"
      ].join(";");
      document.body.append(notice);
    }
    notice.textContent = "This Netlify edition is static. The built-in Browser and proxy-powered apps need the full server edition.";
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 6000);
  }

  window.marineStaticNotice = showNotice;

  const style = document.createElement("style");
  style.textContent = `
    .dock-item[data-target="browserWindow"] { display:none !important; }
    #tab-browser { display:none !important; }
    .settings-tab-btn[data-target="tab-browser"] { display:none !important; }
    .launch-btn[data-proxy="1"] { opacity:.55; cursor:not-allowed !important; }
    #netlifyStaticNotice[hidden] { display:none; }
  `;
  document.head.append(style);

  document.querySelectorAll('.launch-btn[data-proxy="1"]').forEach((button) => {
    button.disabled = true;
    button.textContent = "Server edition required";
    button.setAttribute("aria-describedby", "netlifyEditionInfo");
    button.title = "This app requires the full server edition.";
  });

  const info = document.createElement("span");
  info.id = "netlifyEditionInfo";
  info.className = "sr-only";
  info.textContent = "Proxy-powered apps are unavailable in the static Netlify edition.";
  document.body.append(info);

  if (typeof window.openWindow === "function") {
    const openWindow = window.openWindow;
    window.openWindow = function (id, ...args) {
      if (id === "browserWindow") {
        showNotice();
        return;
      }
      return openWindow.call(this, id, ...args);
    };
  }

  if (typeof window.launchGame === "function") {
    const launchGame = window.launchGame;
    window.launchGame = function (title, url, proxy, ...args) {
      if (proxy && proxy !== "0" && proxy !== false) {
        showNotice();
        return Promise.resolve();
      }
      return launchGame.call(this, title, url, proxy, ...args);
    };
  }
})();
