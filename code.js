
// ThemeBuilder - safer, namespaced, production-ready
(function () {
  const NS = "themebuilder"; // namespace prefix for storage & IDs
  const STORAGE = {
    themeCSS: `${NS}_themeCSS`,
    userTheme: `userTheme`,
    selectedTheme: `${NS}_selectedTheme`,
    agn: `agn`
  };
 
  try { localStorage.setItem(STORAGE.agn, agn); } catch (e) { /* ignore storage failures */ }

  // ---- Utilities ----
  function log(...args) { /*toggle console debug here*/ console.debug("[ThemeBuilder]", ...args); }
  function safeJsonParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  // ---- Fetch/apply remote CSS JSON ----
  async function applyCSSFile() {

    const url = (() => {
      try { return decodeBase64Utf8(remoteEncoded || remoteEncoded === undefined ? remoteEncoded : remoteEncoded); } catch (e) { return atob(remoteEncoded); }
    })();

    // fallback: try decode remoteEncoded directly
    let decodedUrl;
    try { decodedUrl = decodeBase64Utf8(remoteEncoded); } catch (_) { decodedUrl = null; }
    const finalUrl = decodedUrl || (function () { try { return atob(remoteEncoded); } catch (e) { return null; } })();
    if (!finalUrl) {
      console.error("[ThemeBuilder] invalid remote URL");
      return;
    }

    const cachedCSS = localStorage.getItem(STORAGE.themeCSS);
    if (cachedCSS) {
      const text = decodeBase64Utf8(cachedCSS);
      if (text) injectCSS(text);
    }

    // try {
    //   const res = await fetch(finalUrl, { cache: "no-cache" });
    //   if (!res.ok) throw new Error(`HTTP ${res.status}`);
    //   const json = await res.json();
    //   const css = json.css || "";
    //   const themeData = json.themeData || {};
    //   const selectedtheme = json.selectedTheme || "";
    //   if (themeData && themeData["--custom-logo-url"]) {
    //     changeFavicon(themeData["--custom-logo-url"]);
    //   } else {
    //     changeFavicon('');
    //   }

    // Apply favicon immediately from localStorage to prevent flash on refresh
    const cachedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const cachedThemeData = cachedTheme.themeData || {};
    if (cachedThemeData["--custom-logo-url"]) {
        changeFavicon(cachedThemeData["--custom-logo-url"]);
    } else {
        changeFavicon('');
    }
    // Then your existing fetch below...
    try {
        const res = await fetch(finalUrl, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const css = json.css || "";
        const themeData = json.themeData || {};
        const selectedtheme = json.selectedTheme || "";
        if (themeData && themeData["--custom-logo-url"]) {
            changeFavicon(themeData["--custom-logo-url"]);
        } else {
            changeFavicon('');
        }

      const cssText = decodeBase64Utf8(css);
      try { localStorage.setItem(STORAGE.themeCSS, css); } catch (e) { /* ignore storage quota */ }
      try { localStorage.setItem(STORAGE.selectedTheme, selectedtheme); } catch (e) { /* ignore */ }
      if (!cachedCSS && cssText) injectCSS(cssText);

      // merge theme data safely
      const savedRaw = localStorage.getItem(STORAGE.userTheme);
      const saved = safeJsonParse(savedRaw) || {};
      const merged = { ...(saved.themeData || {}), ...themeData };
      injectThemeData(merged);
      applySidebarLogoFromTheme();

      // restore UI changes
      restoreHiddenMenus();
      applyHiddenMenus();
      applySubaccountTheme();
      // After: const json = await res.json();
      const loaderCSSEncoded = json.loaderCSS || "";
      const loaderCSSText = loaderCSSEncoded ? decodeBase64Utf8(loaderCSSEncoded) : "";
      // Cache the full loader CSS string
      if (typeof window.__updateLoaderCache === 'function') {
        window.__updateLoaderCache({
          logoUrl: themeData["--loader-company-url"] || "",
          animationType: themeData["--animation-settings"] || "PulsatingLogo",
          bgColor: themeData["--loader-bg-color"] || "",
          fullCSS: loaderCSSText  // ← store the full CSS
        });
      }
      if (typeof window.__themeReady === 'function') window.__themeReady();
      log("Theme applied from remote");
    } catch (err) {
      console.error("[ThemeBuilder] Failed to fetch theme:", err);
      if (typeof window.__themeReady === 'function') window.__themeReady(); // unblock loader even on error
    }
  }
/**
 * Update Sidebar Logo from CSS Variable
 * Reads: --agency-logo-url (raw URL)
 * Fallback: --agency-logo (url("..."))
 */
function applySidebarLogoFromTheme(retries = 15, delay = 300) {
    try {
        const root = document.documentElement;
        const img = document.querySelector(".agency-logo");
        if (!img) {
            // Element not in DOM yet — retry after delay
            if (retries > 0) {
                setTimeout(() => applySidebarLogoFromTheme(retries - 1, delay), delay);
            } else {
                console.warn("[ThemeBuilder] .agency-logo not found after retries.");
            }
            return;
        }
        // First check --agency-logo-url (raw clean URL)
        let url = getComputedStyle(root)
            .getPropertyValue("--agency-logo-url")
            .trim()
            .replace(/^"|"$/g, "");
        if (!url) {
            let cssUrl = getComputedStyle(root)
                .getPropertyValue("--agency-logo")
                .trim()
                .replace(/^"|"$/g, "");
            const match = cssUrl.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) url = match[1];
        }
        if (!url) return;
        img.src = url;
        img.style.objectFit = "contain";
        const w = getComputedStyle(root).getPropertyValue("--logo-width").trim();
        const h = getComputedStyle(root).getPropertyValue("--logo-height").trim();
        if (w) img.style.width = w;
        if (h) img.style.height = h;
    } catch (e) {
        console.error("[ThemeBuilder] Failed applying sidebar logo", e);
    }
}

  function decodeBase64Utf8(base64) {
    try {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes);
    } catch (e) {
      console.warn("[ThemeBuilder] decodeBase64Utf8 failed:", e);
      return "";
    }
  }

  // ---- DOM/CSS helpers ----
  function injectCSS(cssText) {
    if (!cssText) return;
    const id = `${NS}-css`;
    const old = document.getElementById(id);
    if (old) old.remove();
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = cssText;
    (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(style);
    log("Injected CSS");
  }

  function changeFavicon(url) {
    if (!url) return;
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    const existing = head.querySelectorAll("link[rel*='icon']");
    existing.forEach(e => e.remove());
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    head.appendChild(link);
    log("Favicon changed:", url);
  }
  const SUBACCOUNT_ORDER_MAP = {
              "sb_launchpad": "launchpad",
              "sb_dashboard": "dashboard",
              "sb_conversations": "conversations",
              "sb_opportunities": "opportunities",
              "sb_calendars": "calendars",
              "sb_contacts": "contacts",
              "sb_payments": "payments",
              "sb_reporting": "reporting",
              "sb_email-marketing": "marketing",
              "sb_automation": "automation",
              "sb_sites": "sites",
              "sb_app-media": "media-storage",
              "sb_memberships": "memberships",
              "sb_reputation": "reputation",
              "sb_app-marketplace": "app-marketplace",
              "sb_location-mobile-app": "mobile-app"
            };
 (function applySavedSubAccountOrderOnLoad() {
            if (!location.pathname.includes("/location/")) return;

            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const order = saved.themeData?.["--subMenuOrder"]
                ? JSON.parse(saved.themeData["--subMenuOrder"])
                : [];

            if (!order.length) return;

            // Apply CSS order
            order.forEach((menuId, index) => {
                const cssKey = SUBACCOUNT_ORDER_MAP[menuId];
                if (!cssKey) return;

                document.documentElement.style.setProperty(
                    `--${cssKey}-order`,
                    index
                );
            });
        })();

  // ---- Theme data injection ----
  function injectThemeData(themeData) {
    if (!themeData || typeof themeData !== "object") return;
    // Save merged version
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const mergedTheme = { ...(saved.themeData || {}), ...themeData };

    try { localStorage.setItem(STORAGE.userTheme, JSON.stringify({ themeData: mergedTheme })); } catch (e) { /* ignore */ }

    const root = document.documentElement;
    Object.keys(mergedTheme).forEach(key => {
      if (key.startsWith("--") && typeof mergedTheme[key] === "string") {
        try { root.style.setProperty(key, mergedTheme[key]); } catch (e) { /* ignore */ }
      }
    });

    // Optional text updates
  //  if (mergedTheme["--login-button-text"]) {const cleanText = stripQuotes(mergedTheme["--login-button-text"]);updateElementText("button.hl-btn.bg-curious-blue-500", cleanText);}
  //  if (mergedTheme["--login-headline-text"]) {const cleanText = stripQuotes(mergedTheme["--login-headline-text"]);updateElementText("h2.heading2", cleanText);}
  //  if (mergedTheme["--forgetpassword-text"]) {const cleanText = stripQuotes(mergedTheme["--forgetpassword-text"]);updateElementText("#forgot_passowrd_btn", cleanText);}
  }

// ---- Hidden/Locked menus ----

// Function to get current location ID from URL
function getCurrentLocationId() {
  const path = window.location.pathname;
  const parts = path.split('/');
  const locationIndex = parts.indexOf('location');
  if (locationIndex !== -1 && parts.length > locationIndex + 1) {
    return parts[locationIndex + 1];
  }
  return null; // No location ID in URL (agency level)
}

  // ---- Logo injection ----
  function restoreHiddenMenus() {
  const savedRaw = localStorage.getItem("userTheme"); // Changed from STORAGE.userTheme
  const saved = JSON.parse(savedRaw) || {}; // Changed from safeJsonParse
  if (!saved.themeData) return;

  const locationId = getCurrentLocationId();
  
  if (locationId) {
    // Location-specific mode - use --hiddenMenus
    if (!saved.themeData["--hiddenMenus"]) return;
    let hiddenMenus;
    try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --hiddenMenus"); return; }
    if (!hiddenMenus || typeof hiddenMenus !== "object" || !hiddenMenus[locationId]) return;
    
    Object.keys(hiddenMenus[locationId]).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      const toggleEl = document.getElementById("hide-" + menuId);
      if (!menuEl) return;
      
      const menuConfig = hiddenMenus[locationId][menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  } else {
    // Global mode - use --agencyLockedHideMenus
    if (!saved.themeData["--agencyLockedHideMenus"]) return;
    let agencyData;
    try { agencyData = JSON.parse(saved.themeData["--agencyLockedHideMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --agencyLockedHideMenus"); return; }
    if (!agencyData || typeof agencyData !== "object") return;
    
    let globalHidden = agencyData.hidden || {};
    Object.keys(globalHidden).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      const toggleEl = document.getElementById("hide-" + menuId);
      if (!menuEl) return;
      
      const menuConfig = globalHidden[menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  }
}

function applyHiddenMenus() { 
  restoreHiddenMenus(); 
}
    function showPreviewPopup(type, popupUrl, popupHeadline, popupSubHeadline, popupButtonText) {
    document.getElementById("tb-preview-popup")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "tb-preview-popup";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:200000;";

    const popup = document.createElement("div");
    popup.style.cssText = "position:relative;background:var(--sidebar-menu-bg,#1A1A1A);padding:30px;border-radius:10px;max-width:350px;width:90%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

   if (type === "simple") {
        popup.innerHTML = `<h3 class="modal-title" >Access Denied</h3><p class="modal-title" >You cannot access this feature.</p>`;
    } else if (type === "upgrade") {
        const headline    = popupHeadline    || "Upgrade Required 🚀";
        const subHeadline = popupSubHeadline || "This feature is available in Premium Plan.";
        const btnText     = popupButtonText  || "Upgrade";
        popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title" >${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
    } else if (type === "contact") {
        const headline    = popupHeadline    || "Restricted";
        const subHeadline = popupSubHeadline || "Please contact admin to get access.";
        const btnText     = popupButtonText  || "Contact";
        popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title" >${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
    }

    const actionBtn = popup.querySelector("#tb-popup-action-btn");
    if (actionBtn) {
        if (popupUrl) {
            actionBtn.addEventListener("click", () => window.open(popupUrl, "_blank"));
        } else {
            actionBtn.style.opacity = "0.5";
            actionBtn.style.cursor = "not-allowed";
            actionBtn.title = "No URL configured";
        }
    }

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = "position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;line-height:1;color:#888;cursor:pointer;padding:0;";
    closeBtn.title = "Close";
    closeBtn.onclick = () => overlay.remove();

    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}
    function applyLockedMenus() {
    const savedRaw = localStorage.getItem("userTheme");
    const saved = JSON.parse(savedRaw) || {};
    if (!saved.themeData || !saved.themeData["--lockedMenus"]) return;

    let lockedMenus;
    try { lockedMenus = JSON.parse(saved.themeData["--lockedMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --lockedMenus"); return; }
    if (!lockedMenus || typeof lockedMenus !== "object") return;

    const locationId = getCurrentLocationId();

    const allMenus = document.querySelectorAll("a[id^='sb_'], .hl_nav-header a");

    allMenus.forEach(menu => {
        const menuId = menu.id?.trim();
        if (!menuId) return;

        // Read lockData ONCE — works for both location and global
        const lockData = locationId
            ? lockedMenus[locationId]?.[menuId]
            : lockedMenus[menuId];

        const isLocked = (lockData && typeof lockData === "object")
            ? lockData.locked
            : !!lockData;

        if (isLocked) {
            if (!menu.querySelector(".tb-lock-icon")) {
                const lockIcon = document.createElement("i");
                lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
                lockIcon.style.color = "#F54927";
                lockIcon.style.setProperty("display", "inline-block", "important");
                lockIcon.style.setProperty("visibility", "visible", "important");
                lockIcon.style.setProperty("opacity", "1", "important");
                lockIcon.style.setProperty("position", "relative", "important");
                lockIcon.style.setProperty("z-index", "9999", "important");
                menu.appendChild(lockIcon);
            }
            menu.style.setProperty("opacity", "0.6", "important");
            menu.style.setProperty("cursor", "not-allowed", "important");

            // Extract popup config from the single lockData read above
            const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
            const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
            const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
            const popupSubHeadline = (lockData && typeof lockData === "object" && lockData.popupSubHeadline) ? lockData.popupSubHeadline : "";
            const popupButtonText  = (lockData && typeof lockData === "object" && lockData.popupButtonText)  ? lockData.popupButtonText  : "";

           if (menu.dataset.tbLockBound !== "1") {
                    menu.addEventListener("click", (e) => {
                        blockMenuClick(e, menuId);
                    }, true);
                    menu.dataset.tbLockBound = "1";
                }
        } else {
            const icon = menu.querySelector(".tb-lock-icon");
            if (icon) icon.remove();
            menu.style.setProperty("opacity", "1", "important");
            menu.style.setProperty("cursor", "auto", "important");
            if (menu.dataset.tbLockBound === "1") {
                menu.removeEventListener("click", blockMenuClick, true);
                delete menu.dataset.tbLockBound;
            }
        }
    });
}
function applySubaccountTheme() {
  console.log("Applying subaccount theme if available...");
    // Only run when we are inside a subaccount page (/location/XXXX/...)
    const locationId = getCurrentLocationId();
    if (!locationId) return;

    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData || !saved.themeData["--subaccountThemes"]) return;

    let subaccountThemes;
    try {
        subaccountThemes = JSON.parse(saved.themeData["--subaccountThemes"]);
    } catch (e) {
        console.warn("[ThemeBuilder] invalid --subaccountThemes JSON");
        return;
    }

    const locationTheme = subaccountThemes[locationId];
    if (!locationTheme) return;

    // Apply the selected theme's CSS variables onto :root
    if (locationTheme.themeData && typeof locationTheme.themeData === "object") {
        const root = document.documentElement;
        Object.keys(locationTheme.themeData).forEach(key => {
            if (key.startsWith("--") && typeof locationTheme.themeData[key] === "string") {
                try { root.style.setProperty(key, locationTheme.themeData[key]); } catch (e) { /* ignore */ }
            }
        });
    }

    // Apply the subaccount's custom logo URL
    if (locationTheme.logoUrl) {
        // 1. Update the sidebar .agency-logo image (with retry for late DOM)
        function tryApplyLogo(retries) {
            const logoImg = document.querySelector(".agency-logo");
            if (logoImg) {
                logoImg.src = locationTheme.logoUrl;
                logoImg.style.objectFit = "contain";
            } else if (retries > 0) {
                setTimeout(() => tryApplyLogo(retries - 1), 300);
            }
        }
        tryApplyLogo(15);

        // 2. Update the CSS variable so anything using --agency-logo-url also updates
        document.documentElement.style.setProperty("--agency-logo-url", locationTheme.logoUrl);

        // 3. Optionally update the favicon as well
        if (typeof changeFavicon === "function") {
            changeFavicon(locationTheme.logoUrl);
        }
    }
    console.log("Subaccount theme applied for location ID:", locationId);
}
function cleanupMenuStates() {
    document.querySelectorAll("a[id^='sb_'], .hl_nav-header a").forEach(menu => {
        // Remove lock icon
        const icon = menu.querySelector(".tb-lock-icon");
        if (icon) icon.remove();

        // Reset lock styles
        menu.style.removeProperty("opacity");
        menu.style.removeProperty("cursor");

        // Reset hidden styles
        menu.style.removeProperty("display");
    });
}
  function blockMenuClick(e, menuId) {
      // Guard: re-check current location before doing anything
      const savedRaw = localStorage.getItem("userTheme");
      const saved = JSON.parse(savedRaw) || {};
      const lockedMenus = saved.themeData?.["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
      const agencyData = saved.themeData?.["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
      const locationId = getCurrentLocationId();
      const lockData = locationId
          ? lockedMenus[locationId]?.[menuId]
          : agencyData.locked?.[menuId];
      // Stale listener from a previous location — do nothing
      if (!lockData) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
      const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
      const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
      const popupSubHeadline = (lockData && typeof lockData === "object" && lockData.popupSubHeadline) ? lockData.popupSubHeadline : "";
      const popupButtonText = (lockData && typeof lockData === "object" && lockData.popupButtonText) ? lockData.popupButtonText : "";
      showPreviewPopup(popupType, popupUrl, popupHeadline, popupSubHeadline, popupButtonText);
  }

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
  applyHiddenMenus();
  applyLockedMenus();
  applySubaccountTheme();
});

// Also call when localStorage changes (if settings are updated dynamically)
// Polling fallback for iframe updates (checks every 500ms)
setInterval(() => {
  const current = localStorage.getItem("userTheme"); // Changed from STORAGE.userTheme
  if (current !== window.lastUserTheme) {
    window.lastUserTheme = current;
    applyHiddenMenus();
    applyLockedMenus();
    applySubaccountTheme();
  }
}, 500);
  
  async function applyAgencyLogo(attempt = 1) {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const themeVars = saved.themeData || {};
    let logoUrl = themeVars["--login-company-logo"] || themeVars["--custom-logo-url"];
    if (logoUrl) {
      logoUrl = logoUrl.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    }
    const logoImg = document.querySelector(".agency-logo");
    if (logoImg && logoUrl) {
      logoImg.src = logoUrl;
      log("Applied agency logo");
      return;
    }
    if (attempt < 20) {
      await sleep(300);
      return applyAgencyLogo(attempt + 1);
    }
    log("Agency logo not found after retries");
  }
// ✅ ---- Sidebar Titles Restore ----
function applyStoredSidebarTitles() {
  try {
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData || !saved.themeData["--sidebarTitles"]) return;

    // Parse the stored sidebar title data
    const titles = JSON.parse(saved.themeData["--sidebarTitles"]);

    Object.entries(titles).forEach(([varName, newLabel]) => {
      // Extract metaKey from variable name, e.g. "--sites-new-name" → "sites"
      const metaKey = varName.replace(/^--| -new-name$/g, "").replace(/-new-name$/, "");
      const cleanMetaKey = metaKey.replace(/^--/, "").replace(/-new-name$/, "");

      // Inject style if missing
      if (!document.querySelector(`style[data-meta="${cleanMetaKey}"]`)) {
        const style = document.createElement("style");
        style.dataset.meta = cleanMetaKey;
        style.innerHTML = `
          a[meta="${cleanMetaKey}"] .nav-title,
          a#${cleanMetaKey} .nav-title {
            visibility: hidden !important;
            position: relative !important;
          }
          a[meta="${cleanMetaKey}"] .nav-title::after,
          a#${cleanMetaKey} .nav-title::after {
            content: var(${varName}, "${cleanMetaKey}");
            visibility: visible !important;
            position: absolute !important;
            left: 0;
          }
        `;
        document.head.appendChild(style);
      }

      // Apply live CSS variable
      document.documentElement.style.setProperty(varName, `"${newLabel}"`);
    });
  } catch (err) {
    console.error("❌ Failed to apply stored sidebar titles:", err);
  }
}

  // ---- Mutation observer (throttled) ----
  function observeSidebarMutations(sidebar) {
    if (!sidebar) return;
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ThemeBuilder._doReapplyTheme();
      }, 500);
    });
    observer.observe(sidebar, { childList: true, subtree: true });
    // store observer reference if you want to disconnect later
    return observer;
  }

  // ---- Wait for sidebar then re-apply ----
  async function waitForSidebarAndReapply(retries = 60) {
    for (let attempt = 0; attempt < retries; attempt++) {
      const sidebar = document.querySelector(".hl_nav-header nav");
      const menuItems = sidebar?.querySelectorAll("li, a, div[id^='sb_']") || [];
      if (sidebar && menuItems.length > 5) {
        ThemeBuilder._doReapplyTheme();
        observeSidebarMutations(sidebar);
        return true;
      }
      await sleep(300);
    }
    console.warn("[ThemeBuilder] Sidebar not found within retry window");
    return false;
  }
  function reorderMenu(order, containerSelector) {
      // Try the exact selector first (keeps agency behavior unchanged)
      let container = document.querySelector(containerSelector);
  
      // If selector not found, attempt to infer the container from the first existing menu item
      if (!container) {
          for (let i = 0; i < order.length; i++) {
              const id = order[i];
              const el = document.getElementById(id);
              if (el && el.parentElement) {
                  container = el.parentElement;
                  break;
              }
          }
      }
  
      // If still not found, try a common sub-account selector (safe fallback)
      if (!container) {
          container = document.querySelector(".hl_nav-header nav") || document.querySelector(".hl_nav-header");
      }
  
      if (!container) return;
  
      order.forEach(id => {
          const el = document.getElementById(id);
          if (el) container.appendChild(el);
      });
  }
  // ---- Core reapply logic ----
  function _doReapplyTheme() {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    if (!saved.themeData) {
      log("No theme data found");
      return;
    }
    injectThemeData(saved.themeData);
    applySidebarLogoFromTheme();
    restoreHiddenMenus();
    applyHiddenMenus();
    applyLockedMenus();

    // try {
    //   if (saved.themeData["--subMenuOrder"]) {
    //      const order = JSON.parse(saved.themeData["--subMenuOrder"]);
    //     reorderMenu(order, "#subAccountSidebar");
    //     // const order = safeJsonParse(saved.themeData["--subMenuOrder"]) || [];
    //     // reorderSidebarFromOrder(order.filter(m => m && m.trim() !== "sb_agency-accounts"));
    //     // applySubMenuOrder(order);
    //   }
    // } catch (e) { console.error("[ThemeBuilder] reorder submenu failed", e); }

    try {
      if (saved.themeData["--agencyMenuOrder"]) {
        const order = JSON.parse(saved.themeData["--agencyMenuOrder"]);
        reorderMenu(order, "#agencySidebar");
        // const agencyOrder = safeJsonParse(saved.themeData["--agencyMenuOrder"]) || [];
        // reorderAgencyFromOrder(agencyOrder.filter(m => m && m.trim() !== "sb_agency-accounts"));
      }
    } catch (e) { console.error("[ThemeBuilder] reorder agency menus failed", e); }
  }
