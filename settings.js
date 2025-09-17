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

        // Editable colors
        const editableColors = [
            "--primary-color",
            "--header-bg-color",
            "--sidebar-bg-color",
            "--sidebar-menu-bg",
            "--sidebar-menu-color",
        ];

        editableColors.forEach(key => {
            const value = localStorage.getItem(key) || themeData[key] || "#000000";

            const picker = createColorPicker(key, key, key, (val) => {
                document.body.style.setProperty(key, val);

                // --- Gradient Logic ---
                if (key === "--header-bg-color" || key === "--sidebar-bg-color") {
                    const headerColor = getComputedStyle(document.body).getPropertyValue("--header-bg-color").trim() || "#000000";
                    const sidebarColor = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-color").trim() || "#000000";

                    // Update gradient
                    const gradient = `linear-gradient(to bottom, ${headerColor}, ${sidebarColor})`;
                    document.body.style.setProperty("--sidebar-main-bg-gradient", gradient);
                }
            });

            container.appendChild(picker);
        });

        // --- Initial Gradient Apply ---
        const headerColor = getComputedStyle(document.body).getPropertyValue("--header-bg-color").trim() || "#000000";
        const sidebarColor = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-color").trim() || "#000000";
        const initialGradient = `linear-gradient(to bottom, ${headerColor}, ${sidebarColor})`;
        document.body.style.setProperty("--sidebar-main-bg-gradient", initialGradient);
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
        const startPicker = makePicker("Color Start", "--header-gradient-start", "#ff0000");
        const endPicker = makePicker("Color End", "--header-gradient-end", "#0000ff");

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
        title.textContent = "Help Button Settings";
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
        if (document.getElementById("tb-scrollbar-color")) return; // prevent duplicate

        // --- Wrapper ---
        const wrapper = document.createElement("div");
        wrapper.className = "tb-scrollbar-settings";
        wrapper.style.marginTop = "16px";

        // --- Title ---
        const title = document.createElement("h4");
        title.innerText = "Scrollbar Settings";
        title.className = "tb-section-title";
        wrapper.appendChild(title);

        // --- Scrollbar Color ---
        const colorLabel = document.createElement("label");
        colorLabel.innerText = "Scrollbar Color:";
        colorLabel.className = "tb-label";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.id = "tb-scrollbar-color";
        colorInput.className = "tb-color-input";
        colorInput.value = "#344391"; // default

        colorLabel.appendChild(colorInput);
        wrapper.appendChild(colorLabel);

        // --- Scrollbar Width ---
        const widthLabel = document.createElement("label");
        widthLabel.innerText = "Scrollbar Width (px):";
        widthLabel.className = "tb-label";

        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.id = "tb-scrollbar-width";
        widthInput.className = "tb-number-input";
        widthInput.value = "7"; // default
        widthInput.min = "2";
        widthInput.max = "30";

        widthLabel.appendChild(widthInput);
        wrapper.appendChild(widthLabel);

        // --- Update function ---
        function updateScrollbar() {
            document.body.style.setProperty("--scroll-color", colorInput.value);
            document.body.style.setProperty("--scroll-width", widthInput.value + "px");
        }

        // --- Listeners ---
        colorInput.addEventListener("input", updateScrollbar);
        widthInput.addEventListener("input", updateScrollbar);

        // Initial apply
        updateScrollbar();

        // Add to ThemeBuilder container
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
        title.className = "tb-section-title";
        title.innerText = "Dashboard Cards Settings";
        wrapper.appendChild(title);

        // === Saved Theme Data ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        // helper to normalize storage key (use cssVar if provided, else prefix key)
        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        // save helper
        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            // also set live on body (so applyGradient/readComputed can pick it up)
            document.body.style.setProperty(key, value);
        }

        // apply gradient — read freshest values either from saved themeData or computed style
        function applyGradient() {
            const startKey = "--card-header-gradient-start";
            const endKey = "--card-header-gradient-end";
            const start = (themeData[startKey] || getComputedStyle(document.body).getPropertyValue(startKey) || "#344391").toString().trim();
            const end = (themeData[endKey] || getComputedStyle(document.body).getPropertyValue(endKey) || "#1f2c66").toString().trim();

            const stop = 85;   // fixed as requested
            const angle = 90;  // fixed as requested

            const gradientValue = `linear-gradient(${angle}deg, ${start} 0%, ${end} ${stop}%)`;

            // set CSS var and apply to matching card headers
            saveVar("--card-header-bg-gradient", gradientValue);

            document.querySelectorAll("#location-dashboard .hl-card-header").forEach(el => {
                // apply inline background-image so it takes effect immediately
                el.style.removeProperty("background"); // remove solid background if any
                el.style.setProperty("background-image", gradientValue, ""); // no !important needed
            });
        }

        // color picker helper — uses cssVar (with --) as storage key
        function makePicker(labelText, key, fallback, cssVar, isGradient = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "tb-color-input";

            // determine which variable to read/write
            const skey = storageKeyFor(key, cssVar);

            // initial value: saved themeData -> computed style -> fallback
            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback || "#000000").toString().trim();
            // ensure color input accepts it (if computed value not hex, fallback)
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            input.value = initial;

            const code = document.createElement("span");
            code.className = "tb-color-code";
            code.textContent = initial;

            // apply immediately to CSS var (so other code using the var will pick it up)
            document.body.style.setProperty(skey, initial);

            input.addEventListener("input", () => {
                const val = input.value;
                code.textContent = val;

                // save under the normalized css var key
                saveVar(skey, val);

                // if this picker is part of gradient, recalc gradient
                if (isGradient) applyGradient();
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

        // Start Color (use css var --card-header-gradient-start)
        gradientControls.appendChild(
            makePicker("Start Color", "card-header-gradient-start", "#344391", "--card-header-gradient-start", true)
        );

        // End Color (use css var --card-header-gradient-end)
        gradientControls.appendChild(
            makePicker("End Color", "card-header-gradient-end", "#1f2c66", "--card-header-gradient-end", true)
        );

        // Additional card settings (body bg, title color, font-size) — use css vars
        gradientControls.appendChild(
            makePicker("Card Background", "card-body-bg-color", "#ffffff", "--card-body-bg-color", false)
        );
        gradientControls.appendChild(
            makePicker("Card Title Font Color", "card-title-font-color", "#000000", "--card-title-font-color", false)
        );

        // Card Title Font Size (number input)
        (function addTitleFontSize() {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = "Card Title Font Size (px)";

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-input";
            input.min = 8;
            input.max = 48;

            const cssVar = "--card-title-font-size";
            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || "16px";
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || 16;
            input.value = initialNumber;

            const code = document.createElement("span");
            code.className = "tb-number-code";
            code.textContent = initialNumber + "px";

            // apply initial
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

        // initial application: if saved gradient pieces exist, rebuild gradient now
        applyGradient();

        // also reapply any other saved vars on body (keeps previous behavior)
        Object.keys(themeData).forEach(k => {
            try {
                document.body.style.setProperty(k, themeData[k]);
            } catch (e) { /* ignore invalid keys */ }
        });

        // append and return
        container.appendChild(wrapper);
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

    // === Wait until sidebar menus exist ===
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
    function applyLockedMenus() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};

        // Parse string back to object
        const lockedMenus = themeData["--lockedMenus"]
            ? JSON.parse(themeData["--lockedMenus"])
            : {};

        const sidebarMenus = document.querySelectorAll(".hl_nav-header a");

        sidebarMenus.forEach(menu => {
            const menuId = menu.id || menu.getAttribute("meta") || menu.href;

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
                    addScrollbarSettings(section);   // Profile Button Color Controls
                    addDashboardCardSettings(section)

                    // Add more advanced options later
                }, "🗄️")
            );

            contentWrapper.appendChild(
                createSection("Feature Lock and Hide Settings", (section) => {
                    buildFeatureLockSection(section);
                }, "🔒")
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

                        // ✅ Include lockedMenus properly
                        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
                        const lockedMenus = savedTheme.themeData?.["--lockedMenus"]
                            ? JSON.parse(savedTheme.themeData["--lockedMenus"])
                            : {};

                        // Keep lockedMenus inside themeData
                        themeData["--lockedMenus"] = JSON.stringify(lockedMenus);

                        const dbData = {
                            rlNo,
                            email,
                            themeData,
                            selectedTheme: localStorage.getItem("selectedTheme") || "Custom",
                            bodyFont: themeData["--body-font"] || "Arial, sans-serif",
                            updatedAt: new Date().toISOString(),
                        };

                        // Save locally
                        localStorage.setItem("userTheme", JSON.stringify({ ...savedTheme, themeData: themeData }));

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