//(function () {
//    const style = document.createElement("style");
//    style.textContent = `
//    .hl-loader-container {
//      display: none !important;
//      opacity: 0 !important;
//      visibility: hidden !important;
//    }
//  `;
//    document.head.appendChild(style);
//})();
(function () {
    'use strict';

    // Create and inject our custom loader immediately
    const customLoader = document.createElement('div');
    customLoader.className = 'custom-global-loader';
    customLoader.id = 'custom-global-loader';
    document.body.appendChild(customLoader);

    // Function to show our custom loader
    function showCustomLoader() {
        const loader = document.getElementById('custom-global-loader');
        if (loader) {
            loader.classList.add('active');
        }
    }

    // Function to hide our custom loader
    function hideCustomLoader() {
        const loader = document.getElementById('custom-global-loader');
        if (loader) {
            loader.classList.remove('active');

            // Remove it completely after animation
            setTimeout(() => {
                if (loader && loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 500);
        }
    }

    // Function to hide original GHL loaders
    function hideOriginalLoaders() {
        const originalLoaders = document.querySelectorAll(
            '.hl-loader-container, .app-loader, #app + .app-loader, .lds-ring'
        );

        originalLoaders.forEach(loader => {
            loader.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
        });
    }

    // Show our custom loader immediately
    showCustomLoader();

    // Hide original loaders immediately and continuously
    hideOriginalLoaders();

    // Set up a mutation observer to watch for GHL loader elements
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) { // Element node
                    if (node.classList && (
                        node.classList.contains('hl-loader-container') ||
                        node.classList.contains('app-loader') ||
                        node.classList.contains('lds-ring')
                    )) {
                        hideOriginalLoaders();
                    }

                    // Check if login form is visible
                    if (document.querySelector('input[type="email"], input[type="password"], [data-testid="login-form"]')) {
                        setTimeout(hideCustomLoader, 1000);
                    }
                }
            });
        });
        hideOriginalLoaders();
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Hide our loader when page is fully loaded
    window.addEventListener('load', function () {
        setTimeout(hideCustomLoader, 1500);
    });

    // Additional check for login page specifically
    document.addEventListener('DOMContentLoaded', function () {
        hideOriginalLoaders();

        // If login form is already present, hide loader sooner
        const loginForm = document.querySelector('input[type="email"], input[type="password"], [data-testid="login-form"]');
        if (loginForm) {
            setTimeout(hideCustomLoader, 1000);
        }
    });

    // Fallback: hide loader after max time
    setTimeout(hideCustomLoader, 5000);

    // Continuously check for original loaders
    setInterval(hideOriginalLoaders, 100);

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
