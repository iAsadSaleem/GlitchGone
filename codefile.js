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

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    // Function to override loader styles
    function overrideLoader() {
        // Find loader elements
        const loaderContainers = document.querySelectorAll('.hl-loader-container, .app-loader');

        loaderContainers.forEach(container => {
            // Apply styles directly to elements
            container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100vh !important;
                background: linear-gradient(180deg, #0074f7 0%, #00c0f7 100%) !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 999999 !important;
                margin: 0 !important;
                padding: 0 !important;
            `;

            // Hide any existing ring loaders
            const ringLoaders = container.querySelectorAll('.lds-ring');
            ringLoaders.forEach(ring => {
                ring.style.display = 'none !important';
            });

            // Hide loader info text
            const loaderInfo = container.querySelector('.hl-loader-info');
            if (loaderInfo) {
                loaderInfo.style.display = 'none !important';
            }

            // Create and append new loader if not exists
            if (!container.querySelector('.custom-loader')) {
                const newLoader = document.createElement('div');
                newLoader.className = 'custom-loader';
                newLoader.style.cssText = `
                    width: 80px !important;
                    height: 80px !important;
                    border-radius: 50% !important;
                    border: 6px solid #fff !important;
                    border-top-color: transparent !important;
                    animation: spinLoader 1s linear infinite !important;
                `;
                container.appendChild(newLoader);
            }
        });
    }

    // Run immediately
    overrideLoader();

    // Also run after a short delay to catch dynamically added loaders
    setTimeout(overrideLoader, 100);
});

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
