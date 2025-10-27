(function () {
    // --- Function: Create the App Container with Tabs ---
    function createCustomAppContainer() {
        if (document.getElementById("customAppContainer")) return;

        // Overlay
        const appContainer = document.createElement("div");
        appContainer.id = "customAppContainer";
        Object.assign(appContainer.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.65)",
            display: "none",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
            opacity: "0",
            transition: "opacity 0.3s ease",
        });

        // --- App Window ---
        const appWindow = document.createElement("div");
        appWindow.className = "custom-app-window";

        // --- Header ---
        const header = document.createElement("div");
        header.className = "custom-app-header";

        // Tabs List
        const tabs = [
            { id: "dashboard", icon: "fa-solid fa-gauge", label: "Dashboard" },
            { id: "settings", icon: "fa-solid fa-gear", label: "Settings" },
            { id: "analytics", icon: "fa-solid fa-chart-line", label: "Analytics" },
            { id: "support", icon: "fa-solid fa-headset", label: "Support" },
        ];

        const tabContainer = document.createElement("div");
        tabContainer.className = "custom-tab-container";

        tabs.forEach((tab, index) => {
            const btn = document.createElement("button");
            btn.className = "custom-tab-btn";
            btn.dataset.tab = tab.id;
            btn.innerHTML = `<i class="${tab.icon}"></i>`;
            if (index === 0) btn.classList.add("active");
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

        tabs.forEach((tab, index) => {
            const section = document.createElement("div");
            section.className = "custom-tab-content";
            section.dataset.tab = tab.id;
            if (index !== 0) section.style.display = "none";
            section.innerHTML = `
                <h2>${tab.label}</h2>
                <p>This is the ${tab.label} section. You can add any feature or settings here.</p>
            `;
            content.appendChild(section);
        });

        // Append All
        appWindow.append(header, content);
        appContainer.appendChild(appWindow);
        document.body.appendChild(appContainer);

        // Tab Switching Logic
        tabContainer.addEventListener("click", (e) => {
            const clicked = e.target.closest(".custom-tab-btn");
            if (!clicked) return;
            const tabId = clicked.dataset.tab;

            document.querySelectorAll(".custom-tab-btn").forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.tab === tabId);
            });
            document.querySelectorAll(".custom-tab-content").forEach((sec) => {
                sec.style.display = sec.dataset.tab === tabId ? "block" : "none";
            });
        });

        // Show/Hide Logic
        function showApp() {
            appContainer.style.display = "flex";
            requestAnimationFrame(() => (appContainer.style.opacity = "1"));
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
