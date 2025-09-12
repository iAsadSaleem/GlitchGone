(function () {
    const DEBUG = true;
    const log = (...args) => { if (DEBUG) console.log('[ThemeBuilder]', ...args); };

    const allowedKeys = [btoa("0-373-489")];
    const MAX_ATTEMPTS = 40;

    const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const themeData = savedThemeObj.themeData || {};
    Object.entries(themeData).forEach(([key, value]) => {
        if (value && value !== "undefined") {
            document.body.style.setProperty(key, value);
        }
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

    // NEW: Fetch user theme from DB and apply
    async function loadUserThemeFromDB(rlNo) {
        try {
            const res = await fetch(`https://theme-builder-delta.vercel.app/api/theme/${rlNo}`);
            if (!res.ok) throw new Error('Failed to fetch theme');

            const theme = await res.json();
            if (!theme.isActive) return;
            if (theme.themeData) {
                Object.entries(theme.themeData).forEach(([key, value]) => {
                    if (value && value !== "undefined") {
                        document.body.style.setProperty(key, value);
                    }
                });
            }
            // Save whole theme object in localStorage (for offline use)
            localStorage.setItem("userTheme", JSON.stringify(theme));

        } catch (err) {
            console.error("[ThemeBuilder] Failed to load user theme:", err);

            // ✅ fallback: load from localStorage if API fails
            const cached = localStorage.getItem("userTheme");
            if (cached) {
                const theme = JSON.parse(cached);
                if (theme.themeData) {
                    Object.entries(theme.themeData).forEach(([key, value]) => {
                        if (value && value !== "undefined") {
                            document.body.style.setProperty(key, value);
                        }
                    });
                }
                console.log("Applied cached theme from localStorage");
            }
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

        // Get stored color or fallback to default
        let storedColor = localStorage.getItem(storageKey);
        if (!storedColor || storedColor === "undefined") storedColor = "#007bff";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("span");
        colorCode.className = "tb-color-code";
        colorCode.textContent = colorInput.value;

        // Copy color code to clipboard on click
        colorCode.addEventListener("click", () => {
            navigator.clipboard.writeText(colorCode.textContent).then(() => {
                colorCode.style.background = "#c8e6c9";
                setTimeout(() => (colorCode.style.background = "#f0f0f0"), 800);
            });
        });

        // Apply color changes
        colorInput.addEventListener("input", () => {
            const color = colorInput.value;

            // Only apply valid colors
            if (!color || color === "undefined") return;

            colorCode.textContent = color;
            localStorage.setItem(storageKey, color);
            if (cssVar) document.body.style.setProperty(cssVar, color);
            if (applyFn) applyFn(color);
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

        function applyTheme(themeName, themeVars) {
            const vars = themeVars || themes[themeName];
            if (!vars) return;

            Object.entries(vars).forEach(([key, value]) => {
                if (value && value !== "undefined") {
                    document.body.style.setProperty(key, value);
                }
            });

            // Update button text to show the current theme
            themeBtn.textContent = themeName;
            themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff";
            themeBtn.style.color = "#fff";

            // Save updated theme in localStorage
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = vars;
            savedThemeObj.selectedTheme = themeName;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // ✅ On page load: apply saved theme and show its name
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (savedThemeObj.selectedTheme) {
            applyTheme(savedThemeObj.selectedTheme, savedThemeObj.themeData);

            // Update currentIndex only if it's a predefined theme
            if (themeKeys.includes(savedThemeObj.selectedTheme)) {
                currentIndex = themeKeys.indexOf(savedThemeObj.selectedTheme);
            }
        }

        // Cycle through themes on button click
        themeBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % themeKeys.length;
            applyTheme(themeKeys[currentIndex]);
        });

        container.appendChild(themeBtn);
    }

    // Build theme colors section
    function buildThemeColorsSection(container) {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const editableColors = ["--primary-color", "--primary-bg-color", "--sidebar-bg-color", "--sidebar-menu-bg", "--sidebar-menu-color",];
        editableColors.forEach(key => {
            const value = localStorage.getItem(key) || themeData[key] || "#000000";
            const picker = createColorPicker(key, key, key, (val) => {
                document.body.style.setProperty(key, val);
            });
            container.appendChild(picker);
        });
    }

    // Dummy Button Style section
    function buildButtonStyleSection(container) {
        const span = document.createElement('span');
        span.textContent = "Button style options will be here.";
        container.appendChild(span);
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

        // Apply sidebar text color if stored
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

    // Login Page settings
    function createLoginColorPicker(labelText, cssVar) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "tb-color-picker-label";

        // 1️⃣ Load current color from themeData or CSS variable
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
            document.body.style.setProperty(cssVar, color);

            // Save to userTheme.themeData
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = color;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        });

        // Apply initial color
        document.body.style.setProperty(cssVar, storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
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

            // New Tab 1: Login Page Settings with Door Icon
            contentWrapper.appendChild(
                createSection("Login Page Settings", (section) => {
                    // Add color pickers
                    section.appendChild(createLoginColorPicker("Login Card BG Gradient", "--login-card-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Link Text Color", "--login-link-text-color"));
                    section.appendChild(createLoginColorPicker("Login Button BG Gradient", "--login-button-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Button BG Color", "--login-button-bg-color"));
                    section.appendChild(createLoginColorPicker("Login Card Backgroud Color", "--login-card-bg-color"));
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

            applyBtn.addEventListener("click", () => {
                showJCConfirm(
                    "Do you want to apply these changes? Press Yes to apply & reload the page. Press No to revert.",
                    async () => {
                        // YES pressed
                        const rlNo = atob(allowedKeys[0]);

                        // Collect all CSS variables starting with --
                        const collectThemeVars = () => {
                            const bodyStyle = document.body.style;
                            const themeVars = {};
                            for (let i = 0; i < bodyStyle.length; i++) {
                                const prop = bodyStyle[i];
                                if (prop.startsWith("--")) {
                                    themeVars[prop] = bodyStyle.getPropertyValue(prop).trim();
                                }
                            }
                            return themeVars;
                        };

                        const themeData = collectThemeVars();

                        const dbData = {
                            rlNo,
                            themeData: themeData,
                            selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                            bodyFont: themeData["--body-font"] || "Arial, sans-serif",
                            updatedAt: new Date().toISOString(),
                        };

                        // Save theme locally
                        localStorage.setItem("userTheme", JSON.stringify(dbData));

                        // Save to API
                        try {
                            const res = await fetch("https://theme-builder-delta.vercel.app/api/theme", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(dbData),
                            });
                            if (!res.ok) {
                                const result = await res.json();
                                console.error("[ThemeBuilder] API error:", result);
                            }
                        } catch (err) {
                            console.error("[ThemeBuilder] Network error:", err);
                        }

                        // Reload page to apply fully
                        location.reload();
                    },
                    () => {
                        // NO pressed, revert changes
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
            // Reset Changes Button
            //const resetBtn = document.createElement("button");
            //resetBtn.textContent = "Reset Changes";
            //resetBtn.className = "tb-reset-btn";
            //resetBtn.addEventListener("click", resetThemeChanges);

            buttonsWrapper.appendChild(applyBtn);
            //buttonsWrapper.appendChild(resetBtn);
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
