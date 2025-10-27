(function () {
    function addCustomSidebarLink() {
        const sidebar = document.querySelector('nav[aria-label="header"]');
        if (!sidebar) return false;

        // Prevent duplicate injection
        if (document.getElementById("sb_custom-app")) return true;

        // --- Create the new menu item (div, not <a>) ---
        const newItem = document.createElement("div");
        newItem.id = "sb_custom-app";
        newItem.className =
            "custom-sidebar-link w-full group px-3 flex items-center justify-start lg:justify-start xl:justify-start text-sm font-medium rounded-md cursor-pointer opacity-70 hover:opacity-100 py-2 md:py-2";
        newItem.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
           class="custom-sidebar-icon md:mr-0 h-5 w-5 mr-2 lg:mr-2 xl:mr-2"
           alt="Custom App Icon">
      <span class="hl_text-overflow sm:hidden md:hidden nav-title lg:block xl:block flex items-center gap-2">
        <span class="custom-star-icon">⭐</span>
        <span>My Custom App</span>
        <span class="custom-new-tag">NEW</span>
      </span>
    `;

        sidebar.appendChild(newItem);

        // --- Create your app container (once) ---
        let appContainer = document.getElementById("customAppContainer");
        if (!appContainer) {
            appContainer = document.createElement("div");
            appContainer.id = "customAppContainer";
            appContainer.className = "custom-app-container hidden";
            appContainer.innerHTML = `
        <div style="padding:20px; font-family:sans-serif;">
          <button id="closeCustomApp" style="background:#444;color:#fff;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-bottom:15px;">
            Close
          </button>
          <iframe src="https://your-app-dashboard-url.com" 
                  style="width:100%;height:90vh;border:none;border-radius:10px;"></iframe>
        </div>
      `;
            document.body.appendChild(appContainer);
        }

        // --- Click handler ---
        newItem.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove("hidden");
            appContainer.classList.add("show");
        };

        const closeBtn = appContainer.querySelector("#closeCustomApp");
        if (closeBtn) {
            closeBtn.onclick = () => {
                appContainer.classList.remove("show");
                appContainer.classList.add("hidden");
            };
        }

        console.log("✅ Custom sidebar menu added and listener bound!");
        return true;
    }

    // Initial run
    const interval = setInterval(() => {
        if (addCustomSidebarLink()) clearInterval(interval);
    }, 1000);

    // React re-render watcher — re-inject + re-bind on sidebar changes
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
})();
