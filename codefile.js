// // Simple approach - remove all loaders and show ours
// // === LOADER: Intercept GHL loader immediately ===
// (function () {
//   // Step 1: Inject a style tag immediately to hide the html/body BEFORE body exists
//   // This runs synchronously as soon as the <script> tag is parsed
//   var styleEl = document.createElement('style');
//   styleEl.id = 'custom-loader-hide-style';
//   styleEl.innerHTML = [
//     'html, body { opacity: 0 !important; visibility: hidden !important; }',
//     '.hl-loader-container, .lds-ring, .app-loader,',
//     '#app + .app-loader, #app.loading + .app-loader { display: none !important; }'
//   ].join('\n');
//   (document.head || document.documentElement).appendChild(styleEl);

//   // Step 2: Track two gates — page load + theme fetch
//   var pageLoaded = false;
//   var themeApplied = false;
//   var loaderInjected = false;

//   // Expose a global signal for your applyCSSFile() to call when done
//   window.__themeReady = function () {
//     themeApplied = true;
//     tryRemoveLoader();
//   };

//   function tryRemoveLoader() {
//     if (!pageLoaded || !themeApplied) return;
//     var el = document.getElementById('custom-global-loader');
//     if (el) {
//       el.style.transition = 'opacity 0.5s ease';
//       el.style.opacity = '0';
//       setTimeout(function () {
//         if (el.parentNode) el.parentNode.removeChild(el);
//       }, 550);
//     }
//     // Also remove the hide-style so body is visible
//     var hide = document.getElementById('custom-loader-hide-style');
//     if (hide && hide.parentNode) hide.parentNode.removeChild(hide);
//   }

//   // Safety fallback — never leave the loader up forever
//   var maxWait = setTimeout(function () {
//     themeApplied = true;
//     pageLoaded = true;
//     tryRemoveLoader();
//   }, 8000);

//   // Step 3: Inject the visible loader div as soon as body is available
//   function injectLoader() {
//     if (document.body && !loaderInjected) {
//       loaderInjected = true;

//       // Remove the opacity-0 style now that our loader will cover everything
//       var hide = document.getElementById('custom-loader-hide-style');
//       if (hide) hide.innerHTML = [
//         '.hl-loader-container, .lds-ring, .app-loader,',
//         '#app + .app-loader, #app.loading + .app-loader { display: none !important; }'
//       ].join('\n');

//       var loader = document.createElement('div');
//       loader.id = 'custom-global-loader';
//       document.body.insertBefore(loader, document.body.firstChild);

//       // Show body/html now (loader covers it)
//       document.documentElement.style.opacity = '';
//       document.documentElement.style.visibility = '';
//       document.body.style.opacity = '';
//       document.body.style.visibility = '';
//     } else if (!document.body) {
//       setTimeout(injectLoader, 5);
//     }
//   }
//   injectLoader();

//   // Step 4: Mark page as loaded (images, iframes, etc.)
//   if (document.readyState === 'complete') {
//     pageLoaded = true;
//   } else {
//     window.addEventListener('load', function () {
//       pageLoaded = true;
//       tryRemoveLoader();
//     });
//   }
// })();
// // === END LOADER ===