async function waitForStableSidebar(selector = '#sidebar-v2 nav.flex-1.w-full', timeout = 5000) {
  const start = Date.now();
  let lastHTML = '';
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (!el) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const currentHTML = el.innerHTML;
    if (currentHTML === lastHTML && currentHTML.length > 0) {
      // Sidebar content hasn't changed between two checks → stable
      return true;
    }
    lastHTML = currentHTML;
    await new Promise(r => setTimeout(r, 300));
  }
  // console.warn('[ThemeBuilder] Sidebar did not stabilize within timeout.');
  return false;
}

  // ---- SPA detection (history) ----
  (function () {
    const _push = history.pushState;
    history.pushState = function () { const res = _push.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    const _replace = history.replaceState;
    history.replaceState = function () { const res = _replace.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
  })();

  // ---- exposed API and internal flags ----
  const ThemeBuilder = {
    _doReapplyTheme,
    applyCSSFile,
    applyAgencyLogo,
    applySidebarLogoFromTheme,
    reapply: () => {
      if (ThemeBuilder._reapplyLock) return;
      ThemeBuilder._reapplyLock = true;
        (async () => {
        await waitForStableSidebar();
        await waitForSidebarAndReapply();
        setTimeout(() => { ThemeBuilder._reapplyLock = false; }, 800);
      })();
    },
    _reapplyLock: false
  };

  // ---- Listen to SPA location changes ----
window.addEventListener("locationchange", () => {
    // Clean up previous location's lock/hide visual states first
    cleanupMenuStates();
    ThemeBuilder.reapply();
    ThemeBuilder.applyAgencyLogo();
    // Watch for .agency-logo to appear in DOM after navigation, then apply logo
    const observer = new MutationObserver(() => {
        const img = document.querySelector(".agency-logo");
        if (img) {
            observer.disconnect();
            ThemeBuilder.applySidebarLogoFromTheme();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
    setTimeout(() => {
        applyStoredSidebarTitles();
        applyLockedMenus();
        applyHiddenMenus();
    }, 1200);
});

  // ---- Initial bootstrap ----
  // Run applyCSSFile (fetch + inject)
  try { ThemeBuilder.applyCSSFile(); } catch (e) { console.error("[ThemeBuilder] initial apply failed", e); }
  // Apply locked menus a bit later (gives DOM a chance)
  setTimeout(() => { try { applyLockedMenus(); } catch (e) {} }, 3000);
  setTimeout(() => { ThemeBuilder.reapply(); }, 400);
  ThemeBuilder.applyAgencyLogo();

    // ✅ Run once on initial load
  setTimeout(() => {
    applyStoredSidebarTitles();
  }, 1500);
  // Expose to global for manual debugging
  window.ThemeBuilder = ThemeBuilder;
  log("ThemeBuilder initialized");
})();

window.addEventListener("load", () => {
  console.log('Loader related It is working');
  document.body.classList.add("loaded");
  document.querySelectorAll("#app + .app-loader, #app > .hl-loader-container")
    .forEach(l => l.remove());
});



