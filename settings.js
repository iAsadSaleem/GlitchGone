(function () {
    const DEBUG = true;
    const log = (...args) => { if (DEBUG) console.log('[ThemeBuilder]', ...args); };

    const allowedKeys = [btoa("0-373-489")];
    const MAX_ATTEMPTS = 40;

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

    // NEW: Fetch user theme from DB and apply
    async function loadUserThemeFromDB(rlNo) {
        try {
            const res = await fetch(`https://theme-builder-delta.vercel.app/api/theme/${rlNo}`);
            if (!res.ok) throw new Error('Failed to fetch theme');

            const theme = await res.json(); // API returns the theme object directly

            // Only apply if isActive is true
            if (!theme.isActive) {
                return;
            }

            // Apply theme colors to CSS variables
            document.body.style.setProperty("--primary-color", theme.primaryColor || "#007bff");
            document.body.style.setProperty("--primary-bg-color", theme.primaryBgColor || "#ffffff");
            document.body.style.setProperty("--sidebar-bg-color", theme.sidebarBgColor || "#f0f0f0");
            document.body.style.setProperty("--sidebar-menu-bg", theme.sidebarTabsBgColor || "#cccccc");
            document.body.style.setProperty("--sidebar-menu-color", theme.sidebarTabsTextColor || "#333333");
            document.body.style.setProperty("--body-font", theme.bodyFont);

            // Optional: Dark and second color based on sidebar active bg
            if (theme.sidebarTabsBgColor) {
                document.body.style.setProperty("--dark-color", theme.sidebarTabsBgColor);
                document.body.style.setProperty("--second-color", theme.sidebarTabsBgColor);
            }

            // Save theme colors in localStorage
            localStorage.setItem("primaryColor", theme.primaryColor);
            localStorage.setItem("primaryBgColor", theme.primaryBgColor);
            localStorage.setItem("sidebarBgColor", theme.sidebarBgColor);
            localStorage.setItem("sidebarTabsBgColor", theme.sidebarTabsBgColor);
            localStorage.setItem("sidebarTabsTextColor", theme.sidebarTabsTextColor);
            localStorage.setItem("selectedTheme", theme.selectedTheme || "Default");
            localStorage.setItem("bodyFont", theme.bodyFont);

        } catch (err) {
            console.error("[ThemeBuilder] Failed to load user theme:", err);
        }
    }

    // Create collapsible sections
    // Utility to create section with optional icon
    function createSection(title, contentBuilder, icon = null) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";

        // If an icon is provided, add it
        if (icon) {
            const iconEl = document.createElement("span");
            iconEl.className = "tb-section-icon";
            iconEl.innerHTML = icon; // emoji or HTML icon
            iconEl.style.marginRight = "6px";
            header.appendChild(iconEl);
        }

        const titleText = document.createElement("span");
        titleText.textContent = title;
        header.appendChild(titleText);

        const content = document.createElement("div");
        content.className = "tb-section-content";

        header.addEventListener("click", () => {
            const drawer = header.closest(".tb-drawer-content");

            // Close all other sections
            drawer.querySelectorAll(".tb-section-content.open").forEach(openContent => {
                if (openContent !== content) {
                    openContent.classList.remove("open");
                    openContent.style.maxHeight = null;
                    openContent.style.overflowY = null;
                }
            });

            // Toggle the clicked section
            content.classList.toggle("open");
            if (content.classList.contains("open")) {
                content.style.maxHeight = "200px"; // adjust if needed
                content.style.overflowY = "auto";
            } else {
                content.style.maxHeight = null;
                content.style.overflowY = null;
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
    function createColorPicker(labelText, storageKey, cssVar, applyFn) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "tb-color-picker-label";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = localStorage.getItem(storageKey) || "#007bff";
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("span");
        colorCode.className = "tb-color-code";
        colorCode.textContent = colorInput.value;

        colorCode.addEventListener("click", () => {
            navigator.clipboard.writeText(colorCode.textContent).then(() => {
                colorCode.style.background = "#c8e6c9";
                setTimeout(() => (colorCode.style.background = "#f0f0f0"), 800);
            });
        });

        colorInput.addEventListener("input", () => {
            const color = colorInput.value;
            colorCode.textContent = color;
            localStorage.setItem(storageKey, color);
            if (cssVar) document.body.style.setProperty(cssVar, color);
            if (applyFn) applyFn(color);
        });

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
        const themeBtn = document.createElement("button");
        themeBtn.textContent = "Select Theme";
        themeBtn.className = "tb-theme-cycle-btn";

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
                "--primary-color": "#2563eb",          /* Bright blue */
                "--second-color": "#3b82f6",           /* Softer blue */
                "--dark-color": "#1e3a8a",             /* Deep navy for contrast */
                "--grey-color": "#f9fafb",             /* Light grey background */
                "--alert-color": "#dc2626",            /* Red for alerts */
                "--app-bg-color": "#ffffff",           /* Pure white app background */
                "--Acent-color": "#1d4ed8",            /* Strong accent blue */

                /* Sidebar */
                "--sidebar-bg-color": "#1e40af",       /* Deep sidebar blue */
                "--sidebar-menu-bg": "#2563eb",        /* Menu background */
                "--sidebar-menu-color": "#ffffff",     /* Menu text */
                "--sidebar-menu-hover-bg": "#1d4ed8",  /* Hover state */
                "--sidebar-menu-active-bg": "#1e3a8a", /* Active item */
                "--sidebar-menu-icon-color": "#e0f2fe",
                "--sidebar-menu-icon-hover-color": "#bae6fd",
                "--sidebar-menu-icon-active-color": "#60a5fa",
                "--scroll-color":"#2563eb",

                /* Header */
                "--header-bg-color": "#1e40af",
                "--header-icon-color": "#ffffff",
                "--header-icon-hover-color": "#dbeafe",
                "--header-icon-bg": "#2563eb",
                "--header-icon-hover-bg": "#1e3a8a",

                /* Cards */
                "--card-body-bg-color": "#f0f9ff",     /* Soft blue-white bg */
                "--card-body-font-color": "#1e293b",   /* Dark text */
                "--card-title-font-color": "#0f172a",  /* Stronger title */
                "--card-dec-font-color": "#334155",    /* Grey for description */
                "--card-footer-bg-color": "#e0f2fe",   /* Light blue footer */
                "--card-footer-font-color": "#1e3a8a", /* Footer text */

                /* Top Navigation */
                "--top-nav-menu-bg": "#2563eb",
                "--top-nav-menu-hover-bg": "#1d4ed8",
                "--top-nav-menu-active-bg": "#1e3a8a",
                "--top-nav-menu-color": "#ffffff",
                "--top-nav-menu-hover-color": "#bae6fd",
                "--top-nav-menu-active-color": "#ffffff"
            },
            "IndigoPurple Theme": {
                "--primary-color": "#3B38A0",          /* Strong indigo */
                "--second-color": "#7A85C1",           /* Softer purple-blue */
                "--dark-color": "#1A2A80",             /* Deep navy base */
                "--grey-color": "#f9fafb",             /* Light grey background */
                "--alert-color": "#e11d48",            /* Pinkish red for alerts */
                "--app-bg-color": "#ffffff",           /* White app background */
                "--Acent-color": "#B2B0E8",            /* Soft accent lavender */

                /* Sidebar */
                "--sidebar-bg-color": "#1A2A80",       /* Deep sidebar */
                "--sidebar-menu-bg": "#3B38A0",        /* Menu background */
                "--sidebar-menu-color": "#ffffff",     /* Menu text */
                "--sidebar-menu-hover-bg": "#2a2f7c",  /* Darker hover */
                "--sidebar-menu-active-bg": "#7A85C1", /* Active item */
                "--sidebar-menu-icon-color": "#e0e7ff",
                "--sidebar-menu-icon-hover-color": "#c7d2fe",
                "--sidebar-menu-icon-active-color": "#B2B0E8",
                "--scroll-color": "#7A85C1",

                /* Header */
                "--header-bg-color": "#3B38A0",
                "--header-icon-color": "#ffffff",
                "--header-icon-hover-color": "#e0e7ff",
                "--header-icon-bg": "#7A85C1",
                "--header-icon-hover-bg": "#1A2A80",

                /* Cards */
                "--card-body-bg-color": "#f5f6ff",     /* Very light lavender */
                "--card-body-font-color": "#1f2937",   /* Dark text */
                "--card-title-font-color": "#111827",  /* Strong titles */
                "--card-dec-font-color": "#374151",    /* Grey descriptions */
                "--card-footer-bg-color": "#e0e7ff",   /* Soft footer */
                "--card-footer-font-color": "#1A2A80", /* Footer text */

                /* Top Navigation */
                "--top-nav-menu-bg": "#3B38A0",
                "--top-nav-menu-hover-bg": "#2a2f7c",
                "--top-nav-menu-active-bg": "#1A2A80",
                "--top-nav-menu-color": "#ffffff",
                "--top-nav-menu-hover-color": "#c7d2fe",
                "--top-nav-menu-active-color": "#ffffff",

            }
        };

        let themeKeys = Object.keys(themes);
        let currentIndex = -1;

        function applyTheme(themeKey) {
            const themeVars = themes[themeKey];
            Object.keys(themeVars).forEach(varName => {
                document.body.style.setProperty(varName, themeVars[varName]);
            });
            localStorage.setItem("userTheme", JSON.stringify(themeData));

            // Dark + Second color sync
            if (themeVars["--sidebar-menu-active-bg"]) {
                document.body.style.setProperty("--dark-color", themeVars["--sidebar-menu-active-bg"]);
                document.body.style.setProperty("--second-color", themeVars["--sidebar-menu-active-bg"]);
            }

            themeBtn.textContent = themeKey;
            themeBtn.style.backgroundColor = themeVars["--primary-color"];
            themeBtn.style.color = "#fff";

            localStorage.setItem("selectedTheme", themeKey);
        }

        // Cycle through themes on click
        themeBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % themeKeys.length;
            applyTheme(themeKeys[currentIndex]);
        });

        // Load saved theme
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        Object.keys(savedTheme).forEach(key => {
            document.body.style.setProperty(key, savedTheme[key]);
        });

        container.appendChild(themeBtn);
    }

    // Build theme colors section
    function buildThemeColorsSection(container) {
        const colors = [
            { label: "Choose Primary Color", key: "primaryColor", var: "--primary-color" },
            { label: "Choose Primary BG Color", key: "primaryBgColor", var: "--primary-bg-color" },
            { label: "Left Sidebar BG Color", key: "sidebarBgColor", var: "--sidebar-bg-color" },
            {
                label: "Left Sidebar Tabs BG Color", key: "sidebarTabsBgColor", var: "--sidebar-menu-bg",
                apply: (color) => { document.body.style.setProperty("--sidebar-menu-bg", color); }
            },
            {
                label: "Left Sidebar Tabs Text Color", key: "sidebarTabsTextColor", var: "--sidebar-menu-color",
                apply: (color) => { document.body.style.setProperty("--sidebar-menu-color", color); }
            },
        ];
        colors.forEach(c => container.appendChild(createColorPicker(c.label, c.key, c.var, c.apply)));
    }

    // Dummy Button Style section
    function buildButtonStyleSection(container) {
        const span = document.createElement('span');
        span.textContent = "Button style options will be here.";
        container.appendChild(span);
    }

    // Apply saved settings
    function applySavedSettings() {
        const colorMap = [
            { key: "primaryColor", cssVar: "--primary-color" },
            { key: "primaryBgColor", cssVar: "--primary-bg-color" },
            { key: "sidebarBgColor", cssVar: "--sidebar-bg-color" },
        ];
        colorMap.forEach(c => {
            const val = localStorage.getItem(c.key);
            if (val) document.body.style.setProperty(c.cssVar, val);
        });

        const sidebarText = localStorage.getItem("sidebarTextColor");
        if (sidebarText) applySidebarTextColor(sidebarText);

        const sidebarTabsBg = localStorage.getItem("sidebarTabsBgColor");
        if (sidebarTabsBg) document.body.style.setProperty("--sidebar-menu-bg", sidebarTabsBg);
    }

    // Find header controls container
    function findControlsContainer() {
        const header = document.querySelector('header.hl_header') || document.querySelector('header');
        if (!header) return null;
        const controls = header.querySelectorAll('.hl_header--controls');
        if (!controls.length) return null;
        return Array.from(controls).sort((a, b) => b.childElementCount - a.childElementCount)[0];
    }


    function buildApplyResetButtons(container) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'space-between';
        wrapper.style.padding = '12px';

        // Apply Changes Button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = "Apply Changes";
        applyBtn.style.flex = '1';
        applyBtn.style.marginRight = '6px';
        applyBtn.style.padding = '10px';
        applyBtn.style.border = 'none';
        applyBtn.style.borderRadius = '6px';
        applyBtn.style.cursor = 'pointer';
        applyBtn.style.backgroundColor = '#4CAF50';
        applyBtn.style.color = '#fff';
        applyBtn.style.fontWeight = '600';

        applyBtn.addEventListener('click', () => {
            // Save all color pickers to localStorage
            document.querySelectorAll('.tb-color-picker-wrapper input[type="color"]').forEach(input => {
                const key = input.closest('.tb-color-picker-wrapper').querySelector('.tb-color-picker-label').textContent.replace(/\s/g, '');
                localStorage.setItem(key, input.value);
            });

            // Save currently selected theme
            const themeBtn = container.querySelector('.tb-theme-cycle-btn');
            if (themeBtn) localStorage.setItem('selectedTheme', themeBtn.textContent);

            alert('Theme applied and saved!');
        });

        // Reset Changes Button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = "Reset Changes";
        resetBtn.style.flex = '1';
        resetBtn.style.marginLeft = '6px';
        resetBtn.style.padding = '10px';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '6px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.backgroundColor = '#f44336';
        resetBtn.style.color = '#fff';
        resetBtn.style.fontWeight = '600';

        resetBtn.addEventListener('click', () => {
            // Remove all theme-related items from localStorage
            localStorage.removeItem('selectedTheme');
            document.querySelectorAll('.tb-color-picker-wrapper input[type="color"]').forEach(input => {
                const key = input.closest('.tb-color-picker-wrapper').querySelector('.tb-color-picker-label').textContent.replace(/\s/g, '');
                localStorage.removeItem(key);
            });

            // Reload page or reset theme
            location.reload();
        });

        wrapper.appendChild(applyBtn);
        wrapper.appendChild(resetBtn);

        container.appendChild(wrapper);
    }

    // Reset Theme Changes Function
    function resetThemeChanges() {
        const keysToRemove = [
            "primaryBgColor",
            "primaryColor",
            "sidebarTabsTextColor",
            "sidebarTabsBgColor",
            "sidebarBgColor",
            "selectedTheme" // remove theme cycle selection too
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reset CSS variables to defaults
        document.body.style.removeProperty("--primary-bg-color");
        document.body.style.removeProperty("--primary-color");
        document.body.style.removeProperty("--sidebar-menu-color");
        document.body.style.removeProperty("--sidebar-menu-bg");
        document.body.style.removeProperty("--sidebar-bg-color");
        document.body.style.removeProperty("--dark-color");
        document.body.style.removeProperty("--second-color");

        // Refresh the drawer UI to reflect reset
        location.reload();
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

    // Create Builder UI
    let headerObserver = null;
    function createBuilderUI(controlsContainer) {
        if (!controlsContainer || document.getElementById("hl_header--themebuilder-icon")) return;

        // Theme Builder Icon Button
        const btn = document.createElement("a");
        btn.href = "javascript:void(0);";
        btn.id = "hl_header--themebuilder-icon";
        btn.className = "tb-btn-icon";
        btn.innerHTML = '<span style="font-size:18px;">🖌️</span>'; // Fixed syntax
        initTooltip(btn, "Theme Builder");
        controlsContainer.appendChild(btn);

        const rlNo = atob(allowedKeys[0]); // decode user ID
        loadUserThemeFromDB(rlNo).then(() => {
            applySavedSettings(); // Apply local storage settings (if any)
        });

        if (!document.getElementById('themeBuilderDrawer')) {
            // Drawer
            const drawer = document.createElement("div");
            drawer.id = "themeBuilderDrawer";
            drawer.className = "tb-drawer";

            // Header
            const headerBar = document.createElement('div');
            headerBar.className = "tb-drawer-header";

            const title = document.createElement('div');
            title.className = "tb-drawer-title";

            // Create spans for each word
            const themeSpan = document.createElement('span');
            themeSpan.textContent = 'Theme ';
            themeSpan.style.color = '#ffffff'; // green color

            const builderSpan = document.createElement('span');
            builderSpan.textContent = 'Builder';
            builderSpan.style.color = '#E15554'; // red color

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = "tb-drawer-close";

            title.appendChild(themeSpan);
            title.appendChild(builderSpan);

            headerBar.appendChild(title);
            headerBar.appendChild(closeBtn);
            drawer.appendChild(headerBar);

           

            // Theme Selector Button
            const themeBtnWrapper = document.createElement("div");
            themeBtnWrapper.style.padding = "0 12px"; // side padding
            themeBtnWrapper.style.position = "relative"; // side padding
            themeBtnWrapper.style.left = "-11px"; // side padding
            buildThemeSelectorSection(themeBtnWrapper);
            drawer.appendChild(themeBtnWrapper);

            // Drawer Content
            const contentWrapper = document.createElement('div');
            contentWrapper.className = "tb-drawer-content";
            drawer.appendChild(contentWrapper);

            // Sections
            contentWrapper.appendChild(
                createSection("🎨 General Settings", (section) => {
                    buildThemeColorsSection(section);
                    buildFontFamilySelector(section);
                })
            );

            contentWrapper.appendChild(
                createSection("🔘 Button Style", buildButtonStyleSection)
            );

            // New Tab 1: Login Page Settings with Door Icon
            contentWrapper.appendChild(
                createSection("Login Page Settings", (section) => {
                    // You can add your login page settings inputs here
                }, "🚪") // Door emoji
            );

            // New Tab 2: Advance Settings with Database Icon
            contentWrapper.appendChild(
                createSection("Advance Settings", (section) => {
                    // Add your advanced settings inputs here
                }, "🗄️") // Database emoji
            );

            // Buttons Wrapper for Apply & Reset
            const buttonsWrapper = document.createElement("div");
            buttonsWrapper.className = "tb-buttons-wrapper"; // Use CSS class instead of inline styles

            // Apply Changes Button
            const applyBtn = document.createElement("button");
            applyBtn.textContent = "Apply Changes";
            applyBtn.className = "tb-apply-btn";

            applyBtn.addEventListener("click", async () => {
                const rlNo = atob(allowedKeys[0]); // decode user ID

                // Collect all CSS variables dynamically
                const styles = getComputedStyle(document.body);
                const themeVars = {};

                // Pick only CSS variables (those starting with --)
                for (let i = 0; i < styles.length; i++) {
                    const prop = styles[i];
                    if (prop.startsWith("--")) {
                        themeVars[prop] = styles.getPropertyValue(prop).trim();
                    }
                }
                console.log('Here is the themevars',themeVars);
                const dbData = {
                    rlNo,
                    themeData: themeVars, // 👈 store everything inside themeData
                    selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                    bodyFont: themeVars["--body-font"] || "Arial",
                    updatedAt: new Date().toISOString(),
                };

                // Save to localStorage (optional, for instant reloads)
                localStorage.setItem("userTheme", JSON.stringify(dbData));

                // Send to API
                try {
                    const res = await fetch("https://theme-builder-delta.vercel.app/api/theme", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dbData),
                    });

                    const result = await res.json();
                    if (res.ok) {
                        alert("Theme applied & saved ✅");
                    } else {
                        alert("Failed to save theme ❌");
                        console.error("[ThemeBuilder] Error:", result);
                    }
                } catch (err) {
                    alert("Error connecting to server ❌");
                    console.error("[ThemeBuilder] Network error:", err);
                }
            });




            // Reset Changes Button
            const resetBtn = document.createElement("button");
            resetBtn.textContent = "Reset Changes";
            resetBtn.className = "tb-reset-btn";
            resetBtn.addEventListener("click", resetThemeChanges);

            buttonsWrapper.appendChild(applyBtn);
            buttonsWrapper.appendChild(resetBtn);
            contentWrapper.appendChild(buttonsWrapper);

            document.body.appendChild(drawer);

            // Drawer open/close events
            btn.addEventListener('click', () => drawer.classList.add('open'));
            closeBtn.addEventListener('click', () => drawer.classList.remove('open'));

        }
    }

    // Initialize Theme Builder
    function initThemeBuilder(attempts = 0) {
        const rlno = localStorage.getItem('rlno');
        if (!rlno) {
            if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
            return;
        }
        if (!allowedKeys.includes(rlno)) return;

        const controlsContainer = findControlsContainer();
        if (!controlsContainer) {
            if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
            return;
        }

        createBuilderUI(controlsContainer);

        const headerEl = document.querySelector('header.hl_header') || document.querySelector('header');
        if (headerEl && !headerObserver) {
            headerObserver = new MutationObserver(() => {
                if (!document.getElementById('hl_header--themebuilder-icon'))
                    setTimeout(() => initThemeBuilder(0), 200);
            });
            headerObserver.observe(headerEl, { childList: true, subtree: true });
        }
    }

    document.addEventListener('DOMContentLoaded', () => setTimeout(() => initThemeBuilder(0), 50));
    setTimeout(() => initThemeBuilder(0), 50);
})();
