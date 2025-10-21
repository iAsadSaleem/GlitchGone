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
//(function () {
//    // Create and show our custom loader immediately
//    const loader = document.createElement('div');
//    loader.id = 'custom-global-loader';
//    document.body.prepend(loader);

//    // Remove our custom loader when page is fully loaded
//    function removeCustomLoader() {
//        const customLoader = document.getElementById('custom-global-loader');
//        if (customLoader) {
//            customLoader.remove();
//        }
//    }

//    // Method 1: Remove when window fully loads
//    window.addEventListener('load', function () {
//        setTimeout(removeCustomLoader, 500); // Small delay after load
//    });

//    // Method 2: Remove when DOM is ready (fallback)
//    if (document.readyState === 'complete') {
//        setTimeout(removeCustomLoader, 1000);
//    }

//    // Method 3: Fallback - remove after max 5 seconds
//    setTimeout(removeCustomLoader, 5000);

//})();
 //Create and show our custom loader immediately
//const loader = document.createElement('div');
//loader.id = 'custom-global-loader';
//document.body.prepend(loader);
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
