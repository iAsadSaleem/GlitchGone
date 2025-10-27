(function () {
    function addCustomSidebarLink() {
        const sidebar = document.querySelector('nav[aria-label="header"]');
        if (!sidebar) return false;

        // Prevent duplicate injection
        if (document.getElementById("sb_custom-app")) return true;

        // --- Create the new menu item ---
        const newItem = document.createElement("a");
        newItem.href = "javascript:void(0)";
        newItem.id = "sb_custom-app";
        newItem.className =
            "custom-sidebar-link w-full group px-3 flex items-center justify-start lg:justify-start xl:justify-start text-sm font-medium rounded-md cursor-pointer opacity-70 hover:opacity-100 py-2 md:py-2";
        newItem.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
           class="custom-sidebar-icon md:mr-0 h-5 w-5 mr-2 lg:mr-2 xl:mr-2"
           alt="Custom App Icon">
      <span class="hl_text-overflow sm:hidden md:hidden nav-title lg:block xl:block">
        My Custom App
      </span>
    `;
        sidebar.appendChild(newItem);

        // --- Create your app container (hidden by default) ---
        const appContainer = document.createElement("div");
        appContainer.id = "customAppContainer";
        appContainer.className = "custom-app-container hidden";
        appContainer.innerHTML = `
      <div class="custom-app-inner">
        <button id="closeCustomApp" class="custom-app-close-btn">Close</button>
        <iframe src="https://your-app-dashboard-url.com" class="custom-app-iframe"></iframe>
      </div>
    `;
        document.body.appendChild(appContainer);

        // --- Handle click events ---
        newItem.addEventListener("click", () => {
            appContainer.classList.remove("hidden");
            appContainer.classList.add("show");
        });

        document
            .getElementById("closeCustomApp")
            .addEventListener("click", () => {
                appContainer.classList.remove("show");
                appContainer.classList.add("hidden");
            });

        console.log("✅ Custom sidebar menu added successfully!");
        return true;
    }

    // Keep checking until sidebar loads
    const interval = setInterval(() => {
        if (addCustomSidebarLink()) clearInterval(interval);
    }, 1000);
})();
