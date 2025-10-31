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
// Simple approach - remove all loaders and show ours

(function loadSortable() {
    if (!window.Sortable) { // Only load if not already loaded
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
        script.onload = () => {
            //log("Sortable.js loaded successfully!");
            // ✅ You can now initialize Sortable here or later in your code
        };
        document.head.appendChild(script);
    }
})();
(function () {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
        link.crossOrigin = "anonymous";
        link.referrerPolicy = "no-referrer";
        document.head.appendChild(link);
    }
})();
(function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
        link.crossOrigin = "anonymous";
        link.referrerPolicy = "no-referrer";
        document.head.appendChild(link);
    }
})();
(function () {
    // Create and show our custom loader immediately
    const loader = document.createElement('div');
    loader.id = 'custom-global-loader';
    document.body.prepend(loader);

    // Remove our custom loader when page is fully loaded
    function removeCustomLoader() {
        const customLoader = document.getElementById('custom-global-loader');
        if (customLoader) {
            customLoader.remove();
        }
    }

    // Method 1: Remove when window fully loads
    window.addEventListener('load', function () {
        setTimeout(removeCustomLoader, 3000); // Small delay after load
    });

    // Method 2: Remove when DOM is ready (fallback)
    if (document.readyState === 'complete') {
        setTimeout(removeCustomLoader, 3000);
    }

    // Method 3: Fallback - remove after max 5 seconds
    setTimeout(removeCustomLoader, 5000);

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
