// // Simple approach - remove all loaders and show ours
// === LOADER: Intercept GHL loader immediately ===
(function () {
  // Step 1: Inject a style tag immediately to hide the html/body BEFORE body exists
  // This runs synchronously as soon as the <script> tag is parsed
  var styleEl = document.createElement('style');
  styleEl.id = 'custom-loader-hide-style';
  styleEl.innerHTML = [
    'html, body { opacity: 0 !important; visibility: hidden !important; }',
    '.hl-loader-container, .lds-ring, .app-loader,',
    '#app + .app-loader, #app.loading + .app-loader { display: none !important; }'
  ].join('\n');
  (document.head || document.documentElement).appendChild(styleEl);

  // Step 2: Track two gates — page load + theme fetch
  var pageLoaded = false;
  var themeApplied = false;
  var loaderInjected = false;

  // Expose a global signal for your applyCSSFile() to call when done
  window.__themeReady = function () {
    themeApplied = true;
    tryRemoveLoader();
  };

  function tryRemoveLoader() {
    if (!pageLoaded || !themeApplied) return;
    var el = document.getElementById('custom-global-loader');
    if (el) {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 550);
    }
    // Also remove the hide-style so body is visible
    var hide = document.getElementById('custom-loader-hide-style');
    if (hide && hide.parentNode) hide.parentNode.removeChild(hide);
  }

  // Safety fallback — never leave the loader up forever
  var maxWait = setTimeout(function () {
    themeApplied = true;
    pageLoaded = true;
    tryRemoveLoader();
  }, 8000);

  // Step 3: Inject the visible loader div as soon as body is available
  function injectLoader() {
    if (document.body && !loaderInjected) {
      loaderInjected = true;

      // Remove the opacity-0 style now that our loader will cover everything
      var hide = document.getElementById('custom-loader-hide-style');
      if (hide) hide.innerHTML = [
        '.hl-loader-container, .lds-ring, .app-loader,',
        '#app + .app-loader, #app.loading + .app-loader { display: none !important; }'
      ].join('\n');

      var loader = document.createElement('div');
      loader.id = 'custom-global-loader';
      document.body.insertBefore(loader, document.body.firstChild);

      // Show body/html now (loader covers it)
      document.documentElement.style.opacity = '';
      document.documentElement.style.visibility = '';
      document.body.style.opacity = '';
      document.body.style.visibility = '';
    } else if (!document.body) {
      setTimeout(injectLoader, 5);
    }
  }
  injectLoader();

  // Step 4: Mark page as loaded (images, iframes, etc.)
  if (document.readyState === 'complete') {
    pageLoaded = true;
  } else {
    window.addEventListener('load', function () {
      pageLoaded = true;
      tryRemoveLoader();
    });
  }
})();
// === END LOADER ===
// === LOADER: Hide page instantly ===
// (function () {
//   // Hide immediately — before GHL's own loader ends
//   document.documentElement.style.setProperty('opacity', '0', 'important');
//   document.documentElement.style.setProperty('visibility', 'hidden', 'important');

//   var loader = document.createElement('div');
//   loader.id = 'custom-global-loader';

//   function injectLoader() {
//     if (document.body) {
//       document.body.insertBefore(loader, document.body.firstChild);
//       // Restore — our loader now covers everything
//       document.documentElement.style.opacity = '';
//       document.documentElement.style.visibility = '';
//       document.body.style.setProperty('opacity', '1', 'important');
//       document.body.style.setProperty('visibility', 'visible', 'important');
//     } else {
//       setTimeout(injectLoader, 1);
//     }
//   }
//   injectLoader();

//   function removeLoader() {
//     var el = document.getElementById('custom-global-loader');
//     if (el) {
//       el.style.opacity = '0';
//       setTimeout(function () {
//         if (el.parentNode) el.parentNode.removeChild(el);
//       }, 600);
//     }
//   }

//   if (document.readyState === 'complete') {
//     setTimeout(removeLoader, 1000);
//   } else {
//     window.addEventListener('load', function () {
//       setTimeout(removeLoader, 1000);
//     });
//   }
// })();
// === END LOADER ===

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
