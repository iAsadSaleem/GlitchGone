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
    // Function to hide the custom loader when page is loaded
    function hideLoader() {
        const customLoaders = document.querySelectorAll('#app + .app-loader, #app > .hl-loader-container');
        customLoaders.forEach(loader => {
            loader.style.display = 'none !important';
            loader.style.opacity = '0 !important';
            loader.style.visibility = 'hidden !important';
        });
    }

    // Method 1: Hide when window loads completely
    window.addEventListener('load', function () {
        setTimeout(hideLoader, 500); // Small delay to ensure everything is loaded
    });

    // Method 2: Hide when DOM is ready and no network requests are pending
    document.addEventListener('DOMContentLoaded', function () {
        // Check if resources are still loading
        if (document.readyState === 'complete') {
            setTimeout(hideLoader, 300);
        }
    });

    // Method 3: Fallback - hide after maximum time (8 seconds)
    setTimeout(hideLoader, 8000);

    // Method 4: Listen for GHL specific events
    document.addEventListener('appLoaded', hideLoader);
    document.addEventListener('pageRendered', hideLoader);

    // Additional safety: periodically check if we should hide the loader
    let checkCount = 0;
    const maxChecks = 20; // Check for up to 10 seconds (20 * 500ms)

    const interval = setInterval(function () {
        checkCount++;

        // If page is completely loaded and stable
        if (document.readyState === 'complete' &&
            document.querySelector('body') &&
            !document.querySelector('.hl-loader-container:not([style*="display: none"])')) {

            hideLoader();
            clearInterval(interval);
        }

        // Stop checking after max attempts
        if (checkCount >= maxChecks) {
            hideLoader();
            clearInterval(interval);
        }
    }, 500);

})();

// Add the spin animation to the document
const style = document.createElement('style');
style.textContent = `
    @keyframes spinLoader {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
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
