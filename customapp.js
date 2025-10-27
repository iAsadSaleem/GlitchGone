﻿(function () {
    function addCustomSidebarLink() {
        const sidebar = document.querySelector('nav[aria-label="header"]');
        if (!sidebar) return false;

        // Prevent duplicate injection
        const existing = document.getElementById("sb_custom-app");
        if (existing) return true;

        // --- Create the new menu item (button for reliability) ---
        const newItem = document.createElement("button");
        newItem.id = "sb_custom-app";
        newItem.type = "button";
        newItem.setAttribute("role", "menuitem");
        newItem.className =
            "custom-sidebar-link w-full group px-3 flex items-center justify-start text-sm font-medium rounded-md cursor-pointer opacity-80 hover:opacity-100 py-2 md:py-2 bg-transparent border-none outline-none";
        newItem.style.all = "unset";
        newItem.style.display = "flex";
        newItem.style.alignItems = "center";
        newItem.style.gap = "8px";
        newItem.style.cursor = "pointer";
        newItem.style.padding = "8px 12px";
        newItem.style.borderRadius = "6px";
        newItem.style.color = "#fff";

        newItem.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
           class="custom-sidebar-icon"
           style="width:20px;height:20px;filter:drop-shadow(0 0 2px rgba(255,255,255,0.3));"
           alt="Custom App Icon">
      <span style="display:flex;align-items:center;gap:6px;">
        <span class="custom-star-icon" style="animation: blinkStar 1s infinite alternate;">⭐</span>
        <span style="font-weight:500;">My Custom App</span>
        <span class="custom-new-tag" style="background:#ffcc00;color:#000;font-size:10px;font-weight:600;padding:1px 4px;border-radius:4px;">NEW</span>
      </span>
    `;

        sidebar.appendChild(newItem);

        // --- Create the app container ---
        let appContainer = document.getElementById("customAppContainer");
        if (!appContainer) {
            appContainer = document.createElement("div");
            appContainer.id = "customAppContainer";
            appContainer.className = "custom-app-container hidden";
            appContainer.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
      `;
            appContainer.innerHTML = `
        <div style="background:#fff;width:90%;height:85vh;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.3);position:relative;">
          <button id="closeCustomApp" style="position:absolute;top:10px;right:10px;background:#222;color:#fff;padding:6px 10px;border:none;border-radius:6px;cursor:pointer;z-index:10;">
            ✕ Close
          </button>
          <iframe src="https://your-app-dashboard-url.com" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      `;
            document.body.appendChild(appContainer);
        }

        // --- Show / Hide logic ---
        newItem.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove("hidden");
            appContainer.style.opacity = "1";
            appContainer.style.pointerEvents = "auto";
        });

        const closeBtn = appContainer.querySelector("#closeCustomApp");
        closeBtn.addEventListener("click", () => {
            appContainer.classList.add("hidden");
            appContainer.style.opacity = "0";
            appContainer.style.pointerEvents = "none";
        });

        console.log("✅ Custom sidebar menu added successfully!");
        return true;
    }

    // Run every second until loaded
    const interval = setInterval(() => {
        if (addCustomSidebarLink()) clearInterval(interval);
    }, 1000);

    // Re-run if GHL sidebar re-renders
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

    // --- Add blinking star animation ---
    const style = document.createElement("style");
    style.textContent = `
    @keyframes blinkStar {
      from { opacity: 0.3; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1.2); }
    }
  `;
    document.head.appendChild(style);
})();
