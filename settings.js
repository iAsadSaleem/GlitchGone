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
        "--second-color": "Choose Secondary Color",  // ✅ replaced header-bg-color
        "--sidebar-bg-color": "Choose Sidebar BG Color",
        "--sidebar-menu-bg": "Choose Sidebar Menu BG Color",
        "--sidebar-menu-hover-bg": "Choose Menu Hover Color",
        "--sidebar-menu-color": "Choose SideBar Text Color",
        "--sidebar-menu-icon-color": "Choose SideBar Icon Color",
    };

    function createColorPicker(labelText, storageKey, cssVar, applyFn) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        // ✅ Use human-readable label if available
        label.textContent = cssVarLabels[cssVar] || labelText;
        label.className = "tb-color-picker-label";

        // 1️⃣ Load current color from saved themeData or CSS variable
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        let storedColor = themeData[cssVar]
            || getComputedStyle(document.body).getPropertyValue(cssVar).trim()
            || "#007bff"; // fallback

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("span");
        colorCode.className = "tb-color-code";
        colorCode.textContent = storedColor;

        // Copy color code to clipboard on click
        colorCode.addEventListener("click", () => {
            navigator.clipboard.writeText(colorCode.textContent);
            colorCode.style.background = "#c8e6c9";
            setTimeout(() => (colorCode.style.background = "#f0f0f0"), 800);
        });

        // Apply color changes live
        colorInput.addEventListener("input", () => {
            const color = colorInput.value;
            colorCode.textContent = color;

            // Apply to CSS
            if (cssVar) document.body.style.setProperty(cssVar, color);
            if (applyFn) applyFn(color);

            // Save to userTheme.themeData
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

            // Optional: also save separate key if needed
            if (storageKey) localStorage.setItem(storageKey, color);
        });

        // Apply initial color
        if (cssVar) document.body.style.setProperty(cssVar, storedColor);
        if (applyFn) applyFn(storedColor);

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

        // Editable colors
        const editableColors = [
            "--primary-color",
            "--second-color",
            "--sidebar-bg-color",
            "--sidebar-menu-bg",
            "--sidebar-menu-hover-bg",
            "--sidebar-menu-color",
            "--sidebar-menu-icon-color"
        ];

        function updateSidebarGradient() {
            const sidebarColor = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-color").trim() || "#000000";
            const secondColor = getComputedStyle(document.body).getPropertyValue("--second-color").trim() || "#000000";

            const gradient = `linear-gradient(to bottom, ${sidebarColor}, ${secondColor})`;
            document.body.style.setProperty("--sidebar-main-bg-gradient", gradient);
        }

        editableColors.forEach(key => {
            const value = localStorage.getItem(key) || themeData[key] || "#000000";

            const picker = createColorPicker(key, key, key, (val) => {
                // Apply chosen value to CSS variable
                document.body.style.setProperty(key, val);

                // ✅ Special handling for sidebar bg
                if (key === "--sidebar-bg-color") {
                    document.body.style.setProperty("--sidebar-bg-color", val);
                    updateSidebarGradient(); // update gradient when sidebar color changes
                }

                // ✅ Special handling for second color
                if (key === "--second-color") {
                    document.body.style.setProperty("--second-color", val);
                    updateSidebarGradient(); // update gradient when second color changes
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

        // ✅ Ensure it's a valid hex color (not a url(...))
        let storedColor = /^#([0-9A-Fa-f]{3}){1,2}$/.test(storedValue) ? storedValue : "#007bff";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("span");
        colorCode.className = "tb-color-code";
        colorCode.textContent = storedColor;

        // Copy to clipboard
        colorCode.addEventListener("click", () => {
            navigator.clipboard.writeText(colorCode.textContent);
            colorCode.style.background = "#c8e6c9";
            setTimeout(() => (colorCode.style.background = "#f0f0f0"), 800);
        });

        // Apply changes
        colorInput.addEventListener("input", () => {
            const color = colorInput.value;
            colorCode.textContent = color;

            document.body.style.setProperty(cssVar, color);

            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = color; // always hex
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        });

        // Apply initial color
        document.body.style.setProperty(cssVar, storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }
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

        // Color picker helper
        function makePicker(labelText, cssVar, fallback = "#007bff") {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            let initial =
                themeData[cssVar] ||
                getComputedStyle(document.body).getPropertyValue(cssVar).trim() ||
                fallback;

            if (!initial.startsWith("#")) initial = fallback;
            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            input.addEventListener("input", () => {
                code.textContent = input.value;
                updateGradientPreview();
            });

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(code);

            return { wrapper, input };
        }

        // === Load saved state ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Create Inputs ===
        const startPicker = makePicker("Choose Start Color For Header", "--header-gradient-start", "#ff0000");
        const endPicker = makePicker("Choose End Color For Header", "--header-gradient-end", "#0000ff");

        // Append only color pickers (no stop/angle UI now)
        gradientWrapper.appendChild(startPicker.wrapper);
        gradientWrapper.appendChild(endPicker.wrapper);

        // === Instruction Comment ===
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "💡 For Flat Color in Header: Choose the same color for Start & End";
        gradientWrapper.appendChild(instruction);

        section.appendChild(gradientWrapper);

        // === Update Gradient Preview ===
        const headerEl = document.querySelector(".hl_header");

        function updateGradientPreview() {
            if (!headerEl) return;

            const start = startPicker.input.value;
            const end = endPicker.input.value;

            // ✅ Hardcoded stop and angle
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

        // === Event Listeners (only pickers) ===
        [startPicker.input, endPicker.input].forEach((el) =>
            el.addEventListener("input", updateGradientPreview)
        );

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

        // helper: color picker with consistent classes
        function makePicker(labelText, key, fallback, applyFn) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            // Apply initial
            applyFn(initial);

            input.addEventListener("input", () => {
                const val = input.value;
                code.textContent = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                applyFn(val);
            });

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(code);

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

        // helper: create color picker
        function makePicker(labelText, key, fallback, cssVar) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            // Apply immediately
            document.body.style.setProperty(cssVar, initial);

            input.addEventListener("input", () => {
                const val = input.value;
                code.textContent = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                document.body.style.setProperty(cssVar, val);
            });

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(code);

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

        // === Wrapper ===
        const wrapper = document.createElement("div");
        wrapper.className = "tb-scrollbar-settings";
        wrapper.id = "tb-scrollbar-settings";
        wrapper.style.marginTop = "16px";

        // === Title ===
        const title = document.createElement("h4");
        title.className = "tb-section-scroll-title";
        title.innerText = "Scrollbar Settings";
        wrapper.appendChild(title);

        // === Saved Theme Data ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        // helper: normalize storage key
        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        // save helper
        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        // === Color Picker for Scrollbar ===
        // color picker helper
        function makePicker(labelText, key, fallback, cssVar, isGradient = false, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            function applyValue(val) {
                let finalVal = val;
                if (transparent20) {
                    // Convert HEX to RGBA with 0.2 alpha
                    const bigint = parseInt(val.slice(1), 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
                    finalVal = `rgba(${r}, ${g}, ${b}, 0.2)`;
                }
                document.body.style.setProperty(skey, finalVal);
                saveVar(skey, finalVal);
                code.textContent = val; // keep hex visible

                // 🔥 If this is one of the card header gradient colors, rebuild the gradient variable
                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    const start = themeData["--card-header-gradient-start"] || "#344391";
                    const end = themeData["--card-header-gradient-end"] || "#1f2c66";

                    // Build the gradient string
                    const gradient = `linear-gradient(90deg, ${start}, ${end})`;

                    // Apply it to the CSS var that your theme actually uses
                    document.body.style.setProperty("--card-header-bg-gradient", gradient);

                    // (optional) also save it in themeData
                    themeData["--card-header-bg-gradient"] = gradient;
                    localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
                }
            }

            applyValue(initial);

            input.addEventListener("input", () => {
                const val = input.value;
                applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            return wrapperDiv;
        }

        // === Number Input for Scrollbar Width ===
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

            // ✅ Apply to variable (CSS uses it now)
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
        // === Controls ===
        const controls = document.createElement("div");
        controls.className = "tb-scrollbar-controls";
        wrapper.appendChild(controls);

        // Scrollbar Color
        controls.appendChild(makePicker("Scrollbar Color", "scroll-color", "#344391", "--scroll-color"));

        // Scrollbar Width
        controls.appendChild(makeNumberInput("Scrollbar Width (px)", "--scroll-width", "7px", 2, 30));

        // Reapply saved values
        Object.keys(themeData).forEach(k => {
            try {
                document.body.style.setProperty(k, themeData[k]);
            } catch (e) { }
        });

        container.appendChild(wrapper);
    }

    function addDashboardCardSettings(container) {
        if (document.getElementById("tb-dashboard-card-settings")) return;

        // === Wrapper ===
        const wrapper = document.createElement("div");
        wrapper.className = "tb-dashboard-card-settings";
        wrapper.id = "tb-dashboard-card-settings";
        wrapper.style.marginTop = "16px";

        // === Title ===
        const title = document.createElement("h4");
        title.className = "tb-section-dashbaord-title";
        title.innerText = "Dashboard Cards Settings";
        wrapper.appendChild(title);

        // === Saved Theme Data ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        // save helper
        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        // === Gradient updater (ONLY for header) ===
        function updateCardGradient() {
            const start = themeData["--card-header-gradient-start"] || "#344391";
            const end = themeData["--card-header-gradient-end"] || "#1f2c66";
            const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

            // Inject style ONLY for .h1-card-header
            const styleId = "tb-card-gradient-style";
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `
            .h1-card-header {
                background-image: ${gradient} !important;
            }
        `;

            saveVar("--card-header-bg-gradient", gradient);
        }

        // === Color Picker helper ===
        function makePicker(labelText, key, fallback, cssVar, isGradient = false, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            function applyValue(val) {
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
                code.textContent = val;

                // ✅ Only trigger gradient rebuild if this is a header gradient
                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    updateCardGradient();
                }
            }

            applyValue(initial);

            input.addEventListener("input", () => {
                const val = input.value;
                applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            return wrapperDiv;
        }

        // === Controls ===
        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        // Only gradient picks will use updateCardGradient
        gradientControls.appendChild(
            makePicker("Card Header Start Color", "card-header-gradient-start", "#344391", "--card-header-gradient-start", true)
        );
        gradientControls.appendChild(
            makePicker("Card Header End Color", "card-header-gradient-end", "#1f2c66", "--card-header-gradient-end", true)
        );

        // The rest are unchanged (no interference)
        gradientControls.appendChild(
            makePicker("Card Background", "card-body-bg-color", "#ffffff", "--card-body-bg-color", false)
        );
        gradientControls.appendChild(
            makePicker("Card Title Font Color", "card-title-font-color", "#000000", "--card-title-font-color", false)
        );
        //gradientControls.appendChild(
        //    makePicker("Base Selection Color", "n-color", "#0000ff", "--n-color", false, true)
        //);

        // Card Title Font Size
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

        // Card Border Radius
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

        // Card Border Color
        gradientControls.appendChild(
            makePicker("Card Border Color", "card-body-border-color", "#cccccc", "--card-body-border-color", false)
        );

        // Reapply saved vars
        Object.keys(themeData).forEach(k => {
            try {
                document.body.style.setProperty(k, themeData[k]);
            } catch (e) { }
        });

        // ✅ Initial gradient apply (safe)
        updateCardGradient();

        container.appendChild(wrapper);
    }
    function addBackgroundGradientSettings(container) {
        if (document.getElementById("tb-bg-gradient-settings")) return;

        // === Wrapper ===
        const wrapper = document.createElement("div");
        wrapper.className = "tb-bg-gradient-settings";
        wrapper.id = "tb-bg-gradient-settings";
        wrapper.style.marginTop = "16px";

        // === Title ===
        const title = document.createElement("h4");
        title.className = "tb-section-background-title";
        title.innerText = "Background Color";
        wrapper.appendChild(title);

        // === Saved Theme Data ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        // === Gradient Controls ===
        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        // Helper to make color picker
        function makePicker(labelText, cssVar, fallback) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            let initial = (themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || fallback).trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;
            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            input.addEventListener("input", () => {
                const val = input.value;
                code.textContent = val;
                saveVar(cssVar, val);
                updateGradient();
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            return wrapperDiv;
        }

        // Create start & end pickers
        gradientControls.appendChild(makePicker("Background Start Color", "--bg-gradient-start", "#f9fafb"));
        gradientControls.appendChild(makePicker("Background End Color", "--bg-gradient-end", "#e5e7eb"));

        // === Function to update gradient ===
        function updateGradient() {
            const start = themeData["--bg-gradient-start"] || "#f9fafb";
            const end = themeData["--bg-gradient-end"] || "#e5e7eb";
            const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

            // apply to .bg-gray-50 and .bg-gray-100
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

        // Initial apply
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
                createSection('<i class="fa-solid fa-right-to-bracket" style="color:white;margin-right:6px;font-size:17px;"></i> Login Page Settings', (section) => {
                    section.appendChild(createLoginColorPicker("Login Card BG Gradient", "--login-card-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Link Text Color", "--login-link-text-color"));
                    section.appendChild(createLoginColorPicker("Login Button BG Gradient", "--login-button-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Button BG Color", "--login-button-bg-color"));
                    section.appendChild(createLoginColorPicker("Login Card Backgroud Color", "--login-card-bg-color"));
                    section.appendChild(createLoginLogoInput("Logo URL", "--login-company-logo"));
                }, "",true)
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

                            // 2️⃣ Preserve existing saved theme
                            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");

                            // 3️⃣ Preserve lockedMenus safely
                            const lockedMenus = savedTheme.themeData?.["--lockedMenus"]
                                ? JSON.parse(savedTheme.themeData["--lockedMenus"])
                                : {};
                            themeData["--lockedMenus"] = JSON.stringify(lockedMenus);

                            // 4️⃣ Collect menu customizations (title + icon)
                            const menuCustomizations = collectMenuCustomizations();
                            themeData["--menuCustomizations"] = JSON.stringify(menuCustomizations);

                            // 5️⃣ Save to localStorage
                            localStorage.setItem("userTheme", JSON.stringify({ ...savedTheme, themeData }));

                            // 6️⃣ Prepare DB payload
                            const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
                            const email = localStorage.getItem("userEmail") ? atob(localStorage.getItem("userEmail")) : null;

                            const dbData = {
                                rlNo,
                                email,
                                themeData,
                                selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                                bodyFont: themeData["--body-font"] || "Arial, sans-serif",
                                updatedAt: new Date().toISOString(),
                            };

                            // 7️⃣ Send to API (non-blocking, errors logged)
                            fetch("https://theme-builder-delta.vercel.app/api/theme", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(dbData),
                            })
                                .then(res => {
                                    if (!res.ok) {
                                        res.json().then(result => console.error("[ThemeBuilder] API error:", result));
                                    }
                                })
                                .catch(err => console.error("[ThemeBuilder] Network error:", err));

                            // 8️⃣ Reload page to apply changes
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
    const email = localStorage.getItem("userEmail");

    if (!rlno && !email) {
        if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
        return;
    }

    const controlsContainer = findControlsContainer();
    if (!controlsContainer) {
        if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
        return;
    }

    try {
        const response = await fetch(`https://theme-builder-delta.vercel.app/api/theme/${email}`);
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
        }
    } catch (err) {
        console.error("❌ Error verifying user:", err);
    }
}

    document.addEventListener('DOMContentLoaded', () => setTimeout(() => initThemeBuilder(0), 50));
    setTimeout(() => initThemeBuilder(0), 50);
})();