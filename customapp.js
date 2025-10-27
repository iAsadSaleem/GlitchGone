(function () {
    // --- Function: Create the App Container with Tabs ---
    // --- Function: Create the App Container with Home + Feature Sections ---
    function createCustomAppContainer() {
        if (document.getElementById("customAppContainer")) return;

        // Overlay
        const appContainer = document.createElement("div");
        appContainer.id = "customAppContainer";
        appContainer.className = "custom-app-container";


        // --- App Window ---
        const appWindow = document.createElement("div");
        appWindow.className = "custom-app-window";
        

        // --- Header ---
        const header = document.createElement("div");
        header.className = "custom-app-header";
       

        const tabs = [
            { id: "dashboard", icon: "fa-solid fa-gauge", label: "Dashboard" },
            { id: "settings", icon: "fa-solid fa-gear", label: "Settings" },
            { id: "analytics", icon: "fa-solid fa-chart-line", label: "Analytics" },
            { id: "support", icon: "fa-solid fa-headset", label: "Support" },
        ];

        const tabContainer = document.createElement("div");
        Object.assign(tabContainer.style, {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "30px",
        });

        tabs.forEach((tab) => {
            const btn = document.createElement("button");
            btn.className = "custom-tab-btn";
            btn.dataset.tab = tab.id;
            btn.innerHTML = `<i class="${tab.icon}" style="font-size: 22px;"></i>`;
            Object.assign(btn.style, {
                background: "transparent",
                border: "none",
                color: "#ccc",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "10px",
                transition: "all 0.3s ease",
            });
            btn.addEventListener("mouseenter", () => (btn.style.color = "#fff"));
            btn.addEventListener("mouseleave", () => {
                if (!btn.classList.contains("active")) btn.style.color = "#ccc";
            });
            tabContainer.appendChild(btn);
        });

        header.appendChild(tabContainer);

        // Close Button
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.className = "custom-app-close-btn";
        header.appendChild(closeBtn);

        // --- Content Area ---
        const content = document.createElement("div");
        content.className = "custom-app-content";

        // --- Home Screen ---
        const homeScreen = document.createElement("div");
        homeScreen.className = "custom-home-screen";
        Object.assign(homeScreen.style, {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "40px",
            textAlign: "center",
        });

        tabs.forEach((tab) => {
            const card = document.createElement("div");
            card.className = "custom-feature-card";
            card.dataset.tab = tab.id;
            card.innerHTML = `
            <div style="font-size:36px;margin-bottom:12px;color:#1f2937;">
                <i class="${tab.icon}"></i>
            </div>
            <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;">${tab.label}</h3>
            <button style="
                background:#2563eb;
                color:#fff;
                border:none;
                padding:6px 14px;
                border-radius:6px;
                cursor:pointer;
                font-size:14px;
                transition:background 0.3s ease;">Open</button>
        `;
            Object.assign(card.style, {
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
            });
            card.addEventListener("mouseenter", () => {
                card.style.transform = "translateY(-3px)";
                card.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
            });
            card.addEventListener("mouseleave", () => {
                card.style.transform = "translateY(0)";
                card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            });
            homeScreen.appendChild(card);
        });

        content.appendChild(homeScreen);

        // --- Section Containers (Hidden) ---
        tabs.forEach((tab) => {
            const section = document.createElement("div");
            section.className = "custom-tab-content";
            section.dataset.tab = tab.id;
            section.style.display = "none";
            section.innerHTML = `
            <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <h2 style="margin-bottom:12px;font-size:20px;font-weight:700;">${tab.label}</h2>
                <p style="color:#4b5563;">This is your ${tab.label} settings area. Add feature controls and UI here.</p>
                <button style="margin-top:16px;background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Save Changes</button>
            </div>
        `;
            content.appendChild(section);
        });

        // Append All
        appWindow.append(header, content);
        appContainer.appendChild(appWindow);
        document.body.appendChild(appContainer);

        // --- Logic: Open Feature from Home ---
        homeScreen.querySelectorAll(".custom-feature-card button").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const tabId = e.target.closest(".custom-feature-card").dataset.tab;
                homeScreen.style.display = "none";
                document.querySelectorAll(".custom-tab-content").forEach((sec) => {
                    sec.style.display = sec.dataset.tab === tabId ? "block" : "none";
                });

                // Highlight active icon in header
                document.querySelectorAll(".custom-tab-btn").forEach((b) => {
                    const active = b.dataset.tab === tabId;
                    b.classList.toggle("active", active);
                    b.style.color = active ? "#fff" : "#ccc";
                    b.style.background = active ? "#2563eb" : "transparent";
                });
            });
        });

        // --- Header Tab Click Switch ---
        tabContainer.addEventListener("click", (e) => {
            const clicked = e.target.closest(".custom-tab-btn");
            if (!clicked) return;
            const tabId = clicked.dataset.tab;

            homeScreen.style.display = "none";
            document.querySelectorAll(".custom-tab-content").forEach((sec) => {
                sec.style.display = sec.dataset.tab === tabId ? "block" : "none";
            });

            document.querySelectorAll(".custom-tab-btn").forEach((b) => {
                const active = b.dataset.tab === tabId;
                b.classList.toggle("active", active);
                b.style.color = active ? "#fff" : "#ccc";
                b.style.background = active ? "#2563eb" : "transparent";
            });
        });

        // --- Close Button ---
        closeBtn.addEventListener("click", () => {
            appContainer.style.opacity = "0";
            setTimeout(() => (appContainer.style.display = "none"), 300);
        });

        // --- Show App ---
        function showApp() {
            appContainer.style.display = "flex";
            requestAnimationFrame(() => (appContainer.style.opacity = "1"));
        }

        return { showApp };
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
