(function () {
    const DEBUG = true;
    const log = (...args) => { if (DEBUG) console.log('[ThemeBuilder]', ...args); };

    let headerObserver = null;
    const MAX_ATTEMPTS = 40;

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
    async function loadUserThemeFromDB(identifier, type = "rlno") {
        try {
            const res = await fetch(`https://theme-builder-delta.vercel.app/api/theme/${identifier}?type=${type}`);
            if (!res.ok) throw new Error(`Failed to fetch theme for ${type}: ${identifier}`);

            const theme = await res.json();
            if (!theme.isActive) return;

            // ✅ Apply inline theme variables
            if (theme.themeData) {
                Object.entries(theme.themeData).forEach(([key, value]) => {
                    if (value && value !== "undefined") {
                        document.body.style.setProperty(key, value);
                    }
                });
            }

            localStorage.setItem("userTheme", JSON.stringify(theme));

            // ✅ ALSO apply the CSS file from your encoded source
            await applyCSSFile(identifier);

        } catch (err) {
            console.error("[ThemeBuilder] Failed to load user theme:", err);

            // ✅ fallback from cache
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
                log("Applied cached theme from localStorage");

                // ✅ also try loading CSS file from identifier if cached
                const cachedIdentifier = theme.email ? theme.email.toLowerCase() : theme.rlno;
                if (cachedIdentifier) {
                    await applyCSSFile(cachedIdentifier);
                }
            }
        }
    }

    // 🔹 Helper function to fetch and inject CSS
    async function applyCSSFile(identifier) {
        try {
            const url = `https://theme-builder-delta.vercel.app/api/theme/file/${encodeURIComponent(identifier)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch CSS file");

            const cssText = await res.text();

            // remove old CSS (avoid duplicates)
            const oldStyle = document.getElementById("theme-css");
            if (oldStyle) oldStyle.remove();

            const style = document.createElement("style");
            style.id = "theme-css";
            style.innerHTML = cssText;
            document.head.appendChild(style);

        } catch (err) {
            console.error("❌ Failed to apply external CSS:", err.message);
        }
    }

    // Create collapsible sections
    // Utility to create section with optional icon
    function createSection(title, contentBuilder, icon = null) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";
        header.style.cursor = "pointer";

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
                    openContent.previousSibling.classList.remove("tb-section-header-open");
                    openContent.style.maxHeight = null;
                    openContent.style.overflowY = null;
                }
            });

            // Toggle the clicked section
            content.classList.toggle("open");
            header.classList.toggle("tb-section-header-open", content.classList.contains("open"));

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
    // 🌟 Mapping of CSS vars -> Human-friendly labels
    const cssVarLabels = {
        "--primary-color": "Tab Label Color",
        "--header-bg-color": "Header Background",
        "--sidebar-bg-color": "Side Bar Background",
        "--sidebar-menu-bg": "SideBar Menu Background",
        "--sidebar-menu-color": "SideBar Text Color"
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
        // Wrapper for button + arrow
        const wrapper = document.createElement("div");
        wrapper.className = "themeSelectWrapper";

        // Main button (keeps existing behavior: cycle themes)
        const themeBtn = document.createElement("button");
        themeBtn.textContent = "Select Theme";
        themeBtn.className = "tb-theme-cycle-btn";

        // Arrow button
        const arrowBtn = document.createElement("button");
        arrowBtn.className = "themeArrowBtn";
        arrowBtn.innerHTML = "&#9662;"; // ▼

        // Dropdown box (hidden by default)
        const dropdownBox = document.createElement("div");
        dropdownBox.className = "themeDropdownBox";

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

            // Update main button text & color
            themeBtn.textContent = themeName;
            themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff";
            themeBtn.style.color = "#fff";

            // Save
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = vars;
            savedThemeObj.selectedTheme = themeName;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // ✅ Restore saved theme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (savedThemeObj.selectedTheme) {
            applyTheme(savedThemeObj.selectedTheme, savedThemeObj.themeData);
            if (themeKeys.includes(savedThemeObj.selectedTheme)) {
                currentIndex = themeKeys.indexOf(savedThemeObj.selectedTheme);
            }
        }

        // Main button = cycle themes
        themeBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % themeKeys.length;
            applyTheme(themeKeys[currentIndex]);
        });

        // Arrow button = open dropdown
        arrowBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownBox.classList.toggle("show");
        });

        // Populate dropdown
        themeKeys.forEach(themeName => {
            const optBtn = document.createElement("button");
            optBtn.textContent = themeName;
            optBtn.addEventListener("click", () => {
                applyTheme(themeName);
                dropdownBox.classList.remove("show");
            });
            dropdownBox.appendChild(optBtn);
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!wrapper.contains(e.target)) {
                dropdownBox.classList.remove("show");
            }
        });

        // Build structure
        wrapper.appendChild(themeBtn);
        wrapper.appendChild(arrowBtn);
        wrapper.appendChild(dropdownBox);
        container.appendChild(wrapper);
    }

    // Build theme colors section
    function buildThemeColorsSection(container) {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const editableColors = ["--primary-color", "--header-bg-color", "--sidebar-bg-color", "--sidebar-menu-bg", "--sidebar-menu-color",];
        editableColors.forEach(key => {
            const value = localStorage.getItem(key) || themeData[key] || "#000000";
            const picker = createColorPicker(key, key, key, (val) => {
                document.body.style.setProperty(key, val);
            });
            container.appendChild(picker);
        });
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
        header.textContent = "Header Background Color";
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
        const startPicker = makePicker("Color Start", "--header-gradient-start", "#ff0000");
        const endPicker = makePicker("Color End", "--header-gradient-end", "#0000ff");

        const stopWrapper = document.createElement("div");
        stopWrapper.className = "tb-input-wrapper";
        const stopLabel = document.createElement("label");
        stopLabel.className = "tb-input-label";
        stopLabel.textContent = "Color Stop (%)";
        const stopInput = document.createElement("input");
        stopInput.type = "number";
        stopInput.className = "tb-number-input";
        stopInput.min = 0;
        stopInput.max = 100;
        stopInput.value =
            parseInt(
                (themeData["--header-gradient-stop"] ||
                    getComputedStyle(document.body).getPropertyValue("--header-gradient-stop") ||
                    "0").replace("%", "")
            ) || 0;
        stopWrapper.appendChild(stopLabel);
        stopWrapper.appendChild(stopInput);

        const angleWrapper = document.createElement("div");
        angleWrapper.className = "tb-input-wrapper";
        const angleLabel = document.createElement("label");
        angleLabel.className = "tb-input-label";
        angleLabel.textContent = "Gradient Angle (deg)";
        const angleInput = document.createElement("input");
        angleInput.type = "number";
        angleInput.className = "tb-number-input";
        angleInput.style.position = "relative";
        angleInput.style.left = "41px";
        angleInput.min = 0;
        angleInput.max = 360;
        angleInput.value =
            parseInt(
                (themeData["--header-gradient-angle"] ||
                    getComputedStyle(document.body).getPropertyValue("--header-gradient-angle") ||
                    "0").replace("deg", "")
            ) || 0;
        angleWrapper.appendChild(angleLabel);
        angleWrapper.appendChild(angleInput);

        // Append all controls
        gradientWrapper.appendChild(startPicker.wrapper);
        gradientWrapper.appendChild(endPicker.wrapper);
        gradientWrapper.appendChild(stopWrapper);
        gradientWrapper.appendChild(angleWrapper);
        // === Instruction Comment ===
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "💡 For Flat Color in Header: Choose the same color for Start & End, Stop %: 0, Gradient Angle: 0";
        gradientWrapper.appendChild(instruction);

        section.appendChild(gradientWrapper);

        // === Update Gradient Preview ===
        const headerEl = document.querySelector(".hl_header");
        function updateGradientPreview() {
            if (!headerEl) return;

            const start = startPicker.input.value;
            const end = endPicker.input.value;
            const stop = stopInput.value;
            const angle = angleInput.value;

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

        // === Event Listeners ===
        [stopInput, angleInput, startPicker.input, endPicker.input].forEach((el) =>
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
        title.textContent = "Help Button Settings";
        helpWrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        const selector = "#hl_header--help-icon"; // your Help button
        const iconSelector = "#hl_header--help-icon i"; // the <i> tag for the ? icon

        // helper: inject isolated CSS
        function setImportantStyle(id, rule) {
            let styleTag = document.getElementById("style-" + id);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "style-" + id;
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = rule;
        }

        // helper: create color picker
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

            // Apply initial value
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
        helpWrapper.appendChild(
            makePicker("Icon Color", "help-icon-color", "#ffffff", (val) => {
                setImportantStyle(
                    "help-icon-color",
                    `${iconSelector} { color: ${val} !important; }`
                );
            })
        );

        // === Icon Hover Color ===
        helpWrapper.appendChild(
            makePicker("Icon Hover Color", "help-icon-hover", "#eeeeee", (val) => {
                setImportantStyle(
                    "help-icon-hover",
                    `${selector}:hover i { color: ${val} !important; }`
                );
            })
        );

        // === Background Color ===
        helpWrapper.appendChild(
            makePicker("Background Color", "help-bg-color", "#188bf6", (val) => {
                setImportantStyle(
                    "help-bg-color",
                    `${selector} { background-color: ${val} !important; }`
                );
            })
        );

        // === Background Hover Color ===
        helpWrapper.appendChild(
            makePicker("Background Hover Color", "help-bg-hover", "#146cc0", (val) => {
                setImportantStyle(
                    "help-bg-hover",
                    `${selector}:hover { background-color: ${val} !important; }`
                );
            })
        );

        section.appendChild(helpWrapper);
    }

    // Utility for hover styles
    function addDynamicHoverStyle(selector, styleContent, id) {
        let styleTag = document.getElementById("style-" + id);
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "style-" + id;
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `${selector}:hover { ${styleContent} }`;
    }


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
            loadUserThemeFromDB(rlNo, "rlno").then(() => applySavedSettings());
        } else if (email) {
            loadUserThemeFromDB(email, "email").then(() => applySavedSettings());
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
                createSection("🎨 General Settings", (section) => {
                    buildThemeColorsSection(section);
                    buildFontFamilySelector(section);
                }, "", true) // <-- true = open by default
            );

            contentWrapper.appendChild(
                createSection("Login Page Settings", (section) => {
                    section.appendChild(createLoginColorPicker("Login Card BG Gradient", "--login-card-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Link Text Color", "--login-link-text-color"));
                    section.appendChild(createLoginColorPicker("Login Button BG Gradient", "--login-button-bg-gradient"));
                    section.appendChild(createLoginColorPicker("Login Button BG Color", "--login-button-bg-color"));
                    section.appendChild(createLoginColorPicker("Login Card Backgroud Color", "--login-card-bg-color"));
                    section.appendChild(createLoginLogoInput("Logo URL", "--login-company-logo"));
                }, "🚪")
            );

            contentWrapper.appendChild(
                createSection("Advance Settings", (section) => {
                    buildHeaderControlsSection(section);
                    buildProfileButtonControls(section);   // Profile Button Color Controls
                    buildHelpButtonControls(section);   // Profile Button Color Controls

                    // Add more advanced options later
                }, "🗄️")
            );

            // Append contentWrapper to card
            cardWrapper.appendChild(contentWrapper);

            // Append cardWrapper to drawer
            drawer.appendChild(cardWrapper);

            // ===== Apply Button Outside Card =====
            const buttonsWrapper = document.createElement("div");
            buttonsWrapper.className = "tb-buttons-wrapper";

            const applyBtn = document.createElement("button");
            applyBtn.textContent = "Apply Changes";
            applyBtn.className = "tb-apply-btn";

            applyBtn.addEventListener("click", () => {
                showJCConfirm(
                    "Do you want to apply these changes? Press Yes to apply & reload the page. Press No to revert.",
                    async () => {
                        const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
                        const email = localStorage.getItem("userEmail") ? atob(localStorage.getItem("userEmail")) : null;

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
                            email,
                            themeData,
                            selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                            bodyFont: themeData["--body-font"] || "Arial, sans-serif",
                            updatedAt: new Date().toISOString(),
                        };

                        localStorage.setItem("userTheme", JSON.stringify(dbData));

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

                        location.reload();
                    },
                    () => {
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
    function initThemeBuilder(attempts = 0) {
        const rlno = localStorage.getItem('rlno');
        const email = localStorage.getItem('userEmail');

        if (!rlno && !email) {
            if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
            return;
        }

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