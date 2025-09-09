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
            log('CSS loaded');
        }
    }
    loadThemeBuilderCSS();

    // Create collapsible sections
    function createSection(title, contentBuilder) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";
        header.textContent = title;

        const content = document.createElement("div");
        content.className = "tb-section-content";

        header.addEventListener("click", () => {
            content.classList.toggle("open");
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

    // Apply sidebar hover color live
    function applySidebarHoverColor(color) {
        let styleTag = document.getElementById("tb-sidebar-hover-style");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "tb-sidebar-hover-style";
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
        .sidebar-v2 nav a:hover, .sidebar-v2 nav a:hover span {
            color: ${color} !important;
            opacity: 1 !important;
        }
        .sidebar-v2 nav a.active, .sidebar-v2 nav a.active span {
            color: ${color} !important;
        }`;
    }

    // NEW: Theme Selector Section
    // NEW: Theme Selector Section
    // NEW: Theme Selector Section
    // NEW: Theme Selector Section
    function buildThemeSelectorSection(container) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-theme-selector-wrapper";

        const label = document.createElement("label");
        label.textContent = "Select Theme";
        label.className = "tb-theme-selector-label";

        const select = document.createElement("select");
        select.className = "tb-theme-selector";

        const themes = {
            "default": {
                "--primary-color": "#b7e4ba",
                "--primary-bg-color": "#34699A",
                "--sidebar-bg-color": "#b7e4ba",
                "--sidebar-menu-bg": "#95d59d",
                "--sidebar-menu-color": "#24352a",
                "--sidebar-menu-hover-bg": "#52b776",
                "--sidebar-menu-active-bg": "#40915d"
            },
            "Pastel Grass": {
                "--primary-color": "#b7e4ba",
                "--primary-bg-color": "#95d59d",
                "--sidebar-bg-color": "#74c691",
                "--sidebar-menu-bg": "#52b776",
                "--sidebar-menu-color": "#ffffff",
                "--sidebar-menu-hover-bg": "#2b2b2b",
                "--sidebar-menu-active-bg": "#3d3d3d",
                "--header-bg-color": "#52b776"
            },
            "pastel": {
                "--primary-color": "#9c27b0",
                "--primary-bg-color": "#f8f0ff",
                "--sidebar-bg-color": "#f3e5f5",
                "--sidebar-menu-bg": "#e1bee7",
                "--sidebar-menu-color": "#ffffff",
                "--sidebar-menu-hover-bg": "#d1c4e9",
                "--sidebar-menu-active-bg": "#b39ddb",
                "--header-bg-color":"#e1bee7"
            }
        };

        Object.keys(themes).forEach(key => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            select.appendChild(option);
        });

        // Apply saved theme
        const savedTheme = localStorage.getItem("selectedTheme");
        if (savedTheme && themes[savedTheme]) {
            select.value = savedTheme;
            applyTheme(themes[savedTheme]);
        }

        select.addEventListener("change", () => {
            const theme = select.value;
            localStorage.setItem("selectedTheme", theme);
            applyTheme(themes[theme]);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        container.appendChild(wrapper);

        function applyTheme(themeVars) {
            Object.keys(themeVars).forEach(varName => {
                document.body.style.setProperty(varName, themeVars[varName]);
            });

            // 🔑 Ensure --dark-color = --sidebar-menu-active-bg
            if (themeVars["--sidebar-menu-active-bg"]) {
                document.body.style.setProperty("--dark-color", themeVars["--sidebar-menu-active-bg"]);
                document.body.style.setProperty("--second-color", themeVars["--sidebar-menu-active-bg"]);
            }
                document.body.style.setProperty("--header-bg-color", themeVars["--sidebar-menu-bg"]);
        }
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

    // Create Builder UI
    let headerObserver = null;
    function createBuilderUI(controlsContainer) {
        if (!controlsContainer || document.getElementById("hl_header--themebuilder-icon")) return;

        const btn = document.createElement("a");
        btn.href = "javascript:void(0);";
        btn.id = "hl_header--themebuilder-icon";
        btn.className = "tb-btn-icon";
        btn.innerHTML = `<span style="font-size:18px;">🖌️</span>`;
        initTooltip(btn, "Theme Builder");
        controlsContainer.appendChild(btn);

        if (!document.getElementById('themeBuilderDrawer')) {
            const drawer = document.createElement("div");
            drawer.id = "themeBuilderDrawer";
            drawer.className = "tb-drawer";

            const headerBar = document.createElement('div');
            headerBar.className = "tb-drawer-header";

            const title = document.createElement('div');
            title.textContent = 'Theme Builder';
            title.className = "tb-drawer-title";

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = "tb-drawer-close";

            headerBar.appendChild(title);
            headerBar.appendChild(closeBtn);
            drawer.appendChild(headerBar);

            const contentWrapper = document.createElement('div');
            contentWrapper.className = "tb-drawer-content";
            drawer.appendChild(contentWrapper);

            // NEW: Add Select Theme before General Settings
            contentWrapper.appendChild(createSection("🎨 Select Theme", buildThemeSelectorSection));
            contentWrapper.appendChild(createSection("🎨 General Settings", buildThemeColorsSection));
            contentWrapper.appendChild(createSection("🔘 Button Style", buildButtonStyleSection));

            document.body.appendChild(drawer);

            btn.addEventListener('click', () => drawer.classList.add('open'));
            closeBtn.addEventListener('click', () => drawer.classList.remove('open'));

            applySavedSettings();
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
