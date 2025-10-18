(function () {
    // Safely scope your code
    function findAndStore() {
        // Only manage your own localStorage keys
        console.log('File is running');
        const KEY = "g-em";

        function tryStore() {
            const existing = localStorage.getItem(KEY);
            if (existing) return; // Already stored, stop retrying

            const emailDiv = document.querySelector("div.text-xs.text-gray-900.truncate");
            if (emailDiv) {
                const email = emailDiv.textContent.trim();
                if (email) {
                    localStorage.setItem(KEY, btoa(email)); // store base64 email
                    console.log("ThemeBuilder stored email:", email);
                }
            } else {
                // Retry until element is found
                setTimeout(tryStore, 500);
            }
        }

        tryStore();
    }

    // Run once after DOM is ready
    window.addEventListener("DOMContentLoaded", findAndStore);
})();
