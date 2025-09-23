(function () {
    const DEBUG = true;
    const log = (...args) => { if (DEBUG) console.log('[ThemeBuilder]', ...args); };

    let headerObserver = null;
    const MAX_ATTEMPTS = 40;

    (function () {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
            link.crossOrigin = "anonymous";
            link.referrerPolicy = "no-referrer";
            document.head.appendChild(link);
            console.log("[ThemeBuilder] Font Awesome loaded");
        }
    })();
    (function loadFontAwesome() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
            document.head.appendChild(link);
        }
    })();

    window.addEventListener("load", () => {
        waitForSidebarMenus(() => {
            // ✅ Apply locked menus or other functions if needed
            applyLockedMenus();

            // ✅ Apply saved menu customizations (icons + titles)
            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const menuCustomizations = savedTheme.themeData?.["--menuCustomizations"]
                ? JSON.parse(savedTheme.themeData["--menuCustomizations"])
                : {};

            Object.keys(menuCustomizations).forEach(menuId => {
                const custom = menuCustomizations[menuId];
                const menuEl = document.getElementById(menuId);
                if (!menuEl) return;

                // Remove old icons
                menuEl.querySelectorAll("i, img").forEach(el => el.remove());

                // Insert new icon
                const navTitle = menuEl.querySelector(".nav-title");
                if (custom.icon) {
                    const iconEl = document.createElement("i");
                    iconEl.className = custom.icon;
                    iconEl.style.marginRight = "8px";
                    if (navTitle) menuEl.insertBefore(iconEl, navTitle);
                    else menuEl.prepend(iconEl);
                }

                // Update title
                if (navTitle && custom.title) navTitle.textContent = custom.title;
            });

            // ✅ Apply other theme customizations
            applyMenuCustomizations();
        });
    });

    /**************************************
 * JC Confirm Modal Function
 **************************************/
    function showJCConfirm(message, onYes, onNo) {
        // Check if modal already exists
        let modal = document.getElementById("jc-confirm-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "jc-confirm-modal";
            modal.className = "jc-confirm-modal-overlay"; // overlay covers drawer

            // Modal content inside overlay
            modal.innerHTML = `
            <div class="jc-confirm-modal-content">
                <p id="jc-confirm-message"></p>
                <button id="jc-yes-btn">Yes</button>
                <button id="jc-no-btn">No</button>
            </div>
        `;

            // Append modal inside Theme Builder Drawer
            const drawer = document.getElementById("themeBuilderDrawer") || document.body;
            drawer.appendChild(modal);
        }

        // Set the message
        modal.querySelector("#jc-confirm-message").textContent = message;

        // Show modal
        modal.style.display = "flex";

        const yesBtn = modal.querySelector("#jc-yes-btn");
        const noBtn = modal.querySelector("#jc-no-btn");

        // Remove previous event listeners
        yesBtn.replaceWith(yesBtn.cloneNode(true));
        noBtn.replaceWith(noBtn.cloneNode(true));

        modal.querySelector("#jc-yes-btn").addEventListener("click", () => {
            modal.style.display = "none";
            onYes && onYes();
        });

        modal.querySelector("#jc-no-btn").addEventListener("click", () => {
            modal.style.display = "none";
            onNo && onNo();
        });
    }
    // Load CSS for Theme Builder
    function loadThemeBuilderCSS() {
        if (!document.getElementById('themeBuilderCSS')) {
            const link = document.createElement('link');
            link.id = 'themeBuilderCSS';
            link.rel = 'stylesheet';
            link.href = 'https://glitch-gone-nu.vercel.app/theme-builder.css';
            document.head.appendChild(link);
        }
    }
    loadThemeBuilderCSS();

    //// NEW: Fetch user theme from DB and apply
    //async function loadUserThemeFromDB(identifier, type = "rlno") {
    //    try {
    //        const res = await fetch(`https://theme-builder-delta.vercel.app/api/theme/code/${identifier}?type=${type}`);
    //        if (!res.ok) throw new Error(`Failed to fetch theme for ${type}: ${identifier}`);

    //        const theme = await res.json();
    //        if (!theme.isActive) return;

    //        // ✅ Apply inline theme variables
    //        if (theme.themeData) {
    //            Object.entries(theme.themeData).forEach(([key, value]) => {
    //                if (value && value !== "undefined") {
    //                    document.body.style.setProperty(key, value);
    //                }
    //            });
    //        }

    //        localStorage.setItem("userTheme", JSON.stringify(theme));

    //        // ✅ ALSO apply the CSS file from your encoded source
    //        await applyCSSFile(identifier);

    //    } catch (err) {
    //        console.error("[ThemeBuilder] Failed to load user theme:", err);

    //        // ✅ fallback from cache
    //        const cached = localStorage.getItem("userTheme");
    //        if (cached) {
    //            const theme = JSON.parse(cached);
    //            if (theme.themeData) {
    //                Object.entries(theme.themeData).forEach(([key, value]) => {
    //                    if (value && value !== "undefined") {
    //                        document.body.style.setProperty(key, value);
    //                    }
    //                });
    //            }
    //            log("Applied cached theme from localStorage");

    //            // ✅ also try loading CSS file from identifier if cached
    //            //const cachedIdentifier = theme.email ? theme.email.toLowerCase() : theme.rlno;
    //            //if (cachedIdentifier) {
    //            //    await applyCSSFile(cachedIdentifier);
    //            //}
    //        }
    //    }
    //}

    // 🔹 Helper function to fetch and inject CSS from theme JSON
    //async function applyCSSFile(identifier) {
    //    try {
    //        const url = `https://theme-builder-delta.vercel.app/api/theme/code/${encodeURIComponent(identifier)}`;
    //        const res = await fetch(url);
    //        if (!res.ok) throw new Error("Failed to fetch theme JSON");

    //        const theme = await res.json();
    //        if (!theme || !theme.themeData) throw new Error("No themeData found");

    //        // Convert themeData to CSS variables
    //        let css = ":root {\n";
    //        for (const [key, value] of Object.entries(theme.themeData)) {
    //            if (key.startsWith("--") && value && value !== "undefined") {
    //                css += `  ${key}: ${value};\n`;
    //            }
    //        }
    //        css += "}\n";

    //        // remove old CSS (avoid duplicates)
    //        const oldStyle = document.getElementById("theme-css");
    //        if (oldStyle) oldStyle.remove();

    //        // inject new CSS
    //        const style = document.createElement("style");
    //        style.id = "theme-css";
    //        style.innerHTML = css;
    //        document.head.appendChild(style);

    //    } catch (err) {
    //        console.error("❌ Failed to apply CSS from theme JSON:", err.message);
    //    }
    //}
    // Create collapsible sections
    // Utility to create section with optional icon
    function createSection(title, contentBuilder, icon = null) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";
        header.style.cursor = "pointer";

        // Optional left icon
        if (icon) {
            const iconEl = document.createElement("span");
            iconEl.className = "tb-section-icon";
            iconEl.innerHTML = icon; // can be emoji or FA markup
            header.appendChild(iconEl);
        }

        // Title
        const titleText = document.createElement("span");
        titleText.className = "tb-section-title";
        titleText.innerHTML = title;
        header.appendChild(titleText);

        // Toggle arrow (always at right)
        const toggleIcon = document.createElement("i");
        toggleIcon.className = "fa-solid fa-angle-down tb-toggle-icon";
        header.appendChild(toggleIcon);

        // Section content
        const content = document.createElement("div");
        content.className = "tb-section-content";

        // Click event
        header.addEventListener("click", () => {
            const drawer = header.closest(".tb-drawer-content");

            // Close others
            drawer.querySelectorAll(".tb-section-content.open").forEach(openContent => {
                if (openContent !== content) {
                    openContent.classList.remove("open");
                    openContent.previousSibling.classList.remove("tb-section-header-open");
                    const otherIcon = openContent.previousSibling.querySelector(".tb-toggle-icon");
                    if (otherIcon) otherIcon.className = "fa-solid fa-angle-down tb-toggle-icon";
                    openContent.style.maxHeight = null;
                    openContent.style.overflowY = null;
                }
            });

            // Toggle this one
            content.classList.toggle("open");
            header.classList.toggle("tb-section-header-open", content.classList.contains("open"));

            if (content.classList.contains("open")) {
                content.style.maxHeight = "200px";
                content.style.overflowY = "auto";
                toggleIcon.className = "fa-solid fa-angle-up tb-toggle-icon"; // 🔼
            } else {
                content.style.maxHeight = null;
                content.style.overflowY = null;
                toggleIcon.className = "fa-solid fa-angle-down tb-toggle-icon"; // 🔽
            }
        });

        section.appendChild(header);
        section.appendChild(content);
        contentBuilder(content);

        return section;
    }


    // Tooltip helper
    function initTooltip(btn, text) {
        const tooltip = document.createElement("div");
        tooltip.className = "tb-tooltip";
        tooltip.textContent = text;
        btn.appendChild(tooltip);
        btn.style.position = 'relative';
        btn.addEventListener("mouseenter", () => tooltip.classList.add("visible"));
        btn.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    }

    // Color picker creator
    // 🌟 Mapping of CSS vars -> Human-friendly labels
    const cssVarLabels = {
        "--primary-color": "Choose Primary Color",
        "--second-color": "Choose Secondary Color",

        // Sidebar gradient
        "--sidebar-bg-color": "Choose Sidebar BG Start Color",
        "--sidebar-bg-end-color": "Choose Sidebar BG End Color",

        "--sidebar-menu-bg": "Choose Sidebar Menu BG Color",
        "--sidebar-menu-hover-bg": "Choose Menu Hover Color",
        "--sidebar-menu-color": "Choose SideBar Text Color",
        "--sidebar-menu-icon-color": "Choose SideBar Icon Color",

        // Login page gradient
        "--login-background-gradient-start": "Login BG Gradient Start Color",
        "--login-background-gradient-end": "Login BG Gradient End Color"
    };

    function createLoginGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Background Gradient Start Color",
            null,
            "--login-background-gradient-start",
            updateLoginBackgroundGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Background Gradient End Color",
            null,
            "--login-background-gradient-end",
            updateLoginBackgroundGradient
        ));

        return wrapper;
    }
   function updateLoginBackgroundGradient() {
    const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
    savedThemeObj.themeData = savedThemeObj.themeData || {};

    const start = getComputedStyle(document.body).getPropertyValue("--login-background-gradient-start").trim() || "#ffffff";
    const end = getComputedStyle(document.body).getPropertyValue("--login-background-gradient-end").trim() || start;
    const gradient = `linear-gradient(to bottom, ${start} 0%, ${start} 20%, ${end} 100%)`;

    // Apply to body
    //document.body.style.setProperty("--login-background-gradient-start", start);
    //document.body.style.setProperty("--login-background-gradient-end", end);
    document.body.style.setProperty("--login-background-gradient-color", gradient);

       // Save all three to localStorageLogin Background Gradient End Color

    //savedThemeObj.themeData["--login-background-gradient-start"] = start;
    //savedThemeObj.themeData["--login-background-gradient-end"] = end;
    savedThemeObj.themeData["--login-background-gradient-color"] = gradient;
    localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
}

    function createColorPicker(labelText, storageKey, cssVar, applyFn) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = cssVarLabels[cssVar] || labelText;
        label.className = "tb-color-picker-label";

        // 1️⃣ Load saved or fallback color
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        let storedColor = themeData[cssVar]
            || getComputedStyle(document.body).getPropertyValue(cssVar).trim()
            || "#007bff";

        // ✅ Ensure it’s a valid hex code
        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#007bff";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        // 🔹 Make this an editable input field
        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7; // # + 6 hex chars

        // Helper to apply color everywhere
        function applyColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return; // only valid hex
            colorInput.value = color;
            colorCode.value = color;

            if (cssVar) document.body.style.setProperty(cssVar, color);
            if (applyFn) applyFn(color);

            // Save to localStorage
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            if (storageKey) localStorage.setItem(storageKey, color);
        }

        // 🎨 When using color picker
        colorInput.addEventListener("input", () => {
            applyColor(colorInput.value);
        });

        // ⌨️ When typing/pasting hex code
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                applyColor(val);
            }
        });

        // Initial apply
        applyColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }

    // Apply sidebar text color live
    function applySidebarTextColor(color) {
        const sidebarLinks = document.querySelectorAll('.sidebar-v2 nav a');
        sidebarLinks.forEach(a => {
            a.style.setProperty("color", color, "important");
            const span = a.querySelector('span');
            if (span) span.style.setProperty("color", color, "important");
        });
    }

    // NEW: Theme Selector Section
    function buildThemeSelectorSection(container) {
        if (!container) return;

        // inject minimal styles once
        if (!document.getElementById("tb-theme-selector-styles")) {
            const s = document.createElement("style");
            s.id = "tb-theme-selector-styles";
            s.textContent = `
        .themeSelectWrapper{position:relative;display:inline-flex;align-items:center}
        .tb-theme-cycle-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:600;min-width:160px;justify-content:space-between}
        .themeBtnInner{display:flex;align-items:center;gap:8px;width:100%}
        .themeBtnText{flex:1;text-align:left}
        .themeArrowIcon{width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.08);font-size:12px;cursor:pointer}
        `;
            document.head.appendChild(s);
        }

        // Build DOM
        const wrapper = document.createElement("div");
        wrapper.className = "themeSelectWrapper";

        const themeBtn = document.createElement("button");
        themeBtn.className = "tb-theme-cycle-btn";
        themeBtn.type = "button";

        const inner = document.createElement("div");
        inner.className = "themeBtnInner";

        const textSpan = document.createElement("span");
        textSpan.className = "themeBtnText";
        textSpan.textContent = "Select Theme";

        // circle icon (Font Awesome expected to be loaded separately)
        const arrowIcon = document.createElement("span");
        arrowIcon.className = "themeArrowIcon";
        arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';

        // dropdown container
        const dropdownBox = document.createElement("div");
        dropdownBox.className = "themeDropdownBox";

        inner.appendChild(textSpan);
        inner.appendChild(arrowIcon);
        themeBtn.appendChild(inner);

        wrapper.appendChild(themeBtn);
        wrapper.appendChild(dropdownBox);
        container.appendChild(wrapper);

        // Themes object (kept from your original)
        const themes = {
            "Default": {
                "--primary-color": "#b7e4ba",
                "--primary-bg-color": "#34699A",
                "--sidebar-bg-color": "#DDF4E7",
                "--sidebar-menu-bg": "#95d59d",
                "--sidebar-menu-color": "#24352a",
                "--sidebar-menu-hover-bg": "#52b776",
                "--sidebar-menu-active-bg": "#40915d",
                "--header-bg-color": "#b7e4ba"
            },
            "Pastel Grass": {
                "--primary-color": "#b7e4ba",
                "--primary-bg-color": "#95d59d",
                "--sidebar-bg-color": "#74c691",
                "--sidebar-menu-bg": "#52b776",
                "--sidebar-menu-color": "#ffffff",
                "--sidebar-menu-hover-bg": "#2b2b2b",
                "--sidebar-menu-active-bg": "#3d3d3d",
                "--header-bg-color": "#74c691"
            },
            "BlueWhite Theme": {
                "--primary-color": "#2563eb",
                "--second-color": "#3b82f6",
                "--dark-color": "#1e3a8a",
                "--grey-color": "#f9fafb",
                "--alert-color": "#dc2626",
                "--app-bg-color": "#ffffff",
                "--Acent-color": "#1d4ed8",
                "--sidebar-bg-color": "#1e40af",
                "--sidebar-menu-bg": "#2563eb",
                "--sidebar-menu-color": "#ffffff",
                "--sidebar-menu-hover-bg": "#1d4ed8",
                "--sidebar-menu-active-bg": "#1e3a8a",
                "--sidebar-menu-icon-color": "#e0f2fe",
                "--sidebar-menu-icon-hover-color": "#bae6fd",
                "--sidebar-menu-icon-active-color": "#60a5fa",
                "--scroll-color": "#2563eb",
                "--header-bg-color": "#1e40af",
                "--header-icon-color": "#ffffff",
                "--header-icon-hover-color": "#dbeafe",
                "--header-icon-bg": "#2563eb",
                "--header-icon-hover-bg": "#1e3a8a",
                "--card-body-bg-color": "#f0f9ff",
                "--card-body-font-color": "#1e293b",
                "--card-title-font-color": "#0f172a",
                "--card-dec-font-color": "#334155",
                "--card-footer-bg-color": "#e0f2fe",
                "--card-footer-font-color": "#1e3a8a",
                "--top-nav-menu-bg": "#2563eb",
                "--top-nav-menu-hover-bg": "#1d4ed8",
                "--top-nav-menu-active-bg": "#1e3a8a",
                "--top-nav-menu-color": "#ffffff",
                "--top-nav-menu-hover-color": "#bae6fd",
                "--top-nav-menu-active-color": "#ffffff"
            },
            "IndigoPurple Theme": {
                "--primary-color": "#3B38A0",
                "--second-color": "#7A85C1",
                "--dark-color": "#1A2A80",
                "--grey-color": "#f9fafb",
                "--alert-color": "#e11d48",
                "--app-bg-color": "#ffffff",
                "--Acent-color": "#B2B0E8",
                "--sidebar-bg-color": "#1A2A80",
                "--sidebar-menu-bg": "#3B38A0",
                "--sidebar-menu-color": "#ffffff",
                "--sidebar-menu-hover-bg": "#2a2f7c",
                "--sidebar-menu-active-bg": "#7A85C1",
                "--sidebar-menu-icon-color": "#e0e7ff",
                "--sidebar-menu-icon-hover-color": "#c7d2fe",
                "--sidebar-menu-icon-active-color": "#B2B0E8",
                "--scroll-color": "#7A85C1",
                "--header-bg-color": "#3B38A0",
                "--header-icon-color": "#ffffff",
                "--header-icon-hover-color": "#e0e7ff",
                "--header-icon-bg": "#7A85C1",
                "--header-icon-hover-bg": "#1A2A80",
                "--card-body-bg-color": "#f5f6ff",
                "--card-body-font-color": "#1f2937",
                "--card-title-font-color": "#111827",
                "--card-dec-font-color": "#374151",
                "--card-footer-bg-color": "#e0e7ff",
                "--card-footer-font-color": "#1A2A80",
                "--top-nav-menu-bg": "#3B38A0",
                "--top-nav-menu-hover-bg": "#2a2f7c",
                "--top-nav-menu-active-bg": "#1A2A80",
                "--top-nav-menu-color": "#ffffff",
                "--top-nav-menu-hover-color": "#c7d2fe",
                "--top-nav-menu-active-color": "#ffffff"
            }
        };

        const themeKeys = Object.keys(themes);
        let currentIndex = -1;

        // apply theme (merges theme vars into saved themeData to avoid overwriting other keys)
        function applyTheme(themeName, themeVars) {
            const vars = themeVars || themes[themeName];
            if (!vars) return;

            Object.entries(vars).forEach(([key, value]) => {
                if (value && value !== "undefined") {
                    document.body.style.setProperty(key, value);
                }
            });

            // update UI
            textSpan.textContent = themeName;
            themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff";
            themeBtn.style.color = "#fff";

            // Save (merge so we don't drop other saved keys like --lockedMenus etc)
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = { ...(savedThemeObj.themeData || {}), ...vars };
            savedThemeObj.selectedTheme = themeName;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // restore saved theme if exists
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (savedThemeObj.selectedTheme) {
            applyTheme(savedThemeObj.selectedTheme, savedThemeObj.themeData);
            if (themeKeys.includes(savedThemeObj.selectedTheme)) {
                currentIndex = themeKeys.indexOf(savedThemeObj.selectedTheme);
            }
        }

        // cycle themes when clicking main area of button (but not when clicking the arrow)
        themeBtn.addEventListener("click", (e) => {
            // if the click target is the arrow or inside it, ignore (arrow handles dropdown)
            if (e.target.closest(".themeArrowIcon")) return;
            currentIndex = (currentIndex + 1) % themeKeys.length;
            applyTheme(themeKeys[currentIndex]);
        });

        // populate dropdown
        themeKeys.forEach(themeName => {
            const optBtn = document.createElement("button");
            optBtn.type = "button";
            optBtn.textContent = themeName;
            optBtn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                applyTheme(themeName);
                dropdownBox.classList.remove("show");
                arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
            });
            dropdownBox.appendChild(optBtn);
        });

        // arrow toggles dropdown
        arrowIcon.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const open = dropdownBox.classList.toggle("show");
            arrowIcon.innerHTML = open ? '<i class="fa-solid fa-angle-up" aria-hidden="true"></i>' : '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
        });

        // close when clicking outside
        document.addEventListener("click", (ev) => {
            if (!wrapper.contains(ev.target)) {
                dropdownBox.classList.remove("show");
                arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
            }
        });

        // prevent accidental form submit if in a form
        themeBtn.addEventListener("keydown", (ev) => {
            if (ev.key === " " || ev.key === "Enter") {
                ev.preventDefault();
                themeBtn.click();
            }
        });
    }

    // Build theme colors section
    function buildThemeColorsSection(container) {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};

        // Editable colors grouped
        const editableColors = [
            "--primary-color",
            "--second-color",
            "--sidebar-bg-color",
            "--sidebar-bg-end-color", // new: end color for sidebar gradient
            "--sidebar-menu-bg",
            "--sidebar-menu-hover-bg",
            "--sidebar-menu-color",
            "--sidebar-menu-icon-color"
        ];

        function updateSidebarGradient() {
            const sidebarStart = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-color").trim() || "#000000";
            const sidebarEnd = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-end-color").trim() || sidebarStart;

            const gradient = `linear-gradient(to bottom, ${sidebarStart}, ${sidebarEnd})`;
            document.body.style.setProperty("--sidebar-main-bg-gradient", gradient);
        }

        editableColors.forEach((key, index) => {
            // --- Add headings at specific points ---
            if (index === 0) {
                // Before Primary & Secondary
                const header = document.createElement("h4");
                header.className = "tb-header-controls";
                header.textContent = "Primary & Secondary Colors";
                container.appendChild(header);
            }

            if (key === "--sidebar-bg-color") {
                // Before Sidebar Colors
                const header = document.createElement("h4");
                header.className = "tb-header-controls";
                header.textContent = "Sidebar Colors";
                container.appendChild(header);
            }

            // --- Determine initial value and apply it to document so createColorPicker picks it up ---
            const value = localStorage.getItem(key) || themeData[key] || "#000000";
            document.body.style.setProperty(key, value);

            // --- Create Picker ---
            let label = key;
            if (key === "--sidebar-bg-color") label = "Choose Sidebar BG Start Color";
            if (key === "--sidebar-bg-end-color") label = "Choose Sidebar BG End Color";

            const picker = createColorPicker(key, label, key, (val) => {
                document.body.style.setProperty(key, val);

                if (key === "--sidebar-bg-color" || key === "--sidebar-bg-end-color") {
                    updateSidebarGradient();
                }
            });

            container.appendChild(picker);
        });

        // --- Initial Gradient Apply ---
        updateSidebarGradient();
    }


    // Apply saved settings
    function applySavedSettings() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        Object.entries(themeData).forEach(([key, value]) => {
            if (value && value !== "undefined") {
                document.body.style.setProperty(key, value);
            }
        });
        const sidebarText = localStorage.getItem("sidebarTextColor");
        if (sidebarText) applySidebarTextColor(sidebarText);
    }
    // Find header controls container
    function findControlsContainer() {
        const header = document.querySelector('header.hl_header') || document.querySelector('header');
        if (!header) return null;
        const controls = header.querySelectorAll('.hl_header--controls');
        if (!controls || !controls.length) return null;
        return Array.from(controls).sort((a, b) => b.childElementCount - a.childElementCount)[0];
    }

    function buildFontFamilySelector(wrapper) {
        const label = document.createElement("label");
        label.textContent = "Choose Font Family";
        label.className = "tb-font-label";

        const select = document.createElement("select");
        select.className = "tb-font-select";

        const fonts = [
            "Arial",
            "Verdana",
            "Tahoma",
            "Georgia",
            "Times New Roman",
            "Courier New",
            "Trebuchet MS",
            "Comic Sans MS",
            "Poppins",
            "Roboto"
        ];

        fonts.forEach(font => {
            const option = document.createElement("option");
            option.value = font;
            option.textContent = font.split(",")[0]; // show first name
            option.style.fontFamily = font; // preview in dropdown
            select.appendChild(option);
        });

        // Load from localStorage if exists
        const savedFont = localStorage.getItem("--body-font");
        if (savedFont) {
            select.value = savedFont;
            document.body.style.setProperty("--body-font", savedFont);
        }

        // Apply instantly when changed
        select.addEventListener("change", () => {
            const font = select.value;
            document.body.style.setProperty("--body-font", font);
            localStorage.setItem("--body-font", font); // keep synced
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
    }

    // Login Page settings
    function createLoginColorPicker(labelText, cssVar) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "tb-color-picker-label";

        // Load current color from themeData or CSS variable
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        let storedValue = themeData[cssVar]
            || getComputedStyle(document.body).getPropertyValue(cssVar).trim()
            || "#007bff"; // fallback

        // ✅ Ensure it's a valid hex color
        let storedColor = /^#([0-9A-Fa-f]{3}){1,2}$/i.test(storedValue) ? storedValue : "#007bff";

        // 🎨 Color picker input
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        // 📝 Editable hex input
        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7; // # + 6 hex chars

        // Helper to apply color
        function applyColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return; // only accept full hex
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty(cssVar, color);

            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedTheme.themeData = savedTheme.themeData || {};
            savedTheme.themeData[cssVar] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedTheme));
        }

        // 🎨 Color picker change
        colorInput.addEventListener("input", () => {
            applyColor(colorInput.value);
        });

        // ⌨️ Manual hex typing
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                applyColor(val);
            }
        });

        // Initial apply
        applyColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }
    // ⬇️ Create Login Card BG Gradient Picker (Start + End colors)
    function createLoginCardGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG Gradient Start Color",
            null,
            "--login-card-bg-gradient-start",
            updateLoginCardBackgroundGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG Gradient End Color",
            null,
            "--login-card-bg-gradient-end",
            updateLoginCardBackgroundGradient
        ));

        return wrapper;
    }

    // ⬇️ Function to build + apply gradient
    function updateLoginCardBackgroundGradient() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Get current values or fallback
        const start = getComputedStyle(document.body).getPropertyValue("--login-card-bg-gradient-start").trim() || "#565bf0";
        const end = getComputedStyle(document.body).getPropertyValue("--login-card-bg-gradient-end").trim() || "#072340";

        // Build gradient
        const gradient = `linear-gradient(to bottom, ${start}, ${end})`;

        // Apply gradient CSS variable
        document.body.style.setProperty("--login-card-bg-gradient", gradient);

        // Save in localStorage
        savedThemeObj.themeData["--login-card-bg-gradient-start"] = start;
        savedThemeObj.themeData["--login-card-bg-gradient-end"] = end;
        savedThemeObj.themeData["--login-card-bg-gradient"] = gradient;
        localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
    }

    function createLoginButtonGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Button Gradient Start Color",
            null,
            "--login-button-gradient-start",
            updateLoginButtonGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Button Gradient End Color",
            null,
            "--login-button-gradient-end",
            updateLoginButtonGradient
        ));

        return wrapper;
    }
    /**
     * Update Login Button Gradient based on start & end
     */
    function updateLoginButtonGradient() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        const start = getComputedStyle(document.body).getPropertyValue("--login-button-gradient-start").trim() || "#4f46e5";
        const end = getComputedStyle(document.body).getPropertyValue("--login-button-gradient-end").trim() || start;

        // Smooth gradient for button
        const gradient = `linear-gradient(to bottom, ${start} 20%, ${end} 100%)`;

        // Apply to CSS variable
        document.body.style.setProperty("--login-button-bg-gradient", gradient);

        // Save to localStorage
        savedThemeObj.themeData["--login-button-gradient-start"] = start;
        savedThemeObj.themeData["--login-button-gradient-end"] = end;
        savedThemeObj.themeData["--login-button-bg-gradient"] = gradient;

        localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
    }

    // Append both separately after gradient pickers


    /* ========== Border Radius Input ========== */
    function createLoginButtonBorderRadiusInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Button Border Radius";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedRadius = themeData["--login-button-border-radius"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-border-radius").trim() ||
            "5px";

        let numericValue = parseInt(storedRadius, 10) || 5;

        const radiusInput = document.createElement("input");
        radiusInput.type = "number";
        radiusInput.min = 0;
        radiusInput.value = numericValue;
        radiusInput.className = "tb-color-code"; // reuse styling

        function applyRadius(val) {
            const radius = `${val}px`;
            document.body.style.setProperty("--login-button-border-radius", radius);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-border-radius"] = radius;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        radiusInput.addEventListener("input", () => {
            const val = parseInt(radiusInput.value, 10);
            if (!isNaN(val)) applyRadius(val);
        });

        applyRadius(numericValue);

        wrapper.appendChild(label);
        wrapper.appendChild(radiusInput);

        return wrapper;
    }

    /* ========== Font Color Picker ========== */
    function createLoginButtonFontColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Button Font Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-button-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-text-color").trim() ||
            "#ffffff";

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#ffffff";
        }

        // 🎨 Color picker
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        // 📝 Hex code input
        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyFontColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-button-text-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-text-color"] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        colorInput.addEventListener("input", () => applyFontColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyFontColor(val);
        });

        applyFontColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }
    
    /* ========== Hover Background Color Picker ========== */

    /* ========== Hover Background Color Picker ========== */
    function createLoginButtonHoverBgColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Button Hover Background Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-button-hover-bg-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-hover-bg-color").trim() ||
            "#1d4ed8"; // fallback default

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#1d4ed8";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyHoverBgColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-button-hover-bg-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-hover-bg-color"] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        colorInput.addEventListener("input", () => applyHoverBgColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyHoverBgColor(val);
        });

        applyHoverBgColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }

    /* ========== Hover Text Color Picker ========== */
    function createLoginButtonHoverTextColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Button Hover Text Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-button-hover-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-hover-text-color").trim() ||
            "#ffffff"; // fallback default

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#ffffff";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyHoverTextColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-button-hover-text-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-hover-text-color"] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        colorInput.addEventListener("input", () => applyHoverTextColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyHoverTextColor(val);
        });

        applyHoverTextColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }


 

    /* ========== Link Text Color Picker ========== */
    function createLoginLinkTextColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Link Text Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-link-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-link-text-color").trim() ||
            "#2563eb"; // default blue

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#2563eb";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyLinkTextColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-link-text-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-link-text-color"] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        colorInput.addEventListener("input", () => applyLinkTextColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyLinkTextColor(val);
        });

        applyLinkTextColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }

    /* ========== Link Text Font Size Input ========== */
    /* ========== Link Text Font Size Input ========== */
    /* ========== Link Text Font Size Input (with same classes as Border Radius) ========== */
    function createLoginLinkTextSizeInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper"; // ✅ same wrapper class

        const label = document.createElement("label");
        label.textContent = "Login Link Text Size (px)";
        label.className = "tb-color-picker-label"; // ✅ same label class

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedSize = themeData["--login-link-text-size"] ||
            getComputedStyle(document.body).getPropertyValue("--login-link-text-size").trim() ||
            "14px";

        storedSize = storedSize.replace("px", "").trim();

        const sizeInput = document.createElement("input");
        sizeInput.type = "number";
        sizeInput.min = 8;
        sizeInput.max = 40;
        sizeInput.value = storedSize;
        sizeInput.className = "tb-color-code"; // ✅ same input class as radius

        function applyLinkTextSize(size) {
            if (!size || isNaN(size)) return;
            const pxSize = size + "px";
            sizeInput.value = size;

            document.body.style.setProperty("--login-link-text-size", pxSize);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-link-text-size"] = pxSize;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        sizeInput.addEventListener("input", () => applyLinkTextSize(sizeInput.value));

        applyLinkTextSize(storedSize);

        wrapper.appendChild(label);
        wrapper.appendChild(sizeInput);

        return wrapper;
    }

    // Create Heading Controls
    function createLoginHeadingControls() {
        const wrapper = document.createElement("div");

        // Shared savedThemeObj (only once!)
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Font Size Input ===
        const sizeWrapper = document.createElement("div");
        sizeWrapper.className = "tb-color-picker-wrapper";

        const sizeLabel = document.createElement("label");
        sizeLabel.textContent = "Login Heading Font Size (px)";
        sizeLabel.className = "tb-color-picker-label";

        let storedSize =
            themeData["--login-headline-font-size"] ||
            getComputedStyle(document.body).getPropertyValue("--login-headline-font-size").trim() ||
            "24px";
        let numericSize = parseInt(storedSize, 10) || 24;

        const sizeInput = document.createElement("input");
        sizeInput.type = "number";
        sizeInput.min = 10;
        sizeInput.value = numericSize;
        sizeInput.className = "tb-color-code"; // reuse design

        function applySize(val) {
            const size = `${val}px`;
            document.body.style.setProperty("--login-headline-font-size", size);
            savedThemeObj.themeData["--login-headline-font-size"] = size;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        sizeInput.addEventListener("input", () => {
            const val = parseInt(sizeInput.value, 10);
            if (!isNaN(val)) applySize(val);
        });

        applySize(numericSize);

        sizeWrapper.appendChild(sizeLabel);
        sizeWrapper.appendChild(sizeInput);

        // === Color Picker ===
        const colorWrapper = document.createElement("div");
        colorWrapper.className = "tb-color-picker-wrapper";

        const colorLabel = document.createElement("label");
        colorLabel.textContent = "Login Heading Text Color";
        colorLabel.className = "tb-color-picker-label";

        let storedColor =
            themeData["--login-headline-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-headline-text-color").trim() ||
            "#000000";
        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) storedColor = "#000000";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;
            document.body.style.setProperty("--login-headline-text-color", color);
            savedThemeObj.themeData["--login-headline-text-color"] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        colorInput.addEventListener("input", () => applyColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyColor(val);
        });

        applyColor(storedColor);

        colorWrapper.appendChild(colorLabel);
        colorWrapper.appendChild(colorInput);
        colorWrapper.appendChild(colorCode);

        // === Heading Text Input ===
        const textWrapper = document.createElement("div");
        textWrapper.className = "tb-color-picker-wrapper";

        const textLabel = document.createElement("label");
        textLabel.textContent = "Login Heading Text";
        textLabel.className = "tb-color-picker-label";

        let storedText =
            themeData["--login-headline-text"] ||
            "Sign into your account";

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "tb-logo-input"; // reuse styling
        textInput.value = storedText;

        function applyText(text) {
            // 1️⃣ Apply to CSS variable
            document.body.style.setProperty("--login-headline-text", text);

            // 2️⃣ Apply to actual heading DOM if it exists
            const heading = document.querySelector(".hl_login .hl_login--body .login-card-heading h2");
            if (heading) heading.textContent = text;

            // 3️⃣ Save in localStorage
            savedThemeObj.themeData["--login-headline-text"] = text;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // Save live while typing
        textInput.addEventListener("input", () => {
            applyText(textInput.value.trim());
        });

        // Apply immediately on load
        applyText(storedText);

        textWrapper.appendChild(textLabel);
        textWrapper.appendChild(textInput);

        textWrapper.appendChild(textLabel);
        textWrapper.appendChild(textInput);

        // Put them together
        wrapper.appendChild(sizeWrapper);
        wrapper.appendChild(colorWrapper);
        wrapper.appendChild(textWrapper);

        return wrapper;
    }

    // Usage

    function createLoginLogoInput(labelText, cssVar) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper"; // you can reuse wrapper style

        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "tb-color-picker-label";
        wrapper.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Paste logo URL here";
        input.className = "tb-logo-input";

        // Load saved value from userTheme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        const savedLogo = themeData[cssVar] ? themeData[cssVar].replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : '';
        input.value = savedLogo;

        // Update CSS variable on input change
        input.addEventListener("input", () => {
            const url = input.value.trim();
            const value = url ? `url(${url})` : "";
            document.body.style.setProperty(cssVar, value);

            // Save to localStorage
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        });

        wrapper.appendChild(input);
        return wrapper;
    }
    function buildHeaderControlsSection(container) {
        const section = document.createElement("div");
        section.className = "tb-controls-section";

        // === Section Title ===
        const header = document.createElement("h4");
        header.className = "tb-header-controls";
        header.textContent = "Header Gradient Color";
        section.appendChild(header);

        // === Gradient Controls Wrapper ===
        const gradientWrapper = document.createElement("div");
        gradientWrapper.className = "tb-gradient-controls";

        // === Load saved state ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        const headerEl = document.querySelector(".hl_header");

        // === Update Gradient Preview ===
        function updateGradientPreview() {
            if (!headerEl || !startPicker || !endPicker) return;

            const start = startPicker.input.value;
            const end = endPicker.input.value;

            const stop = 0;
            const angle = 90;

            const gradient = `linear-gradient(${angle}deg, ${start} ${stop}%, ${end} 100%)`;

            // Update CSS vars
            document.body.style.setProperty("--header-gradient-start", start);
            document.body.style.setProperty("--header-gradient-end", end);
            document.body.style.setProperty("--header-gradient-stop", stop + "%");
            document.body.style.setProperty("--header-gradient-angle", angle + "deg");
            document.body.style.setProperty("--header-main-bg-gradient", gradient);

            // Apply live
            headerEl.style.setProperty("background", "none", "important");
            headerEl.style.setProperty("background-image", "var(--header-main-bg-gradient)", "important");
        }

        // Color picker helper
        function makePicker(labelText, cssVar, fallback = "#007bff") {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            // 1️⃣ Load initial color
            let initial =
                themeData[cssVar] ||
                getComputedStyle(document.body).getPropertyValue(cssVar).trim() ||
                fallback;

            if (!/^#[0-9A-F]{6}$/i.test(initial)) {
                initial = fallback;
            }

            // 🎨 Color input
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";
            colorInput.value = initial;

            // 🔹 Editable text input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            // ✅ Apply color function
            function applyColor(color) {
                if (!/^#[0-9A-F]{6}$/i.test(color)) return;

                colorInput.value = color;
                colorCode.value = color;

                document.body.style.setProperty(cssVar, color);

                // Save in localStorage
                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[cssVar] = color;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                updateGradientPreview();
            }

            // Events
            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            // Initial apply AFTER both pickers exist
            setTimeout(() => applyColor(initial), 0);

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return { wrapper, input: colorInput, code: colorCode };
        }

        // === Create Inputs ===
        const startPicker = makePicker("Choose Start Color For Header", "--header-gradient-start", "#ff0000");
        const endPicker = makePicker("Choose End Color For Header", "--header-gradient-end", "#0000ff");

        // Append only color pickers
        gradientWrapper.appendChild(startPicker.wrapper);
        gradientWrapper.appendChild(endPicker.wrapper);

        // === Instruction Comment ===
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "💡 For Flat Color in Header: Choose the same color for Start & End";
        gradientWrapper.appendChild(instruction);

        section.appendChild(gradientWrapper);

        // Initial Preview
        updateGradientPreview();

        container.appendChild(section);
        return section;
    }

    function buildProfileButtonControls(section) {
        const profileWrapper = document.createElement("div");
        profileWrapper.className = "tb-profile-btn-controls";

        const title = document.createElement("h4");
        title.className = "tb-profile-title";
        title.textContent = "Profile Button Settings";
        profileWrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        const selector = ".container-fluid .hl_header--controls .avatar .avatar_img";

        // helper: inject isolated CSS for profile button only
        function setImportantStyle(id, rule) {
            let styleTag = document.getElementById("style-" + id);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "style-" + id;
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = rule;
        }

        // helper: color picker with input for hex
        function makePicker(labelText, key, fallback, applyFn) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            if (!/^#[0-9A-F]{6}$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            // Apply color helper
            function applyColor(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                colorInput.value = val;
                colorCode.value = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                applyFn(val);
            }

            // Initial apply
            applyColor(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return wrapper;
        }

        // === Icon Color ===
        profileWrapper.appendChild(
            makePicker("Icon Color", "profile-icon-color", "#8d4e4e", (val) => {
                setImportantStyle(
                    "profile-icon-color",
                    `${selector} { color: ${val} !important; }`
                );
            })
        );

        // === Icon Hover Color ===
        profileWrapper.appendChild(
            makePicker("Icon Hover Color", "profile-icon-hover", "#aa6666", (val) => {
                setImportantStyle(
                    "profile-icon-hover",
                    `${selector}:hover { color: ${val} !important; }`
                );
            })
        );

        // === Background Color ===
        profileWrapper.appendChild(
            makePicker("Background Color", "profile-bg-color", "#344391", (val) => {
                setImportantStyle(
                    "profile-bg-color",
                    `${selector} { background-color: ${val} !important; }`
                );
            })
        );

        // === Background Hover Color ===
        profileWrapper.appendChild(
            makePicker("Background Hover Color", "profile-bg-hover", "#1f2c66", (val) => {
                setImportantStyle(
                    "profile-bg-hover",
                    `${selector}:hover { background-color: ${val} !important; }`
                );
            })
        );

        section.appendChild(profileWrapper);
    }

    function buildHelpButtonControls(section) {
        const helpWrapper = document.createElement("div");
        helpWrapper.className = "tb-help-btn-controls";

        const title = document.createElement("h4");
        title.className = "tb-help-title";
        title.textContent = "Header Button Settings";
        helpWrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // helper: create color picker with editable hex input
        function makePicker(labelText, key, fallback, cssVar) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            if (!/^#[0-9A-F]{6}$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            // Apply color helper
            function applyColor(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                colorInput.value = val;
                colorCode.value = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                document.body.style.setProperty(cssVar, val);
            }

            // Initial apply
            applyColor(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return wrapper;
        }

        // === Icon Color ===
        helpWrapper.appendChild(
            makePicker("Icon Color", "help-icon-color", "#ffffff", "--header-icon-color")
        );

        // === Icon Hover Color ===
        helpWrapper.appendChild(
            makePicker("Icon Hover Color", "help-icon-hover", "#eeeeee", "--header-icon-hover")
        );

        // === Background Color ===
        helpWrapper.appendChild(
            makePicker("Background Color", "help-bg-color", "#188bf6", "--header-icon-bg")
        );

        // === Background Hover Color ===
        helpWrapper.appendChild(
            makePicker("Background Hover Color", "help-bg-hover", "#146cc0", "--header-icon-hover-bg")
        );

        section.appendChild(helpWrapper);
    }

    function addScrollbarSettings(container) {
        if (document.getElementById("tb-scrollbar-settings")) return; // prevent duplicate

        const wrapper = document.createElement("div");
        wrapper.className = "tb-scrollbar-settings";
        wrapper.id = "tb-scrollbar-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-scroll-title";
        title.innerText = "Scrollbar Settings";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        function makePicker(labelText, key, fallback, cssVar, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;

                let finalVal = val;
                if (transparent20) {
                    const bigint = parseInt(val.slice(1), 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
                    finalVal = `rgba(${r}, ${g}, ${b}, 0.2)`;
                }

                // Apply to CSS variable
                document.body.style.setProperty(skey, finalVal);
                saveVar(skey, finalVal);

                // Sync both inputs
                colorInput.value = val;
                colorCode.value = val;

                // Special case for card header gradient
                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    const start = themeData["--card-header-gradient-start"] || "#344391";
                    const end = themeData["--card-header-gradient-end"] || "#1f2c66";
                    const gradient = `linear-gradient(90deg, ${start}, ${end})`;
                    document.body.style.setProperty("--card-header-bg-gradient", gradient);
                    themeData["--card-header-bg-gradient"] = gradient;
                    localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
                }
            }

            applyValue(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyValue(val);
                }
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(colorCode);

            return wrapperDiv;
        }

        function makeNumberInput(labelText, cssVar, fallback, min, max) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-scroll-input";
            input.min = min;
            input.max = max;

            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || fallback;
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || parseInt(fallback, 10);
            input.value = initialNumber;

            const code = document.createElement("span");
            code.className = "tb-number-code";
            code.textContent = initialNumber + "px";

            document.body.style.setProperty(cssVar, initialNumber + "px");

            input.addEventListener("input", () => {
                const val = (input.value || initialNumber) + "px";
                code.textContent = val;
                saveVar(cssVar, val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            return wrapperDiv;
        }

        const controls = document.createElement("div");
        controls.className = "tb-scrollbar-controls";
        wrapper.appendChild(controls);

        controls.appendChild(makePicker("Scrollbar Color", "scroll-color", "#344391", "--scroll-color"));
        //controls.appendChild(makeNumberInput("Scrollbar Width (px)", "--scroll-width", "7px", 2, 30));

        Object.keys(themeData).forEach(k => {
            try { document.body.style.setProperty(k, themeData[k]); } catch (e) { }
        });

        container.appendChild(wrapper);
    }


    function addDashboardCardSettings(container) {
        if (document.getElementById("tb-dashboard-card-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-dashboard-card-settings";
        wrapper.id = "tb-dashboard-card-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-dashbaord-title";
        title.innerText = "Dashboard Cards Settings";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        function updateCardGradient() {
            const start = themeData["--card-header-gradient-start"] || "#344391";
            const end = themeData["--card-header-gradient-end"] || "#1f2c66";
            const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

            const styleId = "tb-card-gradient-style";
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `.h1-card-header { background-image: ${gradient} !important; }`;

            saveVar("--card-header-bg-gradient", gradient);
        }

        // === Color Picker helper with synced input ===
        function makePicker(labelText, key, fallback, cssVar, isGradient = false, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const hexInput = document.createElement("input");
            hexInput.type = "text";
            hexInput.className = "tb-color-code";
            hexInput.maxLength = 7;

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            colorInput.value = initial;
            hexInput.value = initial;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;

                let finalVal = val;
                if (transparent20) {
                    const bigint = parseInt(val.slice(1), 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
                    finalVal = `rgba(${r}, ${g}, ${b}, 0.2)`;
                }

                document.body.style.setProperty(skey, finalVal);
                saveVar(skey, finalVal);

                // Sync both inputs
                colorInput.value = val;
                hexInput.value = val;

                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    updateCardGradient();
                }
            }

            applyValue(initial);

            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            hexInput.addEventListener("input", () => {
                const val = hexInput.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(hexInput);

            return wrapperDiv;
        }

        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        gradientControls.appendChild(
            makePicker("Card Header Start Color", "card-header-gradient-start", "#344391", "--card-header-gradient-start", true)
        );
        gradientControls.appendChild(
            makePicker("Card Header End Color", "card-header-gradient-end", "#1f2c66", "--card-header-gradient-end", true)
        );
        gradientControls.appendChild(
            makePicker("Card Background", "card-body-bg-color", "#ffffff", "--card-body-bg-color")
        );
        gradientControls.appendChild(
            makePicker("Card Title Font Color", "card-title-font-color", "#000000", "--card-title-font-color")
        );
        gradientControls.appendChild(
            makePicker("Card Border Color", "card-body-border-color", "#cccccc", "--card-body-border-color")
        );

        // Number inputs (font size, border radius) remain unchanged
        (function addTitleFontSize() {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = "Card Title Font Size (px)";

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-fond-input";
            input.min = 8;
            input.max = 48;

            const cssVar = "--card-title-font-size";
            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || "16px";
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || 16;
            input.value = initialNumber;

            const code = document.createElement("span");
            code.className = "tb-number-code";
            code.textContent = initialNumber + "px";

            document.body.style.setProperty(cssVar, initialNumber + "px");

            input.addEventListener("input", () => {
                const val = (input.value || initialNumber) + "px";
                code.textContent = val;
                saveVar(cssVar, val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            gradientControls.appendChild(wrapperDiv);
        })();

        (function addBorderRadius() {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = "Card Border Radius (px)";

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-radius-input";
            input.min = 0;
            input.max = 50;

            const cssVar = "--card-body-border-radius";
            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || "8px";
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || 8;
            input.value = initialNumber;

            const code = document.createElement("input");
            code.type = "number";
            code.className = "tb-number-code";
            code.value = initialNumber;
            code.min = 0;
            code.max = 50;

            document.body.style.setProperty(cssVar, initialNumber + "px");

            function applyBorderRadius(val) {
                document.body.style.setProperty(cssVar, val + "px");
                saveVar(cssVar, val + "px");
                input.value = val;
                code.value = val;
            }

            input.addEventListener("input", () => applyBorderRadius(input.value));
            code.addEventListener("input", () => applyBorderRadius(code.value));

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            gradientControls.appendChild(wrapperDiv);
        })();

        // Reapply saved vars
        Object.keys(themeData).forEach(k => {
            try {
                document.body.style.setProperty(k, themeData[k]);
            } catch (e) { }
        });

        updateCardGradient();

        container.appendChild(wrapper);
    }

    function addBackgroundGradientSettings(container) {
        if (document.getElementById("tb-bg-gradient-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-bg-gradient-settings";
        wrapper.id = "tb-bg-gradient-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-background-title";
        title.innerText = "Background Color";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        function makePicker(labelText, cssVar, fallback) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const hexInput = document.createElement("input");
            hexInput.type = "text";
            hexInput.className = "tb-color-code";
            hexInput.maxLength = 7;

            let initial = (themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || fallback).trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            colorInput.value = initial;
            hexInput.value = initial;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                saveVar(cssVar, val);
                colorInput.value = val;
                hexInput.value = val;
                updateGradient();
            }

            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            hexInput.addEventListener("input", () => {
                const val = hexInput.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(hexInput);

            return wrapperDiv;
        }

        gradientControls.appendChild(makePicker("Background Start Color", "--bg-gradient-start", "#f9fafb"));
        gradientControls.appendChild(makePicker("Background End Color", "--bg-gradient-end", "#e5e7eb"));

        function updateGradient() {
            const start = themeData["--bg-gradient-start"] || "#f9fafb";
            const end = themeData["--bg-gradient-end"] || "#e5e7eb";
            const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

            const styleId = "tb-bg-gradient-style";
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `
          .bg-gray-50 { background: ${gradient} !important; }
          .bg-gray-100 { background: ${gradient} !important; }
      `;

            saveVar("--bg-gradient", gradient);
        }

        updateGradient();

        container.appendChild(wrapper);
    }

    function buildHeadingSettings(container) {
        // Wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "tb-heading-settings";

        // Section title
        const title = document.createElement("h4");
        title.className = "tb-section-dashbaord-title";
        title.innerText = "Heading — Settings";
        wrapper.appendChild(title);

        // Tabs
        const tabs = document.createElement("div");
        tabs.className = "tb-heading-tabs";

        const tabH1 = document.createElement("button");
        tabH1.className = "tb-heading-tab active";
        tabH1.innerText = "Heading (h1)";
        tabH1.dataset.target = "h1-settings";

        const tabH2 = document.createElement("button");
        tabH2.className = "tb-heading-tab";
        tabH2.innerText = "Heading (h2)";
        tabH2.dataset.target = "h2-settings";

        tabs.appendChild(tabH1);
        tabs.appendChild(tabH2);
        wrapper.appendChild(tabs);

        // --- H1 Settings ---
        const h1Settings = document.createElement("div");
        h1Settings.className = "tb-heading-content active";
        h1Settings.id = "h1-settings";

        // H1 Color
        const h1ColorRow = document.createElement("div");
        h1ColorRow.className = "tb-input-row";
        h1ColorRow.innerHTML = `
        <label>Color:</label>
        <input type="color" id="h1-color" value="#111111">
        <input type="text" id="h1-color-code" value="#111111" readonly>
    `;
        h1Settings.appendChild(h1ColorRow);

        // H1 Size
        const h1SizeRow = document.createElement("div");
        h1SizeRow.className = "tb-input-row";
        h1SizeRow.innerHTML = `
        <label>Size:</label>
        <input type="number" id="h1-size" value="22" min="10" max="72">
        <span>px</span>
    `;
        h1Settings.appendChild(h1SizeRow);

        wrapper.appendChild(h1Settings);

        // --- H2 Settings ---
        const h2Settings = document.createElement("div");
        h2Settings.className = "tb-heading-content";
        h2Settings.id = "h2-settings";

        // H2 Color
        const h2ColorRow = document.createElement("div");
        h2ColorRow.className = "tb-input-row";
        h2ColorRow.innerHTML = `
        <label>Color:</label>
        <input type="color" id="h2-color" value="#111111">
        <input type="text" id="h2-color-code" value="#111111" readonly>
    `;
        h2Settings.appendChild(h2ColorRow);

        // H2 Size
        const h2SizeRow = document.createElement("div");
        h2SizeRow.className = "tb-input-row";
        h2SizeRow.innerHTML = `
        <label>Size:</label>
        <input type="number" id="h2-size" value="18" min="10" max="60">
        <span>px</span>
    `;
        h2Settings.appendChild(h2SizeRow);

        wrapper.appendChild(h2Settings);

        // Append wrapper to container
        container.appendChild(wrapper);

        // --- Tab switching logic ---
        [tabH1, tabH2].forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".tb-heading-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".tb-heading-content").forEach(c => c.classList.remove("active"));

                tab.classList.add("active");
                document.getElementById(tab.dataset.target).classList.add("active");
            });
        });

        // --- Live update logic ---

        // H1 Color
        const h1ColorInput = wrapper.querySelector("#h1-color");
        const h1ColorCode = wrapper.querySelector("#h1-color-code");
        h1ColorInput.addEventListener("input", () => {
            h1ColorCode.value = h1ColorInput.value;
            document.querySelectorAll(".hl-display-sm-medium").forEach(el => {
                el.style.color = h1ColorInput.value;
            });
        });

        // H1 Size
        const h1SizeInput = wrapper.querySelector("#h1-size");
        h1SizeInput.addEventListener("input", () => {
            document.querySelectorAll(".hl-display-sm-medium").forEach(el => {
                el.style.fontSize = h1SizeInput.value + "px";
            });
        });

        // H2 Color
        const h2ColorInput = wrapper.querySelector("#h2-color");
        const h2ColorCode = wrapper.querySelector("#h2-color-code");
        h2ColorInput.addEventListener("input", () => {
            h2ColorCode.value = h2ColorInput.value;
            document.querySelectorAll("h2").forEach(el => {
                el.style.color = h2ColorInput.value;
            });
        });

        // H2 Size
        const h2SizeInput = wrapper.querySelector("#h2-size");
        h2SizeInput.addEventListener("input", () => {
            document.querySelectorAll("h2").forEach(el => {
                el.style.fontSize = h2SizeInput.value + "px";
            });
        });
    }
    function addSidebarMenuSettings(container) {
        if (document.getElementById("tb-sidebar-menu-settings")) return;

        // === Wrapper ===
        const wrapper = document.createElement("div");
        wrapper.className = "tb-sidebar-menu-settings";
        wrapper.id = "tb-sidebar-menu-settings";
        wrapper.style.marginTop = "16px";

        // === Title ===
        const title = document.createElement("h4");
        title.className = "tb-sidebar-title";
        title.innerText = "Sidebar Menu Settings";
        wrapper.appendChild(title);

        // === Saved Theme Data ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const menuSettings = savedThemeObj.menuSettings || {};

        // === Helpers ===
        function saveMenuSetting(menuId, key, value) {
            savedThemeObj.menuSettings = savedThemeObj.menuSettings || {};
            savedThemeObj.menuSettings[menuId] = savedThemeObj.menuSettings[menuId] || {};
            savedThemeObj.menuSettings[menuId][key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // === MAIN APPLY FUNCTION (fixed) ===
        function applyMenuSettings() {
            const sidebarMenus = document.querySelectorAll(".hl_nav-header a");

            sidebarMenus.forEach(menu => {
                const menuId = menu.id || menu.getAttribute("meta") || menu.href;
                const savedData = (savedThemeObj.menuSettings && savedThemeObj.menuSettings[menuId]) || {};

                // === Apply title ===
                let customTitle = menu.querySelector(".tb-custom-title");
                if (!customTitle) {
                    customTitle = document.createElement("span");
                    customTitle.className = "tb-custom-title";
                    customTitle.style.marginLeft = "4px";
                    menu.appendChild(customTitle);
                }
                if (savedData.title) {
                    customTitle.textContent = savedData.title;
                } else {
                    customTitle.textContent = ""; // clear if empty
                }

                // === Apply icon ===
                let customIcon = menu.querySelector(".tb-custom-icon");
                if (!customIcon && savedData.icon) {
                    customIcon = makeFontAwesomeIcon(savedData.icon);
                    customIcon.classList.add("tb-custom-icon");
                    menu.insertBefore(customIcon, menu.firstChild);
                } else if (customIcon) {
                    if (savedData.icon) {
                        customIcon.querySelector("i").className = savedData.icon;
                    } else {
                        customIcon.remove();
                    }
                }
            });
        }

        // === Get All Sidebar Menus (build UI) ===
        const sidebarMenus = document.querySelectorAll(".hl_nav-header a");
        console.log("Sidebar menus found:", sidebarMenus.length);

        sidebarMenus.forEach(menu => {
            const menuId = menu.id || menu.getAttribute("meta") || menu.href;
            const menuLabel = menu.querySelector(".nav-title, .nav-title span");
            const savedData = menuSettings[menuId] || {};

            // === Each Menu Setting Row ===
            const row = document.createElement("div");
            row.className = "tb-sidebar-menu-row";

            // Label (static)
            const label = document.createElement("span");
            label.className = "tb-sidebar-menu-label";
            label.textContent = menuLabel ? menuLabel.innerText.trim() : menuId;
            row.appendChild(label);

            // Title Input
            const titleInput = document.createElement("input");
            titleInput.type = "text";
            titleInput.className = "tb-sidebar-title-input";
            titleInput.value = savedData.title || (menuLabel ? menuLabel.innerText.trim() : "");
            titleInput.placeholder = "Enter menu name";
            titleInput.addEventListener("input", () => {
                saveMenuSetting(menuId, "title", titleInput.value);
                applyMenuSettings(); // now correctly calls the real function
            });
            row.appendChild(titleInput);

            // Icon Input
            const iconInput = document.createElement("input");
            iconInput.type = "text";
            iconInput.className = "tb-sidebar-icon-input";
            iconInput.value = savedData.icon || "";
            iconInput.placeholder = "FontAwesome class (e.g. fas fa-home)";
            iconInput.addEventListener("input", () => {
                saveMenuSetting(menuId, "icon", iconInput.value);
                applyMenuSettings();
            });
            row.appendChild(iconInput);

            wrapper.appendChild(row);
        });

        container.appendChild(wrapper);

        // === Observer to keep settings applied ===
        const sidebar = document.querySelector(".hl_nav-header");
        if (sidebar) {
            const observer = new MutationObserver(() => applyMenuSettings());
            observer.observe(sidebar, { childList: true, subtree: true });
        }

        // Initial apply
        applyMenuSettings();

        // === Helper: Make FA Icon ===
        function makeFontAwesomeIcon(iconClass) {
            if (!iconClass) return null;
            const span = document.createElement("span");
            span.className = "h-5 w-5 mr-2 flex items-center justify-center";
            const i = document.createElement("i");
            i.className = iconClass;
            span.appendChild(i);
            return span;
        }
    }

    // ✅ Your existing observer (don’t change this)
    function waitForSidebarMenus(callback) {
        const observer = new MutationObserver(() => {
            if (document.querySelectorAll(".hl_nav-header a").length > 0) {
                observer.disconnect();
                callback();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function buildFeatureLockSection(container) {
        if (document.getElementById("tb-feature-lock-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-feature-lock-settings";
        wrapper.className = "tb-feature-lock-settings";


        // ✅ Load saved theme + locked menus from themeData
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const lockedMenus = themeData.lockedMenus || {};

        // Wait until sidebar menus are loaded
        waitForSidebarMenus(() => {
            const sidebarMenus = document.querySelectorAll(".hl_nav-header a");
            console.log("[FeatureLock] Sidebar menus found:", sidebarMenus.length);

            sidebarMenus.forEach(menu => {
                const menuId = menu.id || menu.getAttribute("meta") || menu.href;
                const labelText = menu.querySelector(".nav-title, .nav-title span")?.innerText.trim() || menuId;

                const row = document.createElement("div");
                row.className = "tb-feature-row";
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.justifyContent = "space-between";
                row.style.marginBottom = "8px";

                const label = document.createElement("span");
                label.textContent = labelText;
                label.style.flex = "1";
                label.style.fontSize = "14px";

                // Toggle
                const toggleWrapper = document.createElement("div");
                toggleWrapper.className = "toggle-switch";

                const toggleInput = document.createElement("input");
                toggleInput.type = "checkbox";
                toggleInput.className = "toggle-input";
                toggleInput.id = "lock-" + menuId;
                toggleInput.checked = !!lockedMenus[menuId];

                const toggleLabel = document.createElement("label");
                toggleLabel.className = "toggle-label";
                toggleLabel.setAttribute("for", "lock-" + menuId);

                toggleWrapper.appendChild(toggleInput);
                toggleWrapper.appendChild(toggleLabel);

                // ✅ Save lock state inside themeData
                toggleInput.addEventListener("change", () => {
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData = saved.themeData || {};

                    // Parse or create lockedMenus
                    const lockedMenus = saved.themeData["--lockedMenus"]
                        ? JSON.parse(saved.themeData["--lockedMenus"])
                        : {};

                    if (toggleInput.checked) {
                        lockedMenus[menuId] = true;
                    } else {
                        delete lockedMenus[menuId];
                    }

                    // Save as string in localStorage for persistence
                    saved.themeData["--lockedMenus"] = JSON.stringify(lockedMenus);

                    localStorage.setItem("userTheme", JSON.stringify(saved));

                    // Apply lock immediately
                    applyLockedMenus();
                });

                row.appendChild(label);
                row.appendChild(toggleWrapper);
                wrapper.appendChild(row);
            });

            container.appendChild(wrapper);
            applyLockedMenus(); // apply immediately
        });
    }

    // Renders toggle UI once menus are available
    // ✅ Apply menu locks
    function applyLockedMenus() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const lockedMenus = themeData["--lockedMenus"]
            ? JSON.parse(themeData["--lockedMenus"])
            : {};

        const sidebarMenus = document.querySelectorAll(".hl_nav-header a");

        sidebarMenus.forEach(menu => {
            const menuId = menu.id || menu.getAttribute("meta") || menu.href;
            //<i class="fa-light fa-rocket"></i>
            // Remove previous locks
            menu.classList.remove("tb-locked-menu");
            menu.querySelector(".tb-lock-icon")?.remove();
            menu.removeEventListener("click", blockMenuClick, true);

            if (lockedMenus[menuId]) {
                menu.classList.add("tb-locked-menu");

                if (!menu.querySelector(".tb-lock-icon")) {
                    const lockIcon = document.createElement("i");
                    lockIcon.className = "tb-lock-icon fas fa-lock ml-2 text-red-500";
                    menu.appendChild(lockIcon);
                }

                menu.addEventListener("click", blockMenuClick, true);
            }
        });

        // Sync toggle inputs
        document.querySelectorAll(".toggle-input").forEach(toggle => {
            const id = toggle.id.replace("lock-", "");
            toggle.checked = !!lockedMenus[id];
        });
    }
    // Helper for blocking click
    function blockMenuClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // If popup already exists, remove it
        document.getElementById("tb-lock-popup")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-lock-popup";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.style.backdropFilter = "blur(3px)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "99999";

        const popup = document.createElement("div");
        popup.style.background = "#fff";
        popup.style.padding = "20px 30px";
        popup.style.borderRadius = "12px";
        popup.style.maxWidth = "400px";
        popup.style.textAlign = "center";
        popup.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

        const title = document.createElement("h3");
        title.textContent = "Access Denied";
        title.style.marginBottom = "12px";

        const msg = document.createElement("p");
        msg.textContent = "No access. Please contact the Owner.";
        msg.style.marginBottom = "20px";

        const okBtn = document.createElement("button");
        okBtn.textContent = "OK";
        okBtn.style.padding = "8px 20px";
        okBtn.style.border = "none";
        okBtn.style.borderRadius = "6px";
        okBtn.style.background = "#F54927";
        okBtn.style.color = "#fff";
        okBtn.style.cursor = "pointer";

        okBtn.addEventListener("click", () => overlay.remove());

        popup.appendChild(title);
        popup.appendChild(msg);
        popup.appendChild(okBtn);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }
    // ---------------- Build Menu Customizer UI ----------------
    function buildMenuCustomizationSection(container) {
        if (document.getElementById("tb-menu-customization")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-menu-customization";
        wrapper.className = "tb-menu-customization";

        const title = document.createElement("h4");
        title.className = "tb-section-dashbaord-title";
        title.innerText = "Side Menu — Customizer";
        wrapper.appendChild(title);

        const separator = document.createElement("hr");
        separator.className = "tb-section-separator";
        wrapper.appendChild(separator);

        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const menuCustomizations = themeData["--menuCustomizations"]
            ? JSON.parse(themeData["--menuCustomizations"])
            : {};

        waitForSidebarMenus(() => {
            const sidebarMenus = document.querySelectorAll(".hl_nav-header a");

            sidebarMenus.forEach(menu => {
                const menuId = menu.id || menu.getAttribute("meta") || menu.href;
                const currentTitle = menu.querySelector(".nav-title")?.innerText.trim() || menuId;

                const row = document.createElement("div");
                row.className = "tb-menu-row";

                const label = document.createElement("span");
                label.textContent = currentTitle;
                label.style.flex = "1";

                // Title Input
                const titleInput = document.createElement("input");
                titleInput.type = "text";
                titleInput.placeholder = "Custom Title";
                titleInput.value = menuCustomizations[menuId]?.title || currentTitle;
                titleInput.className = "tb-input tb-title-input";

                // Icon Input
                const iconInput = document.createElement("input");
                iconInput.type = "text";
                iconInput.placeholder = "fa-solid fa-home or url(...)";
                iconInput.value = menuCustomizations[menuId]?.icon || "";
                iconInput.className = "tb-input tb-icon-input";

                const saveChange = () => {
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData = saved.themeData || {};

                    const customizations = saved.themeData["--menuCustomizations"]
                        ? JSON.parse(saved.themeData["--menuCustomizations"])
                        : {};

                    customizations[menuId] = {
                        title: titleInput.value,
                        icon: iconInput.value
                    };

                    saved.themeData["--menuCustomizations"] = JSON.stringify(customizations);
                    localStorage.setItem("userTheme", JSON.stringify(saved));

                    applyMenuCustomizations();
                };

                titleInput.addEventListener("input", saveChange);
                iconInput.addEventListener("input", saveChange);

                row.appendChild(label);
                row.appendChild(titleInput);
                row.appendChild(iconInput);
                wrapper.appendChild(row);
            });

            container.appendChild(wrapper);
            applyMenuCustomizations();
        });
    }

    // -------------------- Apply Menu Customizations --------------------
    // ---------------- Apply Menu Customizations ----------------
    function applyMenuCustomizations() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const menuCustomizations = themeData["--menuCustomizations"]
            ? JSON.parse(themeData["--menuCustomizations"])
            : {};

        const variableMap = {
            "sb_launchpad": "--launchpad-new-name",
            "sb_dashboard": "--dashboard-new-name",
            "sb_media": "--media-storage-new-name",
            "sb_ai_agents": "--ai-agents-new-name",
            "sb_conversations": "--conversations-new-name",
            "sb_calendars": "--calendars-new-name",
            "sb_contacts": "--contacts-new-name",
            "sb_opportunities": "--opportunities-new-name",
            "sb_payments": "--payments-new-name",
            "sb_marketing": "--marketing-new-name",
            "sb_automation": "--automation-new-name",
            "sb_sites": "--sites-new-name",
            "sb_memberships": "--memberships-new-name",
            "sb_reputation": "--reputation-new-name",
            "sb_reporting": "--reporting-new-name",
            "sb_marketplace": "--app-marketplace-new-name",
            "sb_mobile": "--mobile-app-new-name"
        };

        Object.keys(menuCustomizations).forEach(menuId => {
            const custom = menuCustomizations[menuId];
            const menuEl = document.getElementById(menuId);
            if (!menuEl) return;

            const navTitle = menuEl.querySelector(".nav-title");

            // ---------------- Update Title ----------------
            if (custom.title && navTitle) {
                navTitle.textContent = custom.title;
                const cssVar = variableMap[menuId];
                if (cssVar) {
                    document.documentElement.style.setProperty(cssVar, `"${custom.title}"`);
                }
            }

            // ---------------- Update Icon ----------------
            if (custom.icon && custom.icon.trim() !== "") {
                const navTitle = menuEl.querySelector(".nav-title");

                // ✅ Remove only existing icon for this menu
                menuEl.querySelectorAll("i, img").forEach(el => el.remove());
                menuEl.classList.remove("sidebar-no-icon");

                // ✅ Insert new icon
                if (/^fa-|^fas-|^far-|^fal-|^fab-/.test(custom.icon.trim())) {
                    const iconEl = document.createElement("i");
                    iconEl.className = custom.icon.trim();
                    iconEl.style.marginRight = "8px";
                    if (navTitle) menuEl.insertBefore(iconEl, navTitle);
                    else menuEl.prepend(iconEl);
                } else if (custom.icon.startsWith("url(")) {
                    const iconVar = `--sidebar-menu-icon-${menuId.replace("sb_", "")}`;
                    ["", "-hover", "-active"].forEach(suffix => {
                        document.documentElement.style.setProperty(iconVar + suffix, custom.icon.trim());
                    });
                    menuEl.classList.add("sidebar-no-icon"); // hide pseudo-element if using SVG
                }
            }
        });
    }

    // ---------------- Apply on Page Load ----------------
    window.addEventListener("load", () => {
        waitForSidebarMenus(() => {
            applyLockedMenus(); // optional
            applyMenuCustomizations();
        });
    });

    // Create Builder UI
    function createBuilderUI(controlsContainer) {
        if (!controlsContainer || document.getElementById("hl_header--themebuilder-icon")) return;

        // Theme Builder Icon Button
        const btn = document.createElement("a");
        btn.href = "javascript:void(0);";
        btn.id = "hl_header--themebuilder-icon";
        btn.className = "tb-btn-icon";
        btn.innerHTML = '<span style="font-size:18px;">🖌️</span>';
        initTooltip(btn, "Theme Builder");
        controlsContainer.appendChild(btn);

        // 🔹 Load theme (prefer rlno, fallback to email)
        const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
        const email = localStorage.getItem("userEmail") ? atob(localStorage.getItem("userEmail")) : null;

        if (rlNo) {
            applySavedSettings();
        } else if (email) {
             applySavedSettings();
        }

        if (!document.getElementById('themeBuilderDrawer')) {
            const drawer = document.createElement("div");
            drawer.id = "themeBuilderDrawer";
            drawer.className = "tb-drawer";

            // ===== Title with Close Button =====
            const drawerTitleWrapper = document.createElement('div');
            drawerTitleWrapper.className = "tb-drawer-title-wrapper";

            const title = document.createElement('div');
            title.textContent = "Theme Builder";
            title.className = "tb-title";

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = "tb-drawer-close";

            drawerTitleWrapper.appendChild(title);
            drawerTitleWrapper.appendChild(closeBtn);
            drawer.appendChild(drawerTitleWrapper);

            // ===== Card Wrapper =====
            const cardWrapper = document.createElement('div');
            cardWrapper.className = "tb-drawer-card";

            // Theme Selector
            const themeBtnWrapper = document.createElement("div");
            themeBtnWrapper.className = "tb-theme-btn-wrapper";
            buildThemeSelectorSection(themeBtnWrapper);
            cardWrapper.appendChild(themeBtnWrapper);

            // Content Wrapper (includes sections)
            const contentWrapper = document.createElement('div');
            contentWrapper.className = "tb-drawer-content";

            // Sections
            contentWrapper.appendChild(
                createSection(
                    '<i class="fa-solid fa-gear" style="color:white;margin-right:6px;font-size:17px;"></i> General Settings',
                    (section) => {
                        buildThemeColorsSection(section);
                        buildHeaderControlsSection(section);
                        buildFontFamilySelector(section);
                    },
                    "",
                    true
                )
            );

            contentWrapper.appendChild(


                createSection(
                    '<i class="fa-solid fa-right-to-bracket" style="color:white;margin-right:6px;font-size:17px;"></i> Login Page Settings',
                    (section) => {
                        const header = document.createElement("h4");
                        header.className = "tb-header-controls";
                        header.textContent = "Background Gradient Color";
                        section.appendChild(header);

                        section.appendChild(createLoginGradientPicker());

                        const loginheader = document.createElement("h4");
                        loginheader.className = "tb-header-controls";
                        loginheader.textContent = "Login Card BG Gradient Color";
                        section.appendChild(loginheader);

                        section.appendChild(createLoginCardGradientPicker());

                        const loginbutton = document.createElement("h4");
                        loginbutton.className = "tb-header-controls";
                        loginbutton.textContent = "Login Button Gradient Color";
                        section.appendChild(loginbutton);

                        section.appendChild(createLoginButtonGradientPicker());
                        section.appendChild(createLoginButtonBorderRadiusInput());
                        section.appendChild(createLoginButtonFontColorPicker());
                        // Append these after your other login button settings
                        section.appendChild(createLoginButtonHoverBgColorPicker());
                        section.appendChild(createLoginButtonHoverTextColorPicker());

                        const forgetpass = document.createElement("h4");
                        forgetpass.className = "tb-header-controls";
                        forgetpass.textContent = "Forget Password & Link Text Color";
                        section.appendChild(forgetpass);


                        // Append these after your login button hover settings
                        section.appendChild(createLoginLinkTextColorPicker());
                        section.appendChild(createLoginLinkTextSizeInput());
                        section.appendChild(createLoginLogoInput("Logo URL", "--login-company-logo"));

                        const heading = document.createElement("h4");
                        heading.className = "tb-header-controls";
                        heading.textContent = "Login Card Heading Settings";
                        section.appendChild(heading);

                        section.appendChild(createLoginHeadingControls());

                    },
                    "",
                    true
                )

            );

            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-database"style="color:white;margin-right:6px;font-size:17px;"></i>Advance Settings', (section) => {
                    buildHeaderControlsSection(section);
                    buildProfileButtonControls(section);   // Profile Button Color Controls
                    buildHelpButtonControls(section);   // Profile Button Color Controls
                    addScrollbarSettings(section);   // Profile Button Color Controls
                    addDashboardCardSettings(section)
                    addBackgroundGradientSettings(section)
                    buildHeadingSettings(section)
                    buildMenuCustomizationSection(section)

                    // Add more advanced options later
                }, "", true
                )
            );

            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-lock"style="color:white;margin-right:6px;font-size:17px;"></i>Feature Lock', (section) => {
                    buildFeatureLockSection(section);
                }, "", true
                )
            );

            // Append contentWrapper to card
            cardWrapper.appendChild(contentWrapper);

            // Append cardWrapper to drawer
            drawer.appendChild(cardWrapper);
            function collectThemeVars() {
                const bodyStyle = document.body.style;
                const themeVars = {};
                for (let i = 0; i < bodyStyle.length; i++) {
                    const prop = bodyStyle[i];
                    if (prop.startsWith("--")) {
                        themeVars[prop] = bodyStyle.getPropertyValue(prop).trim();
                    }
                }
                return themeVars;
            }
            const collectMenuCustomizations = () => {
                const menuItems = document.querySelectorAll(".hl_nav-header a");
                const customizations = {};

                menuItems.forEach(menuEl => {
                    const menuId = menuEl.id;
                    if (!menuId) return;

                    // Get title
                    const navTitle = menuEl.querySelector(".nav-title");
                    const title = navTitle ? navTitle.textContent.trim() : "";

                    // Get icon (FontAwesome <i> tag)
                    const iconEl = menuEl.querySelector("i");
                    let icon = "";
                    if (iconEl) {
                        // If user typed full class name
                        icon = iconEl.className.trim();

                        // If using Unicode inside <i>, read innerHTML
                        if (!icon && iconEl.innerHTML.trim()) {
                            icon = iconEl.innerHTML.trim();
                        }
                    }

                    customizations[menuId] = { title, icon };
                });

                return customizations;
            };


            // ===== Apply Button Outside Card =====
            const buttonsWrapper = document.createElement("div");
            buttonsWrapper.className = "tb-buttons-wrapper";

            const applyBtn = document.createElement("button");
            applyBtn.className = "tb-apply-btn";
            applyBtn.innerHTML = `<i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i> Apply Changes`;

            applyBtn.addEventListener("click", () => {
                showJCConfirm(
                    "Do you want to apply these changes? Press Yes to apply & reload the page. Press No to revert.",
                    async () => {
                        try {
                            // 1️⃣ Collect current theme variables safely
                            const themeData = collectThemeVars() || {};
                            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
                            savedTheme.themeData = savedTheme.themeData || {};

                            // Merge collected vars
                            Object.keys(themeData).forEach(key => {
                                savedTheme.themeData[key] = themeData[key];
                            });

                            // Save to localStorage
                            localStorage.setItem("userTheme", JSON.stringify(savedTheme));

                            // Prepare DB payload
                            const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
                            const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;

                            const dbData = {
                                rlNo,
                                email,
                                themeData: savedTheme.themeData,
                                selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                                bodyFont: savedTheme.themeData["--body-font"] || "Arial, sans-serif",
                                updatedAt: new Date().toISOString(),
                            };

                            // 8️⃣ Send to API (non-blocking, errors logged)
                            fetch("https://theme-builder-delta.vercel.app/api/theme", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(dbData),
                            })
                                .then(async (res) => {
                                    const result = await res.json().catch(() => null);
                                    if (!res.ok) {
                                        console.error("[ThemeBuilder] API error:", result);
                                    }
                                })
                                .catch(err => console.error("[ThemeBuilder] Network error:", err));

                            // 9️⃣ Reload page to apply changes
                            location.reload();

                        } catch (err) {
                            console.error("[ThemeBuilder] Error applying theme changes:", err);
                            alert("Something went wrong while applying the theme changes. No data was lost.");
                        }
                    },
                    () => {
                        // Cancel callback: revert safely
                        const savedThemeStr = localStorage.getItem("userTheme");
                        if (savedThemeStr) {
                            const savedTheme = JSON.parse(savedThemeStr).themeData;
                            Object.keys(savedTheme).forEach(varName => {
                                document.body.style.setProperty(varName, savedTheme[varName]);
                            });
                        }
                    }
                );
            });


            buttonsWrapper.appendChild(applyBtn);
            drawer.appendChild(buttonsWrapper); // Outside card
            document.body.appendChild(drawer);

            // ===== Make Draggable =====
            (function makeDraggable(el, handle) {
                let isDragging = false, offsetX = 0, offsetY = 0;

                handle.addEventListener("mousedown", (e) => {
                    isDragging = true;
                    offsetX = e.clientX - el.offsetLeft;
                    offsetY = e.clientY - el.offsetTop;
                    el.style.position = "absolute";
                    el.style.zIndex = 9999;
                    document.body.style.userSelect = "none";
                });

                document.addEventListener("mousemove", (e) => {
                    if (!isDragging) return;
                    el.style.left = (e.clientX - offsetX) + "px";
                    el.style.top = (e.clientY - offsetY) + "px";
                });

                document.addEventListener("mouseup", () => {
                    isDragging = false;
                    document.body.style.userSelect = "";
                });
            })(drawer, drawerTitleWrapper);

            // Drawer toggle
            btn.addEventListener('click', () => {
                drawer.classList.toggle('open');
            });

            closeBtn.addEventListener('click', () => {
                drawer.classList.remove('open');
            });
        }
    }

    // Initialize Theme Builder
    async function initThemeBuilder(attempts = 0) {
        const rlno = localStorage.getItem("rlno");
        const gem = localStorage.getItem("g-em");
        if (!rlno && !gem) {
            if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
            return;
        }

        const controlsContainer = findControlsContainer();
        if (!controlsContainer) {
            if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
            return;
        }

        try {
            const decodedEmail = gem ? atob(gem) : null;
            if (!decodedEmail) {
                console.error("❌ Email not found in localStorage.");
                return;
            }
            const response = await fetch(`https://theme-builder-delta.vercel.app/api/theme/${decodedEmail}`);
            const data = await response.json();
            if (data.success) {
                createBuilderUI(controlsContainer);

                const headerEl = document.querySelector("header.hl_header") || document.querySelector("header");
                if (headerEl && !headerObserver) {
                    headerObserver = new MutationObserver(() => {
                        if (!document.getElementById("hl_header--themebuilder-icon")) {
                            setTimeout(() => initThemeBuilder(0), 200);
                        }
                    });
                    headerObserver.observe(headerEl, { childList: true, subtree: true });
                }
            } else {
                const settingsScript = document.querySelector('script[src*="settings.js"]');
                if (settingsScript) {
                    settingsScript.remove();
                }
            }
        } catch (err) {
            console.error("❌ Error verifying user:", err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => setTimeout(() => initThemeBuilder(0), 50));
    setTimeout(() => initThemeBuilder(0), 50);
})();