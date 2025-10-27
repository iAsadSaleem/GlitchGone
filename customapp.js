(function () {
    function addCustomSidebarLink() {
        const sidebar = document.querySelector('nav[aria-label="header"]');
        if (!sidebar) return false;

        // ✅ Prevent duplicate injection
        if (document.getElementById("sb_custom-app")) return true;

        // --- Create button element ---
        const newItem = document.createElement("button");
        newItem.id = "sb_custom-app";
        newItem.type = "button";
        newItem.className =
            "custom-sidebar-link w-full group flex items-center justify-start text-sm font-medium rounded-md cursor-pointer opacity-80 hover:opacity-100";
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

        // --- Create icon + text wrapper ---
        const wrapper = document.createElement("span");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";

        const star = document.createElement("span");
        star.className = "custom-star-icon";
        star.textContent = "⭐";
        star.style.animation = "blinkStar 1s infinite alternate";

        const label = document.createElement("span");
        label.style.fontWeight = "500";
        label.textContent = "My Custom App";

        const newTag = document.createElement("span");
        newTag.className = "custom-new-tag";
        Object.assign(newTag.style, {
            background: "#ffcc00",
            color: "#000",
            fontSize: "10px",
            fontWeight: "600",
            padding: "1px 4px",
            borderRadius: "4px",
        });
        newTag.textContent = "NEW";

        // Append them together
        wrapper.append(star, label, newTag);
        newItem.appendChild(wrapper);
        sidebar.appendChild(newItem);

        // --- Create App container ---
        let appContainer = document.getElementById("customAppContainer");
        if (!appContainer) {
            appContainer = document.createElement("div");
            appContainer.id = "customAppContainer";
            appContainer.className = "custom-app-container hidden";
            Object.assign(appContainer.style, {
                position: "fixed",
                inset: "0",
                background: "rgba(0, 0, 0, 0.65)",
                display: "none",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "9999",
                opacity: "0",
                transition: "opacity 0.3s ease",
            });

            // Inner app window
            const appWindow = document.createElement("div");
            Object.assign(appWindow.style, {
                background: "#fff",
                width: "90%",
                height: "85vh",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                position: "relative",
            });

            // Close button
            const closeBtn = document.createElement("button");
            closeBtn.id = "closeCustomApp";
            closeBtn.textContent = "✕ Close";
            Object.assign(closeBtn.style, {
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "#222",
                color: "#fff",
                padding: "6px 10px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                zIndex: "10",
            });

            appWindow.appendChild(closeBtn);
            appContainer.appendChild(appWindow);
            document.body.appendChild(appContainer);
        }

        // --- Show App on click ---
        newItem.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.style.display = "flex";
            requestAnimationFrame(() => {
                appContainer.style.opacity = "1";
            });
        });

        // --- Close App on click ---
        const closeBtn = appContainer.querySelector("#closeCustomApp");
        closeBtn.addEventListener("click", () => {
            appContainer.style.opacity = "0";
            setTimeout(() => {
                appContainer.style.display = "none";
            }, 300);
        });

        console.log("✅ Custom sidebar menu added successfully!");
        return true;
    }

    // Run every second until loaded
    const interval = setInterval(() => {
        if (addCustomSidebarLink()) clearInterval(interval);
    }, 1000);

    // Re-run if sidebar re-renders
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

    // --- Add blinking animation ---
    const style = document.createElement("style");
    style.textContent = `
        @keyframes blinkStar {
            from { opacity: 0.3; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
})();