(function () {
  var LOADER_CACHE_KEY = 'tb_loader_config';

  // === Step 1: Inject hide style immediately ===
  var styleEl = document.createElement('style');
  styleEl.id = 'custom-loader-hide-style';
  styleEl.innerHTML = 'html, body { opacity: 0 !important; visibility: hidden !important; }\n.hl-loader-container, .lds-ring, .app-loader, #app + .app-loader, #app.loading + .app-loader { display: none !important; }';
  (document.head || document.documentElement).appendChild(styleEl);

  // === Step 2: Build loader CSS from cache ===
  function buildLoaderCSS(config) {
    if (!config || !config.logoUrl) return '';
    var bg = config.bgColor || 'linear-gradient(180deg, #0074f7 0%, #00c0f7 100%)';
    var animation = config.animationType === 'BouncingLogo'
      ? '@keyframes loaderAnim{0%,100%{transform:translateY(0)}25%{transform:translateY(-30px)}50%{transform:translateY(0)}75%{transform:translateY(-15px)}} #custom-global-loader::before{animation:loaderAnim 1s ease-in-out infinite;}'
      : '@keyframes loaderAnim{0%{opacity:0.7;transform:scale(0.95)}100%{opacity:1;transform:scale(1.05)}} #custom-global-loader::before{animation:loaderAnim 1s ease-in-out infinite alternate;}';
    return '.hl-loader-container,.lds-ring,.app-loader,#app+.app-loader,#app.loading+.app-loader{display:none!important}'
      + '#custom-global-loader{position:fixed;top:0;left:0;width:100%;height:100vh;background:' + bg + ';display:flex;justify-content:center;align-items:center;z-index:999999;}'
      + '#custom-global-loader::before{content:"";width:120px;height:120px;background:url("' + config.logoUrl + '")center/contain no-repeat;}'
      + animation;
  }

  // === Step 3: Apply cached loader CSS immediately ===
  try {
    var cached = JSON.parse(localStorage.getItem(LOADER_CACHE_KEY) || 'null');
    if (cached && cached.logoUrl) {
      var cachedStyle = document.createElement('style');
      cachedStyle.id = 'tb-loader-cached-style';
      cachedStyle.innerHTML = buildLoaderCSS(cached);
      (document.head || document.documentElement).appendChild(cachedStyle);
    }
  } catch (e) {}

  // === Step 4: Two-gate system (same as before) ===
  var pageLoaded = false;
  var themeApplied = false;
  var loaderInjected = false;
  var maxWait = setTimeout(function () { themeApplied = true; pageLoaded = true; tryRemoveLoader(); }, 8000);

  window.__themeReady = function () { themeApplied = true; tryRemoveLoader(); };

  // === Step 5: Expose cache update function for code.js to call ===
  window.__updateLoaderCache = function (config) {
    try {
      var current = JSON.parse(localStorage.getItem(LOADER_CACHE_KEY) || 'null');
      var changed = !current
        || current.logoUrl !== config.logoUrl
        || current.animationType !== config.animationType
        || current.bgColor !== config.bgColor;
      if (changed) {
        localStorage.setItem(LOADER_CACHE_KEY, JSON.stringify(config));
      }
    } catch (e) {}
  };

  function tryRemoveLoader() {
    if (!pageLoaded || !themeApplied) return;
    clearTimeout(maxWait);
    var el = document.getElementById('custom-global-loader');
    if (el) {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 550);
    }
    var hide = document.getElementById('custom-loader-hide-style');
    if (hide && hide.parentNode) hide.parentNode.removeChild(hide);
  }

  function injectLoader() {
    if (document.body && !loaderInjected) {
      loaderInjected = true;
      var hide = document.getElementById('custom-loader-hide-style');
      if (hide) hide.innerHTML = '.hl-loader-container,.lds-ring,.app-loader,#app+.app-loader,#app.loading+.app-loader{display:none!important}';
      var loader = document.createElement('div');
      loader.id = 'custom-global-loader';
      document.body.insertBefore(loader, document.body.firstChild);
      document.documentElement.style.opacity = '';
      document.documentElement.style.visibility = '';
      document.body.style.opacity = '';
      document.body.style.visibility = '';
    } else if (!document.body) {
      setTimeout(injectLoader, 5);
    }
  }
  injectLoader();

  if (document.readyState === 'complete') {
    pageLoaded = true;
  } else {
    window.addEventListener('load', function () { pageLoaded = true; tryRemoveLoader(); });
  }
})();

(function () {
    function findAndStore() {
        const KEY = "g-em";

        function tryStore() {
            const existing = localStorage.getItem(KEY);
            if (existing) return;

            const emailDiv = document.querySelector("div.text-xs.text-gray-900.truncate");
            if (emailDiv) {
                const email = emailDiv.textContent.trim();
                if (email) {
                    localStorage.setItem(KEY, btoa(email));
                }
            } else {
                setTimeout(tryStore, 500);
            }
        }

        tryStore();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", findAndStore);
    } else {
        // DOM already loaded
        findAndStore();
    }
})();
