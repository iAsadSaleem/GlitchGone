(function () {
    // --- Function: Create the App Container with Tabs ---
    // --- Function: Create the App Container with Home + Feature Sections ---
    function createCustomAppContainer() {
        if (document.getElementById("customAppContainer")) return;

        // --- Overlay ---
        const appContainer = document.createElement("div");
        appContainer.id = "customAppContainer";

        // --- App Window ---
        const appWindow = document.createElement("div");
        appWindow.className = "custom-app-window";

        // --- Header ---
        const header = document.createElement("div");
        header.className = "custom-app-header";

        const tabs = [
            { id: "lockhide", icon: "fa-solid fa-gauge", label: "Lock & Hide" },
            { id: "settings", icon: "fa-solid fa-gear", label: "Settings" },
            { id: "analytics", icon: "fa-solid fa-chart-line", label: "Analytics" },
            { id: "support", icon: "fa-solid fa-headset", label: "Support" },
        ];

        const tabContainer = document.createElement("div");
        tabContainer.className = "custom-tab-container";

        tabs.forEach((tab) => {
            const btn = document.createElement("button");
            btn.className = "custom-tab-btn";
            btn.dataset.tab = tab.id;
            btn.innerHTML = `<i class="${tab.icon}"></i>`;
            tabContainer.appendChild(btn);
        });

        header.appendChild(tabContainer);

        // Close Button
        const closeBtn = document.createElement("button");
        closeBtn.className = "custom-app-close-btn";
        closeBtn.textContent = "✕";
        header.appendChild(closeBtn);

        // --- Content Area ---
        const content = document.createElement("div");
        content.className = "custom-app-content";

        // --- Home Screen ---
        const homeScreen = document.createElement("div");
        homeScreen.className = "custom-home-screen";

        tabs.forEach((tab) => {
            const card = document.createElement("div");
            card.className = "custom-feature-card";
            card.innerHTML = `
            <i class="${tab.icon}"></i>
            <h3>${tab.label}</h3>
            <button data-open-tab="${tab.id}">Open</button>
        `;
            homeScreen.appendChild(card);
        });

        content.appendChild(homeScreen);

        // --- Tab Content Sections ---
        tabs.forEach((tab) => {
            const section = document.createElement("div");
            section.className = "custom-tab-content";
            section.dataset.tab = tab.id;
            section.style.display = "none";

            // Back Button
            const backButton = document.createElement("button");
            backButton.className = "custom-back-btn";
            backButton.innerHTML = "← Back to Main Menu";

            section.innerHTML = `
            <h2>${tab.label}</h2>
            <p>This is the ${tab.label} section. You can add your custom settings or data here.</p>
        `;
            section.prepend(backButton);

            content.appendChild(section);
        });

        // --- Append all ---
        appWindow.append(header, content);
        appContainer.appendChild(appWindow);
        document.body.appendChild(appContainer);

        // --- Functions ---
        function showTab(tabId) {
            homeScreen.style.display = "none";
            document.querySelectorAll(".custom-tab-content").forEach((sec) => {
                sec.style.display = sec.dataset.tab === tabId ? "block" : "none";
            });

            document.querySelectorAll(".custom-tab-btn").forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.tab === tabId);
            });
        }

        function showHome() {
            homeScreen.style.display = "grid";
            document.querySelectorAll(".custom-tab-content").forEach((sec) => (sec.style.display = "none"));
            document.querySelectorAll(".custom-tab-btn").forEach((btn) => btn.classList.remove("active"));
        }

        // --- Header Icon Clicks ---
        tabContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".custom-tab-btn");
            if (!btn) return;
            showTab(btn.dataset.tab);
        });

        // --- Home Card Buttons ---
        homeScreen.addEventListener("click", (e) => {
            const openBtn = e.target.closest("button[data-open-tab]");
            if (!openBtn) return;
            showTab(openBtn.dataset.openTab);
        });

        // --- Back Button ---
        content.addEventListener("click", (e) => {
            if (e.target.classList.contains("custom-back-btn")) {
                showHome();
            }
        });

        // --- Show/Hide App ---
        function showApp() {
            appContainer.style.display = "flex";
            requestAnimationFrame(() => (appContainer.style.opacity = "1"));
            showHome(); // Always reset to home when opened
        }

        function hideApp() {
            appContainer.style.opacity = "0";
            setTimeout(() => (appContainer.style.display = "none"), 300);
        }

        closeBtn.addEventListener("click", hideApp);

        return { showApp, hideApp };
    }

    // --- Function: Add Sidebar Button ---
    function addCustomSidebarLink() {
        const sidebar = document.querySelector('nav[aria-label="header"]');
        if (!sidebar) return false;

        if (document.getElementById("sb_custom-app")) return true;

        // Sidebar Button
        const newItem = document.createElement("button");
        newItem.id = "sb_custom-app";
        newItem.type = "button";
        Object.assign(newItem.style, {
            all: "unset",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "6px",
            color: "#fff",
        });

        const wrapper = document.createElement("span");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";

        const star = document.createElement("span");
        star.className = "custom-star-icon";
        star.textContent = "⭐";
        star.style.animation = "blinkStar 1s infinite alternate";

        const label = document.createElement("span");
        label.textContent = "My Custom App";
        label.style.fontWeight = "500";

        const newTag = document.createElement("span");
        Object.assign(newTag.style, {
            background: "#ffcc00",
            color: "#000",
            fontSize: "10px",
            fontWeight: "600",
            padding: "1px 4px",
            borderRadius: "4px",
        });
        newTag.textContent = "NEW";

        wrapper.append(star, label, newTag);
        newItem.appendChild(wrapper);
        sidebar.appendChild(newItem);

        // Create App UI
        const { showApp } = createCustomAppContainer();

        // Open App
        newItem.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            showApp();
        });

        console.log("✅ Custom sidebar menu added successfully!");
        return true;
    }

    // Run every second until sidebar ready
    const interval = setInterval(() => {
        if (addCustomSidebarLink()) clearInterval(interval);
    }, 1000);

    // Detect sidebar re-render
    const observer = new MutationObserver((mutations) => {
        const sidebarChanged = mutations.some((m) =>
            [...m.addedNodes].some(
                (n) =>
                    n.nodeType === 1 &&
                    (n.matches?.("nav[aria-label='header']") ||
                        n.querySelector?.("nav[aria-label='header']"))
            )
        );
        if (sidebarChanged) addCustomSidebarLink();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // --- Add Blink Animation ---
    const style = document.createElement("style");
    style.textContent = `
        @keyframes blinkStar {
            from { opacity: 0.3; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
})();
