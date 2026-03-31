(function () {
    let headerObserver = null;
    const MAX_ATTEMPTS = 40;
    window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
    let themes = {}; // global or module-level

    // --- Dynamically load Sortable.js ---
    (function loadSortable() {
        if (!window.Sortable) { // Only load if not already loaded
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
            script.onload = () => {
                //log("Sortable.js loaded successfully!");
                // ✅ You can now initialize Sortable here or later in your code
            };
            document.head.appendChild(script);
        }
    })();
    (function () {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
            link.crossOrigin = "anonymous";
            link.referrerPolicy = "no-referrer";
            document.head.appendChild(link);
        }
    })();
    (function loadFontAwesome() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
            link.crossOrigin = "anonymous";
            link.referrerPolicy = "no-referrer";
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
    // ✅ Create Loader Inside Theme Builder Drawer Only
    function createTBLoader() {
        if (document.getElementById("tb-loader-overlay")) return;

        const drawer = document.getElementById("themeBuilderDrawer");
        if (!drawer) return;

        const overlay = document.createElement("div");
        overlay.id = "tb-loader-overlay";
        overlay.style.display = "none"; // ✅ hidden by default
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.6)";
        overlay.style.zIndex = "99999";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.borderRadius = "10px";

        const loader = document.createElement("div");
        loader.className = "loader";
        overlay.appendChild(loader);

        drawer.appendChild(overlay);
    }
    function createSuccessGIF() {
        if (document.getElementById("tb-success-overlay")) return;

        const drawer = document.getElementById("themeBuilderDrawer");
        if (!drawer) return;

        const overlay = document.createElement("div");
        overlay.id = "tb-success-overlay";
        overlay.style.display = "none";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.6)";
        overlay.style.zIndex = "100000";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.borderRadius = "10px";

        const successGif = document.createElement("img");
        successGif.src = "https://themebuilder-six.vercel.app/images/check_mark.gif";
        successGif.style.width = "150px";
        successGif.style.height = "150px";
        successGif.style.objectFit = "contain";

        overlay.appendChild(successGif);
        drawer.appendChild(overlay);
    }

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

            const yesBtn = modal.querySelector("#jc-yes-btn");
            yesBtn.disabled = true; // ✅ Prevent double click

            const successOverlay = document.getElementById("tb-success-overlay");
            successOverlay.style.display = "flex";

            setTimeout(() => {
                successOverlay.style.display = "none";
                yesBtn.disabled = false; // Enable again if needed
                onYes && onYes();
            }, 800);
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

    // Utility to create section with optional icon
    function createSection(title, contentBuilder, icon = null) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";
        header.style.cursor = "var(--custom-pointer)";

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
                // OPEN section
                content.classList.add("open");
                content.style.maxHeight = "200px"; // Fixed open height
                toggleIcon.className = "fa-solid fa-angle-up tb-toggle-icon"; // 🔼

            } else {
                // CLOSE section
                content.style.maxHeight = content.scrollHeight + "px"; // set current height first
                content.offsetHeight; // force reflow
                content.style.maxHeight = "0px";
                content.classList.remove("open");
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
        "--primary-color": "Primary Color",
        "--second-color": "Secondary Color",

        // Sidebar gradient
        "--sidebar-bg-color": "Sidebar BG Start Color",
        "--sidebar-bg-end-color": "Sidebar BG End Color",

        "--sidebar-menu-bg": "Sidebar Menu BG Color",
        "--sidebar-menu-hover-bg": "Menu Hover Color",
        "--sidebar-menu-active-bg": "Menu Active BG Color",

        "--sidebar-menu-color": "Sidebar Text Color",
        "--sidebar-text-hover-color": "Sidebar Text Hover Color",
        "--sidebar-text-active-color": "Sidebar Text Active Color",
        "--sidebar-menu-icon-color": "Sidebar Icon Color",
        "--sidebar-menu-icon-hover-color": "Sidebar Icon Hover Color",
        "--sidebar-menu-icon-active-color": "Sidebar Icon Active Color",
        "--tw-text-opacity-color": "Menu Title Color",
        "--go-back-color": "Back Button Color",
        "--go-back-text-color": "Back Button Text Color",

        // Login page gradient
        "--login-background-gradient-start": "Login BG Start Color",
        "--login-background-gradient-end": "Login BG End Color"
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
        const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");

        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Get user-selected colors
        const start = getComputedStyle(document.body)
            .getPropertyValue("--login-background-gradient-start")
            .trim() || "#ffffff";

        const end = getComputedStyle(document.body)
            .getPropertyValue("--login-background-gradient-end")
            .trim() || start;

        let gradient;
      
        gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
        // Apply gradient
        document.body.style.setProperty("--login-background-active", gradient);

        // Save gradient
        savedThemeObj.themeData["--login-background-active"] = gradient;

        // Remove background image (unless default themes)
        if (selectedtheme !== 'Default Theme' && selectedtheme !== 'Default Light Theme') {
            delete savedThemeObj.themeData["--login-background-image"];
        }

        localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
    }
    // === Background Image Input ===
    function createLoginBackgroundImageInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Page Image URL";
        label.className = "tb-color-picker-label";

        // Get stored theme object
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Pull raw URL (strip any accidental url("..."))
        let storedImage = savedThemeObj.themeData["--login-background-image"] || "";
        storedImage = storedImage.replace(/^url\(["']?|["']?\)$/g, ""); // ✅ cleanup

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "tb-logo-input"; // reuse styling
        textInput.placeholder = "Enter image URL";
        textInput.value = storedImage; // ✅ always raw URL
        function applyImage(rawUrl) {
            // ✅ Strip accidental url("...") wrapper before saving
            const cleanUrl = rawUrl.replace(/^url\(["']?|["']?\)$/g, "").trim();
           
                // Save only the raw URL
                savedThemeObj.themeData["--login-background-image"] = `url('${cleanUrl}')`;;
            
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        textInput.addEventListener("input", () => {
            applyImage(textInput.value);
        });

        // Apply on load
        applyImage(storedImage);

        wrapper.appendChild(label);
        wrapper.appendChild(textInput);

        return wrapper;
    }
    function createColorPicker(labelText, storageKey, cssVar, applyFn) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label"); updateLoginBackgroundGradient
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
    async function loadThemes() {
        try {
            const res = await fetch("https://themebuilder-six.vercel.app/api/theme/getallthemes");
            const data = await res.json();

            // Convert array to key-value by themeName
            data.themes.forEach(t => {
                themes[t.themeName] = t.themeData;
            });
        } catch (err) {
            console.error("❌ Failed to load themes:", err);
        }
    }

    // Load themes once at startup
    loadThemes();

    function enableBlueWaveTopNav() {
        // Prevent duplicates
        if (document.getElementById("ghl_custom_topnav_wrapper_v4")) return;

        (function () {
            "use strict";
            if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;

            const WRAPPER_ID = "ghl_custom_topnav_wrapper_v4";
            const STYLE_ID = "ghl_custom_topnav_styles_v4";
            const LOGO_URL = "https://msgsndr-private.storage.googleapis.com/companyPhotos/47b7e157-d197-4ce5-9a94-b697c258702a.png";
            const MAX_BUILD_ATTEMPTS = 40;
            const BUILD_INTERVAL_MS = 700;

            const $q = s => document.querySelector(s);
            const $qa = s => Array.from(document.querySelectorAll(s));

            function injectStyles() {
                if ($q(`#${STYLE_ID}`)) return;
                const css = `
              header.hl_header, header.hl_header.--agency {
                width:100vw!important;left:0!important;right:0!important;margin:0!important;
                padding:6px 16px!important;background:#006AFF!important;z-index:9999!important;
                display:flex!important;align-items:center!important;justify-content:space-between!important;
              }
              #${WRAPPER_ID} {
                display:flex!important;align-items:center!important;gap:14px!important;
                flex:1 1 auto!important;overflow-x:auto!important;white-space:nowrap!important;
              }
              #${WRAPPER_ID} img {height:36px!important;cursor:pointer!important;flex-shrink:0!important;}
              #${WRAPPER_ID} nav {display:flex!important;gap:8px!important;align-items:center!important;}
              #${WRAPPER_ID} nav a {
                color:#fff!important;text-decoration:none!important;font-weight:500!important;
                padding:14px 17px!important;border-radius:4px!important; background: #1d7bcd40;
              }
              #${WRAPPER_ID} nav a:hover {background:rgba(255,255,255,0.15)!important;}
              aside#sidebar-v2,#sidebar-v2,.hl_sidebar,.hl_app_sidebar {
                display:none!important;width:0!important;min-width:0!important;visibility:hidden!important;opacity:0!important;
              }
              main,#app,.hl_main-content,.container {
                margin-left:0!important;padding-left:0!important;width:100%!important;
                max-width:100%!important;
              }
            `;
                const s = document.createElement("style");
                s.id = STYLE_ID;
                s.textContent = css;
                document.head.appendChild(s);
            }

            function hideSidebar() {
                const sels = ["aside#sidebar-v2", "#sidebar-v2", ".hl_sidebar", ".hl_app_sidebar"];
                sels.forEach(sel => {
                    $qa(sel).forEach(el => {
                        el.style.setProperty("display", "none", "important");
                        el.style.setProperty("width", "0", "important");
                        el.style.setProperty("min-width", "0", "important");
                        el.style.setProperty("visibility", "hidden", "important");
                        el.style.setProperty("opacity", "0", "important");
                    });
                });
            }

            function waitForSidebarReady(cb, maxWait = 6000) {
                const start = Date.now();
                const check = setInterval(() => {
                    const aside = $q("aside#sidebar-v2") || $q(".hl_app_sidebar") || $q(".hl_sidebar");
                    const links = aside ? aside.querySelectorAll("a[href]") : [];
                    if (links.length > 5 || Date.now() - start > maxWait) {
                        clearInterval(check);
                        cb(aside);
                    }
                }, 250);
            }

            function buildNavbarFromSidebar(aside) {
                const wrapper = document.createElement("div");
                wrapper.id = WRAPPER_ID;

                const logo = document.createElement("img");
                logo.src = LOGO_URL;
                logo.alt = "Logo";
                logo.addEventListener("click", () => window.location.href = "/v2/location");
                wrapper.appendChild(logo);

                const nav = document.createElement("nav");
                // INSERT LOCATION SWITCHER HERE
                //const loc = aside.querySelector("#location-switcher-sidbar-v2");
                //if (loc) {
                //    const clonedLoc = loc.cloneNode(true);
                //    clonedLoc.id = "bw-location-switcher";

                //    clonedLoc.style.transform = "scale(0.75)";
                //    clonedLoc.style.transformOrigin = "left center";
                //    clonedLoc.style.marginRight = "10px";

                //    clonedLoc.querySelectorAll("*").forEach(el => {
                //        el.style.color = "#fff";
                //    });

                //    wrapper.appendChild(clonedLoc);
                //}
                if (aside) {
                    const seen = new Set();
                    const links = aside.querySelectorAll("a[href]");

                    links.forEach(a => {
                        const name = a.textContent.trim();
                        const href = a.href;
                        if (!name || !href || seen.has(name)) return;
                        seen.add(name);

                        const link = document.createElement("a");
                        link.textContent = name;
                        link.href = href;
                        link.addEventListener("click", () => {
                            setTimeout(() => init(), 2000);
                        });

                        nav.appendChild(link);
                    });
                }

                wrapper.appendChild(nav);
                return wrapper;
            }

            function insertWrapperIfNeeded(aside) {
                const header = $q("header.hl_header.--agency") || $q("header.hl_header");
                if (!header || $q(`#${WRAPPER_ID}`)) return false;

                const wrapper = buildNavbarFromSidebar(aside);
                const right = header.querySelector(".hl_header__right,.hl_header--controls");
                const container = header.querySelector(".container-fluid") || header;
                //Old COde and working Fine without Location Selector
                //try {
                //    if (right && container) container.insertBefore(wrapper, right);
                //    else header.prepend(wrapper);

                //    return true;
                //} catch (e) {
                //    console.error("Navbar insert error", e);
                //    return false;
                //}
                try {
                    if (right && container) container.insertBefore(wrapper, right);
                    else header.prepend(wrapper);

                    // ⭐ ADD THIS HERE — the event binding ⭐
                    const topnavLocationBtn = document.querySelector("#bw-location-switcher");
                    if (topnavLocationBtn) {
                        topnavLocationBtn.addEventListener("click", () => {
                            const sidebarTrigger = document.querySelector("#location-switcher-sidbar-v2");

                            if (!sidebarTrigger) return;

                                    // Temporarily unhide the location switcher so GHL click works
                                    const originalStyles = {
                                        display: sidebarTrigger.style.display,
                                        visibility: sidebarTrigger.style.visibility,
                                        opacity: sidebarTrigger.style.opacity
                                    };

                                    sidebarTrigger.style.setProperty("display", "flex", "important");
                                    sidebarTrigger.style.setProperty("visibility", "visible", "important");
                                    sidebarTrigger.style.setProperty("opacity", "1", "important");

                                    // Now trigger GHL’s click
                                    sidebarTrigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                                    sidebarTrigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                                    sidebarTrigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

                                    // Re-hide it after 300ms
                                    setTimeout(() => {
                                        sidebarTrigger.style.display = originalStyles.display;
                                        sidebarTrigger.style.visibility = originalStyles.visibility;
                                        sidebarTrigger.style.opacity = originalStyles.opacity;
                                    }, 300);
                        });

                    }

                    return true;
                } catch (e) {
                    console.error("Navbar insert error", e);
                    return false;
                }

            }

            function init() {
                injectStyles();
                hideSidebar();

                waitForSidebarReady((aside) => {
                    let attempts = 0;
                    const timer = setInterval(() => {
                        attempts++;
                        const ok = insertWrapperIfNeeded(aside);
                        hideSidebar();
                        if (ok || attempts >= MAX_BUILD_ATTEMPTS) clearInterval(timer);
                    }, BUILD_INTERVAL_MS);
                });
            }
            let debounceTimer = null;

            // Only create observer WHEN topnav is enabled
            if (window.__BLUEWAVE_TOPNAV_ENABLED__) {

                window.__BLUEWAVE_OBSERVER__ = new MutationObserver(() => {
                    if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return; // safety check
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => init(), 700);
                });

                const startObserver = () => {
                    window.__BLUEWAVE_OBSERVER__.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                };

                if (document.readyState === "complete" || document.readyState === "interactive") {
                    setTimeout(() => {
                        if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;
                        init();
                        startObserver();
                    }, 200);

                } else {
                    window.addEventListener("DOMContentLoaded", () => {
                        if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;
                        init();
                        startObserver();
                    });
                }
            }

        })();
    }
    function forceRemoveBlueWaveTopNav() {
        let attempts = 0;
        const maxAttempts = 20; // 20 × 50ms = 1 second

        const interval = setInterval(() => {
            attempts++;

            const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
            const style = document.getElementById("ghl_custom_topnav_styles_v4");

            if (wrapper) wrapper.remove();
            if (style) style.remove();

            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }

        }, 50);
    }
    function disableBlueWaveTopNav() {
        // ⛔ Stop re-inserting TopNav
        if (window.__BLUEWAVE_OBSERVER__) {
            window.__BLUEWAVE_OBSERVER__.disconnect();
        }
        const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
        const style = document.getElementById("ghl_custom_topnav_styles_v4");

        if (wrapper) wrapper.remove();
        if (style) style.remove();

        // Restore sidebar
        const sidebars = document.querySelectorAll(
            "aside#sidebar-v2, #sidebar-v2, .hl_sidebar, .hl_app_sidebar"
        );

        sidebars.forEach(el => {
            el.style.removeProperty("display");
            el.style.removeProperty("width");
            el.style.removeProperty("min-width");
            el.style.removeProperty("visibility");
            el.style.removeProperty("opacity");
        });

        forceRemoveBlueWaveTopNav();

        forceSidebarOpen();
    }
    function resetGhlSidebar() {
       
        const sidebar = document.querySelector("#sidebar-v2");
        const body = document.body;

        // Remove forced hidden inline styles
        sidebar.style.display = "";
        sidebar.style.width = "";
        sidebar.style.minWidth = "";
        sidebar.style.visibility = "";
        sidebar.style.opacity = "";

        // Remove GHL's collapsed class if it exists
        body.classList.remove("sidebar-collapsed");

        // Reset localStorage collapse state
        localStorage.setItem("sidebarCollapsed", "false");
    }
    function forceSidebarOpen() {
     
        const sidebar = document.querySelector("#sidebar-v2")
            || document.querySelector(".hl_app_sidebar")
            || document.querySelector(".hl_sidebar");

        if (!sidebar) return;

        const fix = () => {
            sidebar.style.display = "block";
            sidebar.style.width = "14rem";
            sidebar.style.minWidth = "14rem";
            sidebar.style.visibility = "visible";
            sidebar.style.opacity = "1";
        };

        // Apply immediately
        fix();

        // Prevent GHL from collapsing again
        const observer = new MutationObserver(() => fix());
        observer.observe(sidebar, { attributes: true, attributeFilter: ["style", "class"] });
    }
    let mainCssLoaded = false;
    function loadMainCSS() {
        if (mainCssLoaded) return; // 🚀 prevent re-loading

        const existing = document.getElementById("main-css-link");
        if (existing) return; // already loaded via <link>

        const link = document.createElement("link");
        link.id = "main-css-link";
        link.rel = "stylesheet";
        link.href = "https://themebuilder-six.vercel.app/main.css";

        document.head.appendChild(link);

        mainCssLoaded = true;
    }
    // NEW: Theme Selector Section
    function buildThemeSelectorSection(container) {
        if (!container) return;
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");
        // inject minimal styles once
        if (!document.getElementById("tb-theme-selector-styles")) {
            const s = document.createElement("style");
            s.id = "tb-theme-selector-styles";
            s.textContent = `
        .themeSelectWrapper{position:relative;display:inline-flex;align-items:center}
        .tb-theme-cycle-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:none;cursor:'var(--custom-pointer)';font-weight:600;min-width:160px;justify-content:space-between}
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
        textSpan.textContent = selectedtheme || "Select Theme";

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
        // const themes = darkthemes();
        const themeKeys = Object.keys(themes);
        let currentIndex = -1;
        
        // apply theme (merges theme vars into saved themeData to avoid overwriting other keys)
        async function applyTheme(themeName, themeVars) {
            const vars = themeVars || themes[themeName];
            if (!vars) return;

            // Apply theme variables
            Object.entries(vars).forEach(([key, value]) => {
                if (value && value !== "undefined") {
                    document.body.style.setProperty(key, value);
                }
            });

            // Update UI
            textSpan.textContent = themeName;
            themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff";
            themeBtn.style.color = "#fff";

            // Save
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            // 🧹 Remove mode before merging
            if (savedThemeObj.themeData && savedThemeObj.themeData["--theme-mode"]) {
                delete savedThemeObj.themeData["--theme-mode"];
            }

            // Merge and save
            savedThemeObj.themeData = { ...(savedThemeObj.themeData || {}), ...vars };
            savedThemeObj.selectedTheme = themeName;

            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            localStorage.setItem("themebuilder_selectedTheme", themeName);
            // injectMenuConfigIntoTheme();
            window.dispatchEvent(new Event("themeChanged"));
            // ----------------------------------------------
            // 🔵 APPLY TOP NAV FOR BlueWave TopNav Theme ONLY
            // ----------------------------------------------
            const isSubAccount = window.location.pathname.startsWith("/v2/location/");

            if (themeName === "BlueWave TopNav Theme" && isSubAccount) {
                window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
                enableBlueWaveTopNav();
            } else {
                window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
                resetGhlSidebar();
                disableBlueWaveTopNav();
            }
        }

        // restore saved theme if exists
        if (selectedtheme) {
            applyTheme(selectedtheme, savedThemeObj.themeData);
            if (themeKeys.includes(selectedtheme)) {
                currentIndex = themeKeys.indexOf(selectedtheme);
            }
        }

        // cycle themes when clicking main area of button (but not when clicking the arrow)
        // themeBtn.addEventListener("click", (e) => {
        //     // if the click target is the arrow or inside it, ignore (arrow handles dropdown)
        //     if (e.target.closest(".themeArrowIcon")) return;
        //     currentIndex = (currentIndex + 1) % themeKeys.length;
        //     applyTheme(themeKeys[currentIndex], null);
        // });

        // populate dropdown
        themeKeys.forEach(themeName => {
            const optBtn = document.createElement("button");
            optBtn.type = "button";
            optBtn.textContent = themeName;
            optBtn.addEventListener("click", async (ev) => {
                ev.stopPropagation();
                if(!selectedtheme){
                    loadMainCSS();
                }
                applyTheme(themeName,null);
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
            "--sidebar-menu-active-bg",
            "--sidebar-menu-color",
            "--sidebar-text-hover-color",
            "--sidebar-text-active-color",
            "--sidebar-menu-icon-color",
            "--sidebar-menu-icon-hover-color",
            "--sidebar-menu-icon-active-color",
            "--tw-text-opacity-color",
            "--go-back-color",
            "--go-back-text-color"
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
                header.textContent = "Main Theme Colors";
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
        label.textContent = "Font Family";
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
            "Roboto",
            "Open Sans",
            "Lato",
            "Montserrat",
            "Ubuntu",
            "Source Sans Pro",
            "Noto Sans",
            "Inter",
            "Playfair Display",
            "Merriweather",
            "Raleway",
            "Nunito",
            "Work Sans",
            "Rubik",
            "Mulish",
            "Kanit",
            "Oswald",
            "Quicksand",
            "Fira Sans",
            "PT Sans",
            "Josefin Sans",
            "Inconsolata",
            "Manrope",
            "Overpass",
            "Cabin",
            "Asap",
            "Barlow",
            "Heebo",
            "Exo 2",
            "Hind",
            "Karla",
            "Titillium Web",
            "DM Sans",
            "Zilla Slab"
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

    // ⬇️ Create Login Card BG Gradient Picker (Start + End colors)
    function createLoginCardGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG Start Color",
            null,
            "--login-card-bg-gradient-start",
            updateLoginCardBackgroundGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG End Color",
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
            "Button Start Color",
            null,
            "--login-button-gradient-start",
            updateLoginButtonGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Button End Color",
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

    /* ========== Border Radius Input ========== */
    function createLoginButtonBorderRadiusInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Border Radius";
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
        label.textContent = "Button Text Color";
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
    function createLoginButtonHoverBgColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Hover Color";
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
        label.textContent = "Button Hover Text Color";
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
    function createLoginButtonTextInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Text";
        label.className = "tb-color-picker-label";

        // Load saved value from localStorage or fallback
        let savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        let storedText =
            savedThemeObj.themeData["--login-button-text"] || "Sign in";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "tb-logo-input";
        input.value = storedText;

        function applyButtonText(text) {
            // Trim whitespace
            text = text.trim();

            // 1️⃣ Wrap in quotes only if not already wrapped
            let cssText = text;
            if (!/^".*"$/.test(text)) { // regex checks if text starts and ends with "
                cssText = `"${text}"`;
            }

            // 1️⃣ Apply to CSS variable
            document.body.style.setProperty("--login-button-text", cssText);

            // 2️⃣ Apply directly to login button
            const loginBtn = document.querySelector(
                ".hl_login .hl_login--body button.hl-btn"
            );
            if (loginBtn) loginBtn.textContent = text;

            // 3️⃣ Save to localStorage
            savedThemeObj.themeData["--login-button-text"] = cssText;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // Live update
        input.addEventListener("input", () => {
            applyButtonText(input.value.trim());
        });

        // Apply immediately on load
        applyButtonText(storedText);

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        return wrapper;
    }

    /* ========== Link Text Color Picker ========== */
    function createLoginLinkTextColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Links Text Color";
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

    /* ========== Link Text Font Size Input (with same classes as Border Radius) ========== */
    // Create Heading Controls
    function addLoaderColorSettings(container) {
        if (document.getElementById("tb-loader-color-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-settings";
        wrapper.id = "tb-loader-color-settings";

        // 🏷️ Title
        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Loader Colors";
        wrapper.appendChild(title);

        // ℹ️ Instruction
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "🎨 Set loader dot color and background gradient.";
        wrapper.appendChild(instruction);

        // 🧠 Theme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        // =========================
        // Helpers
        // =========================
        function hexToRgb(hex) {
            return [
                parseInt(hex.substr(1, 2), 16),
                parseInt(hex.substr(3, 2), 16),
                parseInt(hex.substr(5, 2), 16)
            ].join(", ");
        }

        function rgbToHex(rgb) {
            const parts = rgb.split(",").map(v => parseInt(v.trim(), 10));
            return (
                "#" +
                parts.map(v => v.toString(16).padStart(2, "0")).join("")
            );
        }

        // =========================
        // 🔵 Loader Dot Color
        // =========================
        let storedRgb =
            themeData["--loader-color-rgb"] ||
            getComputedStyle(document.body).getPropertyValue("--loader-color-rgb") ||
            "255, 255, 255";

        let dotHex = rgbToHex(storedRgb);

        const dotWrapper = document.createElement("div");
        dotWrapper.className = "tb-color-picker-wrapper";

        const dotLabel = document.createElement("label");
        dotLabel.className = "tb-color-picker-label";
        dotLabel.textContent = "Loader Dot Color";

        const dotInput = document.createElement("input");
        dotInput.type = "color";
        dotInput.className = "tb-color-input";
        dotInput.value = dotHex;

        const dotCode = document.createElement("input");
        dotCode.type = "text";
        dotCode.className = "tb-color-code";
        dotCode.value = dotHex;

        function applyDot(hex) {
            if (!/^#[0-9A-F]{6}$/i.test(hex)) return;
            document.body.style.setProperty("--loader-color-rgb", hexToRgb(hex));
            themeData["--loader-color-rgb"] = hexToRgb(hex);
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            dotInput.value = dotCode.value = hex;
        }

        dotInput.oninput = () => applyDot(dotInput.value);
        dotCode.oninput = () => applyDot(dotCode.value);

        applyDot(dotHex);

        dotWrapper.append(dotLabel, dotInput, dotCode);
        wrapper.appendChild(dotWrapper);

        // =========================
        // 🌈 Loader Background Gradient
        // =========================
        let startColor = "#000000";
        let endColor = "#000000";

        const storedGradient = themeData["--loader-background-color"];
        if (storedGradient?.includes("#")) {
            const matches = storedGradient.match(/#[0-9A-F]{6}/gi);
            if (matches?.length >= 2) {
                startColor = matches[0];
                endColor = matches[1];
            }
        }

        function applyGradient() {
            const gradient = `linear-gradient(135deg, ${startColor}, ${endColor})`;
            document.body.style.setProperty("--loader-background-color", gradient);
            themeData["--loader-background-color"] = gradient;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // 🟢 START COLOR PICKER
        const startWrapper = document.createElement("div");
        startWrapper.className = "tb-color-picker-wrapper";

        const startLabel = document.createElement("label");
        startLabel.className = "tb-color-picker-label";
        startLabel.textContent = "Loader Background Start Color";

        const startInput = document.createElement("input");
        startInput.type = "color";
        startInput.className = "tb-color-input";
        startInput.value = startColor;

        const startCode = document.createElement("input");
        startCode.type = "text";
        startCode.className = "tb-color-code";
        startCode.value = startColor;

        startInput.oninput = () => {
            startColor = startCode.value = startInput.value;
            applyGradient();
        };

        startCode.oninput = () => {
            if (/^#[0-9A-F]{6}$/i.test(startCode.value)) {
                startColor = startInput.value = startCode.value;
                applyGradient();
            }
        };

        startWrapper.append(startLabel, startInput, startCode);

        // 🔵 END COLOR PICKER
        const endWrapper = document.createElement("div");
        endWrapper.className = "tb-color-picker-wrapper";

        const endLabel = document.createElement("label");
        endLabel.className = "tb-color-picker-label";
        endLabel.textContent = "Loader Background End Color";

        const endInput = document.createElement("input");
        endInput.type = "color";
        endInput.className = "tb-color-input";
        endInput.value = endColor;

        const endCode = document.createElement("input");
        endCode.type = "text";
        endCode.className = "tb-color-code";
        endCode.value = endColor;

        endInput.oninput = () => {
            endColor = endCode.value = endInput.value;
            applyGradient();
        };

        endCode.oninput = () => {
            if (/^#[0-9A-F]{6}$/i.test(endCode.value)) {
                endColor = endInput.value = endCode.value;
                applyGradient();
            }
        };

        endWrapper.append(endLabel, endInput, endCode);

        applyGradient();

        wrapper.append(startWrapper, endWrapper);
        container.appendChild(wrapper);
    }

    function createLoginHeadingControls() {
        const wrapper = document.createElement("div");

        // Shared savedThemeObj (only once!)
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Font Size Input ===
        const sizeWrapper = document.createElement("div");
        sizeWrapper.className = "tb-color-picker-wrapper";

        const sizeLabel = document.createElement("label");
        sizeLabel.textContent = "Heading Font Size (px)";
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
        colorLabel.textContent = "Heading Text Color";
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

        //// === Heading Text Input ===
        //const textWrapper = document.createElement("div");
        //textWrapper.className = "tb-color-picker-wrapper";

        //const textLabel = document.createElement("label");
        //textLabel.textContent = "Heading Text";
        //textLabel.className = "tb-color-picker-label";

        //let storedText =
        //    themeData["--login-headline-text"] ||
        //    "Sign into your account";

        //const textInput = document.createElement("input");
        //textInput.type = "text";
        //textInput.className = "tb-logo-input"; // reuse styling
        //textInput.value = storedText;

        //function applyText(text) {
        //    // 1️⃣ Apply to CSS variable
        //    // Trim whitespace
        //    text = text.trim();

        //    // 1️⃣ Wrap in quotes only if not already wrapped
        //    let cssText = text;
        //    if (!/^".*"$/.test(text)) { // regex checks if text starts and ends with "
        //        cssText = `"${text}"`;
        //    }

        //    // 1️⃣ Apply to CSS variable
        //    document.body.style.setProperty("--login-headline-text", cssText);

        //    // 2️⃣ Apply to actual heading DOM if it exists
        //    const heading = document.querySelector(".hl_login .hl_login--body .login-card-heading h2");
        //    if (heading) heading.textContent = text;

        //    // 3️⃣ Save in localStorage
        //    savedThemeObj.themeData["--login-headline-text"] = cssText; // save with quotes
        //    localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        //}

        //// Save live while typing
        //textInput.addEventListener("input", () => {
        //    applyText(textInput.value.trim());
        //});

        //// Apply immediately on load
        //applyText(storedText);

        //textWrapper.appendChild(textLabel);
        //textWrapper.appendChild(textInput);

        //textWrapper.appendChild(textLabel);
        //textWrapper.appendChild(textInput);

        // Put them together
        wrapper.appendChild(sizeWrapper);
        wrapper.appendChild(colorWrapper);
        //wrapper.appendChild(textWrapper);

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
        section.dataset.section = "header-gradient";

        // === Section Title ===
        const header = document.createElement("h4");
        header.className = "tb-header-controls";
        header.textContent = "Header Color";
        section.appendChild(header);

        // === Gradient Controls Wrapper ===
        const gradientWrapper = document.createElement("div");
        gradientWrapper.className = "tb-gradient-controls";

        // === Load saved state ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Disable logic ===
        const disabledThemes = ["Default Theme", "OceanMist Theme"];

        function shouldDisableHeaderSection() {
            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";
            return disabledThemes.includes(selectedTheme);
        }

        function toggleDisableState() {
            const disable = shouldDisableHeaderSection();
            const inputs = section.querySelectorAll("input, select, button, textarea");

            inputs.forEach((input) => {
                input.disabled = disable;
                input.style.cursor = disable ? "not-allowed" : "pointer";
            });

            section.style.opacity = disable ? "0.6" : "1";
            section.style.pointerEvents = disable ? "none" : "auto";
            // pointer-events none will block all interaction
            // opacity gives visual feedback
        }

        // ✅ If themeData has a gradient string, extract start & end colors
        if (themeData["--header-main-bg-gradient"]) {
            const gradient = themeData["--header-main-bg-gradient"];
            const colors = gradient.match(/#([0-9A-F]{6})/gi);

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            if (colors && colors.length >= 2) {
                if (selectedTheme === "VelvetNight Theme") {
                    // ✅ FIRST and LAST colors only
                    themeData["--header-gradient-start"] = colors[0];
                    themeData["--header-gradient-end"] = colors[colors.length - 1];
                } else {
                    // ✅ Normal themes
                    themeData["--header-gradient-start"] = colors[0];
                    themeData["--header-gradient-end"] = colors[1];
                }
            }
        }


        const headerEl = document.querySelector(".hl_header");

        // === Update Gradient Preview ===
        // function updateGradientPreview() {
        //     if (!headerEl || !startPicker || !endPicker) return;

        //     const start = startPicker.input.value;
        //     const end = endPicker.input.value;

        //     const stop = 0;
        //     const angle = 90;

        //     const gradient = `linear-gradient(${angle}deg, ${start} ${stop}%, ${end} 100%)`;

        //     document.body.style.setProperty("--header-gradient-start", start);
        //     document.body.style.setProperty("--header-gradient-end", end);
        //     document.body.style.setProperty("--header-gradient-stop", stop + "%");
        //     document.body.style.setProperty("--header-gradient-angle", angle + "deg");
        //     document.body.style.setProperty("--header-main-bg-gradient", gradient);

        //     headerEl.style.setProperty("background", "none", "important");
        //     headerEl.style.setProperty("background-image", "var(--header-main-bg-gradient)", "important");
        // }
        function updateGradientPreview() {
            if (!headerEl || !startPicker || !endPicker) return;

            const start = startPicker.input.value;
            const end = endPicker.input.value;

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            let gradient;

            if (selectedTheme === "VelvetNight Theme") {
                // ✅ Special velvet gradient with white separator
                gradient = `
                    linear-gradient(
                        225deg,
                        ${start} 22%,
                        #FFFFFF 22%,
                        #F6F2FA 23%,
                        ${end} 23%
                    )
                `;
            } else {
                // ✅ Default behavior for all other themes
                const stop = 0;
                const angle = 90;
                gradient = `linear-gradient(${angle}deg, ${start} ${stop}%, ${end} 100%)`;

                document.body.style.setProperty("--header-gradient-stop", stop + "%");
                document.body.style.setProperty("--header-gradient-angle", angle + "deg");
            }

            // ✅ Apply CSS variables
            document.body.style.setProperty("--header-gradient-start", start);
            document.body.style.setProperty("--header-gradient-end", end);
            document.body.style.setProperty("--header-main-bg-gradient", gradient.trim());

            // ✅ Force header background
            headerEl.style.setProperty("background", "none", "important");
            headerEl.style.setProperty(
                "background-image",
                "var(--header-main-bg-gradient)",
                "important"
            );

            // ✅ Persist
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--header-main-bg-gradient"] = gradient.trim();
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }


        // === Color picker helper ===
        function makePicker(labelText, cssVar, fallback = "#007bff") {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            let initial =
                themeData[cssVar] ||
                getComputedStyle(document.body).getPropertyValue(cssVar).trim() ||
                fallback;

            if (!/^#[0-9A-F]{6}$/i.test(initial)) {
                initial = fallback;
            }

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";
            colorInput.value = initial;

            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            function applyColor(color) {
                if (!/^#[0-9A-F]{6}$/i.test(color)) return;

                colorInput.value = color;
                colorCode.value = color;

                document.body.style.setProperty(cssVar, color);

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[cssVar] = color;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));

                updateGradientPreview();
            }

            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            setTimeout(() => applyColor(initial), 0);

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return { wrapper, input: colorInput, code: colorCode };
        }

        // === Create Inputs ===
        const startPicker = makePicker("Start Color For Header", "--header-gradient-start", "#ffffff");
        const endPicker = makePicker("End Color For Header", "--header-gradient-end", "#ffffff");

        gradientWrapper.appendChild(startPicker.wrapper);
        gradientWrapper.appendChild(endPicker.wrapper);

        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "💡 For Flat Color in Header: Choose the same color for Start & End";
        gradientWrapper.appendChild(instruction);

        section.appendChild(gradientWrapper);
        container.appendChild(section);

        // Initial Preview
        updateGradientPreview();

        // ✅ Initial disable state check
        toggleDisableState();

        // === 💡 Runtime theme change listener ===
        window.addEventListener("themeChanged", toggleDisableState);

        return section;
    }
    function buildProfileButtonControls(section) {
        const profileWrapper = document.createElement("div");
        profileWrapper.className = "tb-profile-btn-controls";

        const title = document.createElement("h4");
        title.className = "tb-profile-title";
        title.textContent = "Profile Button";
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
        title.textContent = "Header Buttons";
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
        title.innerText = "Dashboard Card Settings";
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

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            let gradient;

            if (selectedTheme === "VelvetNight Theme") {
                // ✅ Velvet Night: white separator preserved
                gradient = `
                    linear-gradient(
                        225deg,
                        ${start} 22%,
                        #FFFFFF 22%,
                        #F6F2FA 23%,
                        ${end} 23%
                    )
                `.trim();
            } else {
                // ✅ Default behavior
                gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
            }

            // Apply to card header
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

            // Persist
            saveVar("--card-header-bg-gradient", gradient);
        }

        // function updateCardGradient() {
        //     const start = themeData["--card-header-gradient-start"] || "#344391";
        //     const end = themeData["--card-header-gradient-end"] || "#1f2c66";
        //     const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

        //     const styleId = "tb-card-gradient-style";
        //     let styleTag = document.getElementById(styleId);
        //     if (!styleTag) {
        //         styleTag = document.createElement("style");
        //         styleTag.id = styleId;
        //         document.head.appendChild(styleTag);
        //     }
        //     styleTag.innerHTML = `.h1-card-header { background-image: ${gradient} !important; }`;

        //     saveVar("--card-header-bg-gradient", gradient);
        // }

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
        title.innerText = "Dashboard Background Color";
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
    function addCursorSelectorSettings(container) {
        if (document.getElementById("tb-cursor-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-cursor-settings";
        wrapper.id = "tb-cursor-settings";
        // wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Custom Cursor";
        title.style.cursor = "var(--custom-pointer,auto)"; // make it look clickable
        wrapper.appendChild(title);

        // const arrow = document.createElement("span");
        // arrow.innerHTML = "▶"; // right arrow
        // arrow.style.marginLeft = "8px";
        // title.appendChild(arrow);
           // Arrow Icon (Font Awesome)
        const arrow = document.createElement("span");
        arrow.style.marginLeft = "8px";
        arrow.innerHTML = `<i class="fa-solid fa-angle-down" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff; padding: 0px 2px 0px 2px;"></i>`; // initial closed
        title.appendChild(arrow);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            if (value) {
                themeData[key] = value;
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
                document.body.style.setProperty(key, value);
            } else {
                delete themeData[key];
                localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
                document.body.style.removeProperty(key);
            }
        }

        // --- Cursor Options ---
        const cursorOptions = [
            { name: "Default Cursor", url: "https://themebuilder-six.vercel.app/images/defaultc-cursor.png", isDefault: true },
            { name: "Purple Cursor", url: "https://themebuilder-six.vercel.app/images/purple-cursor.png" },
            { name: "Sky Cursor", url: "https://themebuilder-six.vercel.app/images/sky-cursor.png" },
            { name: "Sky Blue Cursor", url: "https://themebuilder-six.vercel.app/images/skyblue-cusror.png" },
            { name: "Black New Cursor", url: "https://themebuilder-six.vercel.app/images/black-new.png" },
            { name: "Mouse Cursor", url: "https://themebuilder-six.vercel.app/images/mouse-cursor.png" },
            { name: "Purple Gradient Cursor", url: "https://themebuilder-six.vercel.app/images/purplegradient-cursor.png" },
            { name: "Yellow Orange Cursor", url: "https://themebuilder-six.vercel.app/images/yelloworange-cursor.png" },
            { name: "Mouse Sharp Cursor", url: "https://themebuilder-six.vercel.app/images/mousesharp-cursor.png" },
            { name: "Gradient Border Cursor", url: "https://themebuilder-six.vercel.app/images/gradientborder-cursor.png" },
            { name: "Transparent Cursor", url: "https://themebuilder-six.vercel.app/images/transperant-cursor.png" },
            { name: "Classic Cursor", url: "https://themebuilder-six.vercel.app/images/cursor.png" },
            { name: "Target Cursor", url: "https://themebuilder-six.vercel.app/images/target-cursor.png" }
        ];

        const cursorList = document.createElement("div");
        cursorList.className = "tb-cursor-list";
        wrapper.appendChild(cursorList);

        function renderCursorOptions() {
            cursorList.innerHTML = "";

            const savedCursor = themeData["--custom-cursor"];

            cursorOptions.forEach(cursor => {
                const item = document.createElement("div");
                item.className = "tb-cursor-item";
                item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                background: #f8f8f8;
                border-radius: 8px;
                padding: 8px 12px;
                margin-bottom: 8px;
                transition: background 0.3s;
            `;
                item.addEventListener("mouseenter", () => (item.style.background = "#f0e6ff"));
                item.addEventListener("mouseleave", () => (item.style.background = "#f8f8f8"));

                const img = document.createElement("img");
                img.className = "tb-cursor-image";
                img.style.width = "24px";
                img.style.height = "24px";
                img.src = cursor.url;

                const label = document.createElement("span");
                label.className = "tb-cursor-label";
                label.textContent = cursor.name;
                label.style.flex = "1";

                const toggle = document.createElement("input");
                toggle.className = "tb-cursor-radiobutton";
                toggle.type = "radio";
                toggle.name = "custom-cursor-toggle";

                // handle default cursor
                let cursorCSS = cursor.isDefault ? "auto" : `url("${cursor.url}") 0 0`;
                toggle.checked = savedCursor === cursorCSS;

                toggle.addEventListener("change", () => {
                    saveVar("--custom-cursor", cursorCSS);
                });

                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(toggle);
                cursorList.appendChild(item);
            });
        }

        renderCursorOptions();
        // --- Toggle cursor list slide on click ---
        title.addEventListener("click", () => {
            const icon = arrow.querySelector("i");

            if (cursorList.classList.contains("open")) {
                cursorList.classList.remove("open");

                icon.classList.remove("fa-angle-up");
                icon.classList.add("fa-angle-down");
            } else {
                cursorList.classList.add("open");

                icon.classList.remove("fa-angle-down");
                icon.classList.add("fa-angle-up");
            }
        });
        // title.addEventListener("click", () => {
        //     cursorList.classList.toggle("open"); // 'open' class triggers CSS slide
        //     arrow.innerHTML = cursorList.classList.contains("open") ? "▼" : "▶";

        // });
        container.appendChild(wrapper);
    }
    function addCursorPointerSelectorSettings(container) {
        if (document.getElementById("tb-cursor-pointer-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-cursor-settings";
        wrapper.id = "tb-cursor-pointer-settings";
        // wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Custom Pointer";
        title.style.cursor = "var(--custom-pointer,auto)";
        wrapper.appendChild(title);

        const arrow = document.createElement("span");
            arrow.style.marginLeft = "8px";
            arrow.innerHTML = `<i class="fa-solid fa-angle-down" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff;padding: 0px 2px 0px 2px;"></i>`; // initial closed
            title.appendChild(arrow);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        const pointerOptions = [
            { name: "Default Pointer", url: "https://themebuilder-six.vercel.app/images/default-pointer.png", isDefault: true },
            { name: "Orange Finger Pointer", url: "https://themebuilder-six.vercel.app/images/orangefinger-pointer.png" },
            { name: "Green Pointer", url: "https://themebuilder-six.vercel.app/images/green-pointer.png" },
            { name: "Black Pointer", url: "https://themebuilder-six.vercel.app/images/black-pointer.png" },
            { name: "Light Orange Pointer", url: "https://themebuilder-six.vercel.app/images/lightorange-pointer.png" },
            { name: "Golden Hand Pointer", url: "https://themebuilder-six.vercel.app/images/goldenhand-pointer.png" },
            { name: "Glow Hand Pointer", url: "https://themebuilder-six.vercel.app/images/glowhand-pointer.png" },
            { name: "Orange R Pointer", url: "https://themebuilder-six.vercel.app/images/oranger-pointer.png" },
            { name: "Sky Blue New Pointer", url: "https://themebuilder-six.vercel.app/images/skybluenew-pointer.png" },
            { name: "Classic Blue Pointer", url: "https://themebuilder-six.vercel.app/images/classicblue-pointer.png" },
            { name: "Black New Pointer", url: "https://themebuilder-six.vercel.app/images/blacknew-pointer.png" },
            { name: "Yellow Orange Pointer", url: "https://themebuilder-six.vercel.app/images/yelloworange-pointer.png" },
            { name: "Hand Pointer", url: "https://themebuilder-six.vercel.app/images/hand-pointer.png" }
        ];

        const pointerList = document.createElement("div");
        pointerList.className = "tb-cursor-list"; // DO NOT set display:none
        wrapper.appendChild(pointerList);

        function renderPointerOptions() {
            pointerList.innerHTML = "";
            const savedPointer = themeData["--custom-pointer"];

            pointerOptions.forEach(pointer => {
                const item = document.createElement("div");
                item.className = "tb-cursor-item";
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f8f8f8;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    transition: background 0.3s;
                `;
                item.addEventListener("mouseenter", () => item.style.background = "#fff1e0");
                item.addEventListener("mouseleave", () => item.style.background = "#f8f8f8");

                const img = document.createElement("img");
                img.src = pointer.url;
                img.alt = pointer.name;
                img.style.width = "24px";
                img.style.height = "24px";

                const label = document.createElement("span");
                label.textContent = pointer.name;
                label.style.flex = "1";

                const toggle = document.createElement("input");
                toggle.type = "radio";
                toggle.name = "custom-pointer-toggle";

                const pointerCSS = pointer.isDefault ? "pointer" : `url("${pointer.url}") 0 0, pointer`;
                toggle.checked = savedPointer === pointerCSS;

                toggle.addEventListener("change", () => {
                    saveVar("--custom-pointer", pointerCSS);
                });

                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(toggle);
                pointerList.appendChild(item);
            });
        }

        renderPointerOptions();

        title.addEventListener("click", () => {
                const icon = arrow.querySelector("i");

                if (pointerList.classList.contains("open")) {
                    pointerList.classList.remove("open");

                    icon.classList.remove("fa-angle-up");
                    icon.classList.add("fa-angle-down");
                } else {
                    pointerList.classList.add("open");

                    icon.classList.remove("fa-angle-down");
                    icon.classList.add("fa-angle-up");
                }
            });

        container.appendChild(wrapper);
    }
    async function addLoaderSelectorSettings(container) {
        if (document.getElementById("tb-loader-selector-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-loader-settings";
        wrapper.id = "tb-loader-selector-settings";

        // 🏷️ Title
        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Custom Loader";
        wrapper.appendChild(title);

        // ℹ️ Instructions
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent = `
                🧭 Quick Guide:
                1️⃣ Toggle Mode – Turn ON “Use Built-in Loaders” to pick a ready-made loader, or OFF to use your own logo. 
                2️⃣ Company Logo – Enter your logo URL and select an animation (Pulsating or Bouncing). 
                3️⃣ Built-in Loaders – Choose one from the list below when enabled. 
                ⚠️ Tip – Switching between Logo and Built-in modes automatically clears previous settings to avoid conflicts.
                `;
        wrapper.appendChild(instruction);

        // 🧩 Decode agencyId
        let agencyId = null;
        try {
            const encodedAgn = localStorage.getItem("agn");
            if (encodedAgn) agencyId = atob(encodedAgn);
            else throw new Error("agn not found in localStorage");
        } catch (err) {
            console.error("❌ Agency ID decode error:", err);
            wrapper.innerHTML = "<p style='color:red;'>Agency ID missing or invalid.</p>";
            container.appendChild(wrapper);
            return;
        }

        // 🧠 Load theme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        let storedLogoUrl = themeData["--loader-company-url"] || "";
        storedLogoUrl = storedLogoUrl.replace(/^url\(["']?|["']?\)$/g, "");

        // === Toggle (Mode Switch)
        const modeWrapper = document.createElement("div");
        modeWrapper.className = "tb-mode-toggle";

        const modeLabel = document.createElement("label");
        modeLabel.className = "tb-toggle-label";

        const modeCheckbox = document.createElement("input");
        modeCheckbox.type = "checkbox";
        modeCheckbox.className = "tb-toggle-checkbox";

        const isLoaderMode = !storedLogoUrl;
        modeCheckbox.checked = isLoaderMode;

        const toggleText = document.createElement("span");
        toggleText.textContent = "Use Built-in Loaders";
        modeLabel.appendChild(toggleText);
        modeLabel.appendChild(modeCheckbox);
        modeWrapper.appendChild(modeLabel);
        wrapper.appendChild(modeWrapper);

        // 💾 Save helper
        function saveVar(key, value) {
            if (!value) {
                delete themeData[key];
                document.body.style.removeProperty(key);
            } else {
                themeData[key] = value;
                document.body.style.setProperty(key, value);
            }
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
        }

        // 🖼️ === Company Logo Card ===
        const card = document.createElement("div");
        card.className = "tb-logo-card";

        const logoLabel = document.createElement("label");
        logoLabel.textContent = "Company Logo URL";
        logoLabel.className = "tb-color-picker-label";

        const logoInput = document.createElement("input");
        logoInput.type = "text";
        logoInput.className = "tb-logo-input-loader";
        logoInput.placeholder = "Enter your company logo URL";
        logoInput.value = storedLogoUrl;

        function applyLogoUrl(rawUrl) {
            const cleanUrl = rawUrl.replace(/^url\(["']?|["']?\)$/g, "").trim();
            if (cleanUrl) {
                saveVar("--loader-company-url", cleanUrl);
            } else {
                saveVar("--loader-company-url", "");
            }
        }

        logoInput.addEventListener("input", () => applyLogoUrl(logoInput.value));
        applyLogoUrl(storedLogoUrl);

        // 🌀 Animation Tabs
        const animationWrapper = document.createElement("div");
        animationWrapper.className = "tb-animation-tabs";

        const pulsatingBtn = document.createElement("button");
        pulsatingBtn.textContent = "Pulsating Logo";
        pulsatingBtn.className = "tb-animation-btn";

        const bouncingBtn = document.createElement("button");
        bouncingBtn.textContent = "Bouncing Logo";
        bouncingBtn.className = "tb-animation-btn";

        const savedAnimation = themeData["--animation-settings"] || "PulsatingLogo";
        if (savedAnimation === "PulsatingLogo") pulsatingBtn.classList.add("active");
        else bouncingBtn.classList.add("active");

        pulsatingBtn.addEventListener("click", () => {
            saveVar("--animation-settings", "PulsatingLogo");
            pulsatingBtn.classList.add("active");
            bouncingBtn.classList.remove("active");
        });

        bouncingBtn.addEventListener("click", () => {
            saveVar("--animation-settings", "BouncingLogo");
            bouncingBtn.classList.add("active");
            pulsatingBtn.classList.remove("active");
        });

        animationWrapper.appendChild(pulsatingBtn);
        animationWrapper.appendChild(bouncingBtn);

        card.appendChild(logoLabel);
        card.appendChild(logoInput);
        card.appendChild(animationWrapper);
        wrapper.appendChild(card);

        // === Loader List ===
        const loaderList = document.createElement("div");
        loaderList.className = "tb-loader-list";
        wrapper.appendChild(loaderList);

        // 🔁 Mode toggle logic
        function updateModeState() {
            const loaderEnabled = modeCheckbox.checked;

            // Enable / disable UI
            logoInput.disabled = loaderEnabled;
            card.classList.toggle("disabled", loaderEnabled);
            loaderList.classList.toggle("disabled", !loaderEnabled);

            // 🧹 Auto-clear inactive data
            if (loaderEnabled) {
                // ✅ Clear logo + animation data
                saveVar("--loader-company-url", "");
                saveVar("--animation-settings", "");
                logoInput.value = "";
                pulsatingBtn.classList.remove("active");
                bouncingBtn.classList.remove("active");
            } else {
                // ✅ Clear built-in loader CSS variable
                saveVar("--loader-css", "");
            }

            // Save mode type
            saveVar("--loader-mode", loaderEnabled ? "loaders" : "logo");
        }

        modeCheckbox.addEventListener("change", updateModeState);
        updateModeState();
        const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
        // 🌍 Fetch loaders
        async function fetchLoaders() {
            try {
                const res = await fetch(
                    `https://themebuilder-six.vercel.app/api/theme/Get-loader-css?email=${email}`
                );
                if (!res.ok) throw new Error("Failed to fetch loaders");
                const data = await res.json();
                renderLoaderOptions(
                data.loaders || [],
                data.activeLoaderId
                );            
                } catch (err) {
                console.error("❌ Error fetching loaders:", err);
                loaderList.innerHTML = "<p class='tb-error-text'>Failed to load loaders.</p>";
            }
        }

        // 🎨 Render loaders
        function renderLoaderOptions(loaders, activeLoaderId) {
            loaderList.innerHTML = "";
            const savedLoader =
                themeData["--loader-css"] && JSON.parse(themeData["--loader-css"]);

            loaders.forEach((loader) => {
                const item = document.createElement("div");
                item.className = "tb-loader-item";

                const img = document.createElement("img");
                img.src =
                    loader.previewImage ||
                    "https://themebuilder-six.vercel.app/images/dotsloader.png";
                img.alt = loader.loaderName;
                img.className = "tb-loader-img";

                const label = document.createElement("span");
                label.textContent = loader.loaderName;
                label.className = "tb-loader-label";

                const toggle = document.createElement("input");
                toggle.type = "radio";
                toggle.name = "custom-loader-toggle";
                toggle.className = "tb-loader-radio";

                // if ((savedLoader && savedLoader._id === loader._id) || loader.isActive)
                if ( (savedLoader && savedLoader._id === loader._id) ||  loader._id === activeLoaderId )
                    toggle.checked = true;

                toggle.addEventListener("change", () => {
                    const loaderData = { _id: loader._id };
                    saveVar("--loader-css", JSON.stringify(loaderData));
                });

                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(toggle);
                loaderList.appendChild(item);
            });
        }

        await fetchLoaders();
        container.appendChild(wrapper);
    }
    function addLogoUrlInputSetting(container) {
        if (document.getElementById("tb-logo-url-setting")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-logo-url-settings";
        wrapper.id = "tb-logo-url-setting";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Favicon URL";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveLogoVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        // Create a "picker‑style" wrapper similar to color picker in scrollbar settings
        const pickerWrapper = document.createElement("div");
        pickerWrapper.className = "tb-color-picker-wrapper"; // reuse same wrapper class
        // Note: in scrollbar settings, color picker wrapper contains a label + inputs side-by-side

        const label = document.createElement("label");
        label.className = "tb-color-picker-label";
        label.textContent = "Favicon URL";
        label.setAttribute("for", "tb-logo-input-field");

        const input = document.createElement("input");
        input.type = "text";
        input.id = "tb-logo-input-field";
        input.className = "tb-logo-input";
        input.placeholder = "https://example.com/favicon.ico";

        const savedLogo = themeData["--custom-logo-url"];
        if (savedLogo) {
            input.value = savedLogo;
        }

        input.addEventListener("change", () => {
            const url = input.value.trim();
            if (url) {
                const cssValue = `url("${url}")`;
                saveLogoVar("--custom-logo-url", url);
                saveLogoVar("--custom-logo-css", cssValue);
            }
        });

        input.addEventListener("keypress", e => {
            if (e.key === "Enter") {
                input.blur();
            }
        });

        pickerWrapper.appendChild(label);
        pickerWrapper.appendChild(input);
        wrapper.appendChild(pickerWrapper);

        container.appendChild(wrapper);
    }
    function addLogoSettings(container) {
        if (document.getElementById("tb-logo-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-logo-settings";
        wrapper.id = "tb-logo-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Sidebar Logo";
        wrapper.appendChild(title);

        // Load saved theme data
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            localStorage.setItem("userTheme", JSON.stringify(savedThemeObj));
            document.body.style.setProperty(key, value);
        }

        function updateSidebarLogo(forceUrl = null) {
            let url = forceUrl;

            if (!url) {
                url = getComputedStyle(document.documentElement)
                    .getPropertyValue("--agency-logo-url")
                    .trim()
                    .replace(/^"|"$/g, "");
            }

            if (!url) return;

            const img = document.querySelector(".agency-logo");
            if (img) {
                img.src = url;
                img.style.objectFit = "contain";
            }
        }



        /* -----------------------------------------
           LOGO URL INPUT
        ----------------------------------------- */
        const logoWrapper = document.createElement("div");
        logoWrapper.className = "tb-color-picker-wrapper";

        const logoLabel = document.createElement("label");
        logoLabel.className = "tb-color-picker-label";
        logoLabel.textContent = "Logo URL";

        const logoInput = document.createElement("input");
        logoInput.type = "text";
        logoInput.className = "tb-logo-input";
        logoInput.placeholder = "https://example.com/logo.png";

        const savedLogo = themeData["--agency-logo-url"] || themeData["--agency-logo"] || "";
        if (savedLogo) {
            let cleanURL = savedLogo.trim()
                .replace(/^url\(/i, "")
                .replace(/\)$/i, "")
                .replace(/^"|"$/g, "")
                .replace(/^'|'$/g, "");
            logoInput.value = cleanURL;
        }

        logoInput.addEventListener("input", () => {
            const url = logoInput.value.trim();
            if (!url) return;

            // Save both CSS and Raw URL versions
            saveVar("--agency-logo", `url("${url}")`);
            saveVar("--agency-logo-url", url);

            // Update IMG directly
            const img = document.querySelector(".agency-logo");
            if (img) {
                img.src = url;
            }
        });


        logoWrapper.appendChild(logoLabel);
        logoWrapper.appendChild(logoInput);
        wrapper.appendChild(logoWrapper);
        let tbWidth = parseInt(themeData["--logo-width"]) || 150;
        let tbHeight = parseInt(themeData["--logo-height"]) || 40;

        // --- WIDTH BLOCK ---
        const widthWrapper = document.createElement("div");
        widthWrapper.className = "tb-slider-block";

        // Label
        const widthLabel = document.createElement("label");
        widthLabel.className = "tb-slider-label";
        widthLabel.textContent = "Width";
        widthWrapper.appendChild(widthLabel);

        // Input row
        const widthInputRow = document.createElement("div");
        widthInputRow.className = "tb-input-row";

        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.min = "0";
        widthInput.value = tbWidth;
        widthInput.className = "tb-size-input";

        const widthPx = document.createElement("span");
        widthPx.textContent = "px";

        widthInputRow.appendChild(widthInput);
        widthInputRow.appendChild(widthPx);
        widthWrapper.appendChild(widthInputRow);

        // Slider
        const widthSlider = document.createElement("input");
        widthSlider.type = "range";
        widthSlider.min = "0";
        widthSlider.max = "100";
        widthSlider.value = tbWidth;
        widthSlider.className = "tb-range-slider";

        widthWrapper.appendChild(widthSlider);


        // --- HEIGHT BLOCK ---
        const heightWrapper = document.createElement("div");
        heightWrapper.className = "tb-slider-block";

        // Label
        const heightLabel = document.createElement("label");
        heightLabel.className = "tb-slider-label";
        heightLabel.textContent = "Height";
        heightWrapper.appendChild(heightLabel);

        // Input row
        const heightInputRow = document.createElement("div");
        heightInputRow.className = "tb-input-row";

        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.min = "0";
        heightInput.value = tbHeight;
        heightInput.className = "tb-size-input";

        const heightPx = document.createElement("span");
        heightPx.textContent = "px";

        heightInputRow.appendChild(heightInput);
        heightInputRow.appendChild(heightPx);
        heightWrapper.appendChild(heightInputRow);

        // Slider
        const heightSlider = document.createElement("input");
        heightSlider.type = "range";
        heightSlider.min = "0";
        heightSlider.max = "100";
        heightSlider.value = tbHeight;
        heightSlider.className = "tb-range-slider";

        heightWrapper.appendChild(heightSlider);
        function applyLogoSize() {
            const img = document.querySelector(".agency-logo");
            if (!img) return;

            img.style.width = tbWidth + "px";
            img.style.height = tbHeight + "px";

            saveVar("--logo-width", tbWidth + "px");
            saveVar("--logo-height", tbHeight + "px");
        }

        // --- EVENTS (unchanged) ---
        widthSlider.addEventListener("input", () => {
            tbWidth = parseInt(widthSlider.value);
            widthInput.value = tbWidth;
            //this.style.setProperty("--slider-fill", `${(this.value / this.max) * 100}%`);

            applyLogoSize();
        });

        widthInput.addEventListener("input", () => {
            tbWidth = parseInt(widthInput.value);
            widthSlider.value = tbWidth;
            //widthSlider.style.setProperty("--slider-fill", `${(tbWidth / widthSlider.max) * 100}%`);

            applyLogoSize();
        });

        heightSlider.addEventListener("input", () => {
            tbHeight = parseInt(heightSlider.value);
            heightInput.value = tbHeight;
            //this.style.setProperty("--slider-fill", `${(this.value / this.max) * 100}%`);

            applyLogoSize();
        });

        heightInput.addEventListener("input", () => {
            tbHeight = parseInt(heightInput.value);
            heightSlider.value = tbHeight;
            //heightSlider.style.setProperty("--slider-fill", `${(tbHeight / heightSlider.max) * 100}%`);

            applyLogoSize();
        });


        // --- Append to your settings container ---
        wrapper.appendChild(widthWrapper);
        wrapper.appendChild(heightWrapper);


        container.appendChild(wrapper);

        setTimeout(updateSidebarLogo, 500);
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
   function showPopupSelectionModal(menu, locationId, callback) {
    document.getElementById("tb-popup-selection-modal")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "tb-popup-selection-modal";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "100000";

    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "10px";
    modal.style.maxWidth = "600px";
    modal.style.width = "90%";
    modal.style.maxHeight = "80vh";
    modal.style.overflowY = "auto";
    modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

    const title = document.createElement("h3");
    title.textContent = `Select Popup for Locked Menu: ${menu.label}`;
    title.style.marginBottom = "15px";
    modal.appendChild(title);

    const content = document.createElement("div");
    modal.appendChild(content);

    let selectedType = "simple";
    let selectedUrl = "";
    let selectedHeadline = "";

    // Pre-load saved values if re-editing an existing lock
    const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const themeData = savedTheme.themeData || {};
    const lockedMenus = themeData["--lockedMenus"] ? JSON.parse(themeData["--lockedMenus"]) : {};
    const existingLock = locationId ? lockedMenus[locationId]?.[menu.id] : lockedMenus[menu.id];
    if (existingLock && typeof existingLock === "object") {
        if (existingLock.popupType) selectedType = existingLock.popupType;
        if (existingLock.popupUrl) selectedUrl = existingLock.popupUrl;
        if (existingLock.popupHeadline) selectedHeadline = existingLock.popupHeadline;
    }

    const popupOptions = [
        { type: "simple", title: "Simple Access Denied", description: "Basic access denied message." },
        { type: "upgrade", title: "Upgrade Required", description: "Prompts user to upgrade their plan." },
        { type: "contact", title: "Contact Admin", description: "Asks user to contact administrator." }
    ];

    popupOptions.forEach(option => {
        const card = document.createElement("div");
        card.style.border = "2px solid #ddd";
        card.style.borderRadius = "8px";
        card.style.padding = "15px";
        card.style.marginBottom = "15px";
        card.style.cursor = "pointer";
        card.style.transition = "0.2s ease";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "10px";

        if (option.type === selectedType) {
            card.style.borderColor = "#F54927";
            card.style.background = "#fff5f2";
        }

        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.alignItems = "center";
        topRow.style.justifyContent = "space-between";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "10px";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "popupType";
        radio.value = option.type;
        radio.checked = option.type === selectedType;

        const cardTitle = document.createElement("strong");
        cardTitle.textContent = option.title;

        left.appendChild(radio);
        left.appendChild(cardTitle);

        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.gap = "6px";

        const previewBtn = document.createElement("button");
        previewBtn.textContent = "Preview";
        previewBtn.style.padding = "5px 10px";
        previewBtn.style.border = "1px solid #ccc";
        previewBtn.style.borderRadius = "5px";
        previewBtn.style.background = "#f8f9fa";
        previewBtn.style.cursor = "pointer";
        previewBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showPreviewPopup(option.type, selectedUrl, selectedHeadline);
        });
        btnGroup.appendChild(previewBtn);

        // Customize button only for upgrade and contact types
        if (option.type === "upgrade" || option.type === "contact") {
            const customizeBtn = document.createElement("button");
            customizeBtn.textContent = "Customize";
            customizeBtn.style.padding = "5px 10px";
            customizeBtn.style.border = "1px solid #F54927";
            customizeBtn.style.borderRadius = "5px";
            customizeBtn.style.background = "#fff5f2";
            customizeBtn.style.color = "#F54927";
            customizeBtn.style.cursor = "pointer";
            customizeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                // Select this card first
                selectedType = option.type;
                document.querySelectorAll("#tb-popup-selection-modal .popup-card").forEach(c => {
                    c.style.borderColor = "#ddd";
                    c.style.background = "#fff";
                    c.querySelector("input[type='radio']").checked = false;
                });
                radio.checked = true;
                card.style.borderColor = "#F54927";
                card.style.background = "#fff5f2";
                // Open customize popup
                showCustomizePopup(option.type, selectedUrl, selectedHeadline, (savedUrl, savedHeadline) => {
                    selectedUrl = savedUrl;
                    selectedHeadline = savedHeadline;
                });
            });
            btnGroup.appendChild(customizeBtn);
        }

        topRow.appendChild(left);
        topRow.appendChild(btnGroup);

        const desc = document.createElement("p");
        desc.textContent = option.description;
        desc.style.margin = "0";
        desc.style.fontSize = "13px";
        desc.style.color = "#666";

        card.addEventListener("click", () => {
            selectedType = option.type;
            document.querySelectorAll("#tb-popup-selection-modal .popup-card").forEach(c => {
                c.style.borderColor = "#ddd";
                c.style.background = "#fff";
                c.querySelector("input[type='radio']").checked = false;
            });
            radio.checked = true;
            card.style.borderColor = "#F54927";
            card.style.background = "#fff5f2";
        });

        card.classList.add("popup-card");
        card.appendChild(topRow);
        card.appendChild(desc);
        content.appendChild(card);
    });

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "20px";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "10px 20px";
    cancelBtn.style.border = "1px solid #ccc";
    cancelBtn.style.borderRadius = "5px";
    cancelBtn.style.background = "#fff";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.addEventListener("click", () => {
        overlay.remove();
        const lockInput = document.getElementById(locationId ? `lock-${locationId}-${menu.id}` : `lock-global-${menu.id}`);
        if (lockInput) lockInput.checked = false;
    });
    buttonContainer.appendChild(cancelBtn);

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.padding = "10px 20px";
    okBtn.style.border = "none";
    okBtn.style.borderRadius = "5px";
    okBtn.style.background = "#F54927";
    okBtn.style.color = "#fff";
    okBtn.style.cursor = "pointer";
    okBtn.addEventListener("click", () => {
        overlay.remove();
        callback(selectedType, selectedUrl, selectedHeadline); // passes all 3 values
    });
    buttonContainer.appendChild(okBtn);

    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
    function showCustomizePopup(type, currentUrl, currentHeadline, onSave) {
        document.getElementById("tb-customize-popup")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-customize-popup";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200000;";

        const popup = document.createElement("div");
        popup.style.cssText = "background:#fff;padding:24px;border-radius:10px;max-width:400px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

        const popupTitle = document.createElement("h3");
        popupTitle.textContent = type === "upgrade" ? "Customize Upgrade Popup" : "Customize Contact Admin Popup";
        popupTitle.style.marginBottom = "16px";
        popup.appendChild(popupTitle);

        // Headline input
        const headlineLabel = document.createElement("label");
        headlineLabel.textContent = "Headline Text:";
        headlineLabel.style.cssText = "display:block;font-size:13px;font-weight:bold;margin-bottom:5px;";
        popup.appendChild(headlineLabel);

        const headlineInput = document.createElement("input");
        headlineInput.type = "text";
        headlineInput.value = currentHeadline || "";
        headlineInput.placeholder = type === "upgrade" ? "Upgrade Required 🚀" : "Restricted";
        headlineInput.style.cssText = "width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;font-size:13px;box-sizing:border-box;margin-bottom:14px;";
        popup.appendChild(headlineInput);

        // URL input
        const urlLabel = document.createElement("label");
        urlLabel.textContent = type === "upgrade" ? "Upgrade Button URL:" : "Contact Button URL:";
        urlLabel.style.cssText = "display:block;font-size:13px;font-weight:bold;margin-bottom:5px;";
        popup.appendChild(urlLabel);

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.value = currentUrl || "";
        urlInput.placeholder = "https://your-url.com";
        urlInput.style.cssText = "width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;font-size:13px;box-sizing:border-box;";
        popup.appendChild(urlInput);

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:10px;justify-content:flex-end;margin-top:20px;";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.cssText = "padding:8px 18px;border:1px solid #ccc;border-radius:5px;background:#fff;cursor:pointer;";
        cancelBtn.onclick = () => overlay.remove();

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.cssText = "padding:8px 18px;border:none;border-radius:5px;background:#F54927;color:#fff;cursor:pointer;";
        saveBtn.onclick = () => {
            onSave(urlInput.value.trim(), headlineInput.value.trim());
            overlay.remove();
        };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        popup.appendChild(btnRow);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }
    function buildFeatureLockSection(container) {
        let savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (savedTheme.themeData && typeof savedTheme.themeData === "string") {
            savedTheme.themeData = JSON.parse(savedTheme.themeData);
            localStorage.setItem("userTheme", JSON.stringify(savedTheme));
        }

        if (document.getElementById("tb-feature-lock-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-feature-lock-settings";
        wrapper.className = "tb-feature-lock-settings";

        const themeData = savedTheme.themeData || {};

        const agencyMenus = [
            { id: "sb_agency-dashboard", label: "Agency Dashboard" },
            { id: "sb_location-prospect", label: "Prospecting" },
            { id: "sb_agency-accounts", label: "Agency Accounts" },
            { id: "sb_agency-account-reselling", label: "Account Reselling" },
            { id: "sb_agency-marketplace", label: "Add-Ons" },
            { id: "sb_agency-affiliate-portal", label: "Affiliate Portal" },
            { id: "sb_agency-template-library", label: "Template Library" },
            { id: "sb_agency-partners", label: "Partners" },
            { id: "sb_agency-university", label: "University" },
            { id: "sb_saas-education", label: "SaaS Education" },
            { id: "sb_ghl-swag", label: "GHL Swag" },
            { id: "sb_agency-ideas", label: "Agency Ideas" },
            { id: "sb_mobile-app-customiser", label: "Mobile App Customiser" },
            { id: "sb_agency-account-snapshots", label: "Account Snapshots" },
        ];
        // 📁 MAIN SIDEBAR MENUS
        const sidebarMenus = [
            { id: "sb_launchpad", label: "Launchpad" },
            { id: "sb_dashboard", label: "Dashboard" },
            { id: "sb_conversations", label: "Conversations" },
            { id: "sb_opportunities", label: "Opportunities" },
            { id: "sb_calendars", label: "Calendars" },
            { id: "sb_contacts", label: "Contacts" },
            { id: "sb_payments", label: "Payments" },
            { id: "sb_reporting", label: "Reporting" },
            { id: "sb_email-marketing", label: "Email Marketing" },
            { id: "sb_automation", label: "Automation" },
            { id: "sb_sites", label: "Sites" },
            { id: "sb_app-media", label: "App Media" },
            { id: "sb_memberships", label: "Memberships" },
            { id: "sb_reputation", label: "Reputation" },
        ];

        // 📝 Instruction Paragraph for Lock & Hide Feature
        const lockHideInfo = document.createElement("p");
        lockHideInfo.className = "tb-instruction-text";
        lockHideInfo.style.marginBottom = "15px";
        lockHideInfo.style.lineHeight = "1.6";
        lockHideInfo.innerHTML = `
              🔒 <strong>How the Location-Based Lock & Hide Feature Works:</strong><br><br>
              1. Use the <strong>Configure Lock</strong> button to set which menus are locked for specific locations/subaccounts.<br>
              2. Use the <strong>Configure Hide</strong> button to set which menus are hidden for specific locations/subaccounts.<br>
              3. Enter the Location/Subaccount ID in the input field within the configuration modal.<br>
              4. Toggle the options for each menu item to apply per location.<br><br>
              ✨ <em>Note:</em> Settings are stored per location, allowing granular control over menu access and visibility.
            `;
        wrapper.appendChild(lockHideInfo);

        // Buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginBottom = "20px";

        const configureBtn = document.createElement("button");
        configureBtn.textContent = "Configure Lock & Hide";
        configureBtn.style.padding = "10px 20px";
        configureBtn.style.border = "none";
        configureBtn.style.borderRadius = "5px";
        configureBtn.style.background = "#F54927";
        configureBtn.style.color = "#fff";
        configureBtn.style.cursor = "pointer";
        configureBtn.addEventListener("click", () => openConfigureModal(agencyMenus, sidebarMenus));

        buttonContainer.appendChild(configureBtn);
        wrapper.appendChild(buttonContainer);

        container.appendChild(wrapper);

        // Function to open configure modal
        function openConfigureModal(agencyMenus, sidebarMenus) {
            // Remove existing modal
            document.getElementById("tb-configure-modal")?.remove();

            const overlay = document.createElement("div");
            overlay.id = "tb-configure-modal";
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.background = "rgba(0,0,0,0.5)";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.zIndex = "99999";

            const modal = document.createElement("div");
            modal.style.background = "#fff";
            modal.style.padding = "20px";
            modal.style.borderRadius = "10px";
            modal.style.maxWidth = "800px";
            modal.style.width = "90%";
            modal.style.maxHeight = "80vh";
            modal.style.overflowY = "auto";
            modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

            // Prevent clicks inside modal from closing it
            modal.addEventListener("click", (e) => e.stopPropagation());

            const title = document.createElement("h3");
            title.textContent = "Configure Lock & Hide Settings";
            title.style.marginBottom = "15px";
            modal.appendChild(title);

            const content = document.createElement("div");
            modal.appendChild(content);

            // Load all toggles
            loadAllToggles(content, agencyMenus, sidebarMenus);

            // Close button
            const closeBtn = document.createElement("button");
            closeBtn.textContent = "Close";
            closeBtn.style.padding = "10px 20px";
            closeBtn.style.border = "none";
            closeBtn.style.borderRadius = "5px";
            closeBtn.style.background = "#6c757d";
            closeBtn.style.color = "#fff";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.marginTop = "20px";
            closeBtn.addEventListener("click", () => overlay.remove());
            modal.appendChild(closeBtn);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        }

        // Function to load all toggles
        function loadAllToggles(content, agencyMenus, sidebarMenus) {
            content.innerHTML = "";

            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const themeData = savedTheme.themeData || {};
            const lockedMenus = themeData["--lockedMenus"] ? JSON.parse(themeData["--lockedMenus"]) : {};
            const hiddenMenus = themeData["--hiddenMenus"] ? JSON.parse(themeData["--hiddenMenus"]) : {};

            // Agency Level (Global)
            const agencyTitle = document.createElement("h4");
            agencyTitle.textContent = "Agency Level (Global Settings)";
            agencyTitle.style.marginTop = "20px";
            agencyTitle.style.marginBottom = "10px";
            content.appendChild(agencyTitle);

            // Header for agency
            const agencyHeader = document.createElement("div");
            agencyHeader.style.display = "flex";
            agencyHeader.style.justifyContent = "space-between";
            agencyHeader.style.fontWeight = "bold";
            agencyHeader.style.marginBottom = "10px";
            agencyHeader.style.borderBottom = "1px solid #ccc";
            agencyHeader.style.paddingBottom = "5px";

            const menuHeader = document.createElement("span");
            menuHeader.textContent = "Menu";
            menuHeader.style.flex = "1";

            const lockHeader = document.createElement("span");
            lockHeader.textContent = "Lock";
            lockHeader.style.width = "60px";
            lockHeader.style.textAlign = "center";

            const hideHeader = document.createElement("span");
            hideHeader.textContent = "Hide";
            hideHeader.style.width = "60px";
            hideHeader.style.textAlign = "center";

            agencyHeader.appendChild(menuHeader);
            agencyHeader.appendChild(lockHeader);
            agencyHeader.appendChild(hideHeader);
            content.appendChild(agencyHeader);

            agencyMenus.forEach(menu => {
                createToggleRow(menu, null, lockedMenus, hiddenMenus, content); // null for locationId since global
            });

            // Sub-Account Level
            const subTitle = document.createElement("h4");
            subTitle.textContent = "Sub-Account Level";
            subTitle.style.marginTop = "30px";
            subTitle.style.marginBottom = "10px";
            content.appendChild(subTitle);

            // Collect all configured location IDs
            const allLocations = new Set();
            Object.keys(lockedMenus).forEach(key => {
                if (typeof lockedMenus[key] === 'object') allLocations.add(key);
            });
            Object.keys(hiddenMenus).forEach(key => {
                if (typeof hiddenMenus[key] === 'object') allLocations.add(key);
            });
            const locationList = Array.from(allLocations);
            if (locationList.length === 0) locationList.push(""); // at least one empty

            // Create combined table
            const table = document.createElement("table");
            table.style.width = "auto"; // allow natural width for scrolling
            table.style.borderCollapse = "collapse";
            table.style.marginBottom = "20px";
            table.style.fontSize = "12px"; // smaller font
            table.style.tableLayout = "fixed"; // respect column widths

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            // First th: Menu
            const menuTh = document.createElement("th");
            menuTh.textContent = "Location ID";
            menuTh.style.border = "1px solid #ddd";
            menuTh.style.padding = "4px";
            menuTh.style.background = "#f2f2f2";
            menuTh.style.fontSize = "10px";
            menuTh.style.width = "167px"; // wider for location ID
            headerRow.appendChild(menuTh);

            // Th for each menu
            sidebarMenus.forEach(menu => {
                const menuTh = document.createElement("th");
                menuTh.textContent = menu.label;
                menuTh.style.border = "1px solid #ddd";
                menuTh.style.padding = "4px";
                menuTh.style.background = "#f2f2f2";
                menuTh.style.textAlign = "center";
                menuTh.style.fontSize = "10px";
                menuTh.style.width = "80px"; // fixed width
                headerRow.appendChild(menuTh);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            // Rows for each location
            locationList.forEach(locationId => {
                const row = document.createElement("tr");

                // Location ID cell
                const idCell = document.createElement("td");
                idCell.style.border = "1px solid #ddd";
                idCell.style.padding = "4px";
                idCell.style.width = "167px"; // match header width

                const idInput = document.createElement("input");
                idInput.type = "text";
                idInput.value = locationId;
                idInput.placeholder = "Location ID";
                idInput.style.width = "159px"; // fixed width to fit in 167px cell
                idInput.style.border = "none";
                idInput.style.background = "transparent";
                idInput.style.fontSize = "10px";
                // idInput.addEventListener("change", () => updateLocationId(locationId, idInput.value));
                idCell.appendChild(idInput);

                // Add update button for all rows
                const updateBtn = document.createElement("button");
                updateBtn.textContent = "Update";
                updateBtn.style.fontSize = "10px";
                updateBtn.style.padding = "4px 8px";
                updateBtn.style.border = "1px solid #ccc";
                updateBtn.style.background = "#f0f0f0";
                updateBtn.style.cursor = "pointer";
                updateBtn.addEventListener("click", () => updateLocationId(locationId, idInput.value));
                idCell.appendChild(updateBtn);

                row.appendChild(idCell);

                // Cells for each menu
                sidebarMenus.forEach(menu => {
                    const cell = document.createElement("td");
                    cell.style.border = "1px solid #ddd";
                    cell.style.padding = "4px";
                    cell.style.textAlign = "center";

                    const locationLocked = lockedMenus[locationId] || {};
                    const locationHidden = hiddenMenus[locationId] || {};

                    // Lock toggle
                    const lockDiv = document.createElement("div");
                    lockDiv.style.display = "flex";
                    lockDiv.style.alignItems = "center";
                    lockDiv.style.justifyContent = "center";
                    lockDiv.style.marginBottom = "2px";

                    const lockLabel = document.createElement("span");
                    lockLabel.textContent = "L";
                    lockLabel.style.fontSize = "8px";
                    lockLabel.style.marginRight = "2px";
                    lockDiv.appendChild(lockLabel);

                    const lockSwitch = document.createElement("div");
                    lockSwitch.className = "toggle-switch";
                    lockSwitch.style.transform = "scale(0.7)";

                    const lockInput = document.createElement("input");
                    lockInput.type = "checkbox";
                    lockInput.className = "toggle-input";
                    lockInput.id = `lock-${locationId}-${menu.id}`;
                    lockInput.checked = !!locationLocked[menu.id];

                    const lockToggleLabel = document.createElement("label");
                    lockToggleLabel.className = "toggle-label";
                    lockToggleLabel.setAttribute("for", lockInput.id);

                    lockSwitch.appendChild(lockInput);
                    lockSwitch.appendChild(lockToggleLabel);
                    lockDiv.appendChild(lockSwitch);

                    cell.appendChild(lockDiv);

                    // Hide toggle
                    const hideDiv = document.createElement("div");
                    hideDiv.style.display = "flex";
                    hideDiv.style.alignItems = "center";
                    hideDiv.style.justifyContent = "center";

                    const hideLabel = document.createElement("span");
                    hideLabel.textContent = "H";
                    hideLabel.style.fontSize = "8px";
                    hideLabel.style.marginRight = "2px";
                    hideDiv.appendChild(hideLabel);

                    const hideSwitch = document.createElement("div");
                    hideSwitch.className = "toggle-switch";
                    hideSwitch.style.transform = "scale(0.7)";

                    const hideInput = document.createElement("input");
                    hideInput.type = "checkbox";
                    hideInput.className = "toggle-input";
                    hideInput.id = `hide-${locationId}-${menu.id}`;
                    hideInput.checked = locationHidden[menu.id] ? !!locationHidden[menu.id].toggleChecked : false;

                    const hideToggleLabel = document.createElement("label");
                    hideToggleLabel.className = "toggle-label";
                    hideToggleLabel.setAttribute("for", hideInput.id);

                    hideSwitch.appendChild(hideInput);
                    hideSwitch.appendChild(hideToggleLabel);
                    hideDiv.appendChild(hideSwitch);

                    cell.appendChild(hideDiv);

                    // Event listeners Working Fine but not showing Modals
                    // lockInput.addEventListener("change", () => {
                    //     console.log("(settings.js) Subaccount lock toggle changed for", menu.id, "locationId:", locationId, "checked:", lockInput.checked);
                    //     const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    //     saved.themeData = saved.themeData || {};
                    //     let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                    //     if (!locked[locationId]) locked[locationId] = {};
                    //     if (lockInput.checked) {
                    //         locked[locationId][menu.id] = true;
                    //     } else {
                    //         delete locked[locationId][menu.id];
                    //     }
                    //     saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                    //     localStorage.setItem("userTheme", JSON.stringify(saved));
                    //     applyLockedMenus();
                    // });
                    lockInput.addEventListener("change", () => {
                        console.log("(settings.js) Subaccount lock toggle changed for", menu.id, "locationId:", locationId, "checked:", lockInput.checked);
                        if (lockInput.checked) {
                            // Show popup selection modal
                            showPopupSelectionModal(menu, locationId, (selectedType) => {
                                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                                saved.themeData = saved.themeData || {};
                                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                                if (!locked[locationId]) locked[locationId] = {};
                                // locked[locationId][menu.id] = { locked: true, popupType: selectedType };
                                locked[locationId][menu.id] = { locked: true, popupType: selectedType, popupUrl: selectedUrl, popupHeadline: selectedHeadline };
                                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                                localStorage.setItem("userTheme", JSON.stringify(saved));
                                applyLockedMenus();
                            });
                        } else {
                            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                            saved.themeData = saved.themeData || {};
                            let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                            if (locked[locationId]) {
                                delete locked[locationId][menu.id];
                            }
                            saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                            localStorage.setItem("userTheme", JSON.stringify(saved));
                            applyLockedMenus();
                        }
                    });
                    hideInput.addEventListener("change", () => {
                        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                        saved.themeData = saved.themeData || {};
                        let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                        if (!hidden[locationId]) hidden[locationId] = {};
                        hidden[locationId][menu.id] = {
                            hidden: hideInput.checked,
                            display: hideInput.checked ? "none !important" : "flex !important",
                            toggleChecked: hideInput.checked
                        };
                        saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                        localStorage.setItem("userTheme", JSON.stringify(saved));
                        applyHiddenMenus();
                    });

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            content.appendChild(table);

            // Wrap table in scrollable container
            const tableWrapper = document.createElement("div");
            tableWrapper.style.overflowX = "auto";
            tableWrapper.style.marginBottom = "20px";
            // Move table into wrapper
            content.removeChild(table);
            tableWrapper.appendChild(table);
            content.appendChild(tableWrapper);

            // Add button below the table
            const addBtn = document.createElement("button");
            addBtn.textContent = "+ Add Subaccount";
            addBtn.style.border = "none";
            addBtn.style.background = "#28a745";
            addBtn.style.color = "#fff";
            addBtn.style.padding = "8px 16px";
            addBtn.style.borderRadius = "3px";
            addBtn.style.cursor = "pointer";
            addBtn.style.marginTop = "10px";
            addBtn.addEventListener("click", () => addNewLocationRow());
            content.appendChild(addBtn);

            function updateLocationId(oldId, newId) {
                if (oldId === newId) return;
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                if (locked[oldId]) {
                    locked[newId] = locked[oldId];
                    delete locked[oldId];
                }
                if (hidden[oldId]) {
                    hidden[newId] = hidden[oldId];
                    delete hidden[oldId];
                }
                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                localStorage.setItem("userTheme", JSON.stringify(saved));
                // Reload
                loadAllToggles(content, agencyMenus, sidebarMenus);
            }

            function addNewLocationRow() {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                const newId = "new_location_" + Date.now();
                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                locked[newId] = {};
                hidden[newId] = {};
                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                localStorage.setItem("userTheme", JSON.stringify(saved));
                // Reload
                loadAllToggles(content, agencyMenus, sidebarMenus);
            }
        }

        // Function to create toggle row
        function createToggleRow(menu, locationId, lockedMenus, hiddenMenus, parent) {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.marginBottom = "10px";
            row.style.padding = "5px 0";
            row.style.borderBottom = "1px solid #eee";

            const label = document.createElement("span");
            label.textContent = menu.label;
            label.style.flex = "1";
            label.style.fontSize = "14px";

            const toggleWrapper = document.createElement("div");
            toggleWrapper.style.display = "flex";
            toggleWrapper.style.gap = "20px";
            toggleWrapper.style.alignItems = "center";

            // Lock toggle
            const lockWrapper = document.createElement("div");
            lockWrapper.style.display = "flex";
            lockWrapper.style.alignItems = "center";
            lockWrapper.style.justifyContent = "center";
            lockWrapper.style.width = "60px";

            const lockSwitch = document.createElement("div");
            lockSwitch.className = "toggle-switch";

            const lockInput = document.createElement("input");
            lockInput.type = "checkbox";
            lockInput.className = "toggle-input";
            lockInput.id = locationId ? `lock-${locationId}-${menu.id}` : `lock-global-${menu.id}`;
            lockInput.checked = locationId ? !!lockedMenus[menu.id] : (lockedMenus[menu.id] && typeof lockedMenus[menu.id] === 'object' ? lockedMenus[menu.id].locked : !!lockedMenus[menu.id]);

            const lockLabel = document.createElement("label");
            lockLabel.className = "toggle-label";
            lockLabel.setAttribute("for", lockInput.id);

            lockSwitch.appendChild(lockInput);
            lockSwitch.appendChild(lockLabel);
            lockWrapper.appendChild(lockSwitch);

            // Hide toggle
            const hideWrapper = document.createElement("div");
            hideWrapper.style.display = "flex";
            hideWrapper.style.alignItems = "center";
            hideWrapper.style.justifyContent = "center";
            hideWrapper.style.width = "60px";

            const hideSwitch = document.createElement("div");
            hideSwitch.className = "toggle-switch";

            const hideInput = document.createElement("input");
            hideInput.type = "checkbox";
            hideInput.className = "toggle-input";
            hideInput.id = locationId ? `hide-${locationId}-${menu.id}` : `hide-global-${menu.id}`;
            hideInput.checked = locationId ? (hiddenMenus[menu.id] ? !!hiddenMenus[menu.id].toggleChecked : false) : (hiddenMenus[menu.id] ? !!hiddenMenus[menu.id].toggleChecked : false);

            const hideLabel = document.createElement("label");
            hideLabel.className = "toggle-label";
            hideLabel.setAttribute("for", hideInput.id);

            hideSwitch.appendChild(hideInput);
            hideSwitch.appendChild(hideLabel);
            hideWrapper.appendChild(hideSwitch);

            toggleWrapper.appendChild(lockWrapper);
            toggleWrapper.appendChild(hideWrapper);

            // Event listeners
            lockInput.addEventListener("change", () => {
                console.log("Lock toggle changed for", menu.id, "locationId:", locationId, "checked:", lockInput.checked);
                if (lockInput.checked) {
                    if (locationId) {
                        // Show popup selection modal for subaccounts
                        showPopupSelectionModal(menu, locationId, (selectedType) => {
                            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                            saved.themeData = saved.themeData || {};
                            let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                            if (!locked[locationId]) locked[locationId] = {};
                            // locked[locationId][menu.id] = { locked: true, popupType: selectedType };
                            locked[locationId][menu.id] = { locked: true, popupType: selectedType, popupUrl: selectedUrl, popupHeadline: selectedHeadline };
                            saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                            localStorage.setItem("userTheme", JSON.stringify(saved));
                            applyLockedMenus();
                        });
                    } else {
                        // Direct save for agency with default popup
                        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                        saved.themeData = saved.themeData || {};
                        let agencyData = saved.themeData["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
                        agencyData.locked = agencyData.locked || {};
                        agencyData.locked[menu.id] = { locked: true, popupType: "simple" };
                        saved.themeData["--agencyLockedHideMenus"] = JSON.stringify(agencyData);
                        localStorage.setItem("userTheme", JSON.stringify(saved));
                        applyLockedMenus();
                    }
                } else {
                    // Uncheck, remove lock
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData = saved.themeData || {};
                    if (locationId) {
                        let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                        if (locked[locationId]) {
                            delete locked[locationId][menu.id];
                        }
                        saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                    } else {
                        let agencyData = saved.themeData["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
                        if (agencyData.locked) {
                            delete agencyData.locked[menu.id];
                        }
                        saved.themeData["--agencyLockedHideMenus"] = JSON.stringify(agencyData);
                    }
                    localStorage.setItem("userTheme", JSON.stringify(saved));
                    applyLockedMenus();
                }
            });

            hideInput.addEventListener("change", () => {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                if (locationId) {
                    if (!hidden[locationId]) hidden[locationId] = {};
                    hidden[locationId][menu.id] = {
                        hidden: hideInput.checked,
                        display: hideInput.checked ? "none !important" : "flex !important",
                        toggleChecked: hideInput.checked
                    };
                } else {
                    let agencyData = saved.themeData["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
                    agencyData.hidden = agencyData.hidden || {};
                    agencyData.hidden[menu.id] = {
                        hidden: hideInput.checked,
                        display: hideInput.checked ? "none !important" : "flex !important",
                        toggleChecked: hideInput.checked
                    };
                    saved.themeData["--agencyLockedHideMenus"] = JSON.stringify(agencyData);
                }
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                localStorage.setItem("userTheme", JSON.stringify(saved));
                applyHiddenMenus();
            });

            row.appendChild(label);
            row.appendChild(toggleWrapper);
            parent.appendChild(row);
        }
    }
    function showPreviewPopup(type, popupUrl, popupHeadline) {
    document.getElementById("tb-preview-popup")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "tb-preview-popup";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:200000;";

    const popup = document.createElement("div");
    popup.style.cssText = "background:#fff;padding:30px;border-radius:10px;max-width:350px;width:90%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

    if (type === "simple") {
        popup.innerHTML = `<h3>Access Denied</h3><p>You cannot access this feature.</p>`;
    } else if (type === "upgrade") {
        const headline = popupHeadline || "Upgrade Required 🚀";
        popup.innerHTML = `<h3>${headline}</h3><p>This feature is available in Premium Plan.</p><button style="margin-top:10px;padding:8px 16px;background:#28a745;color:#fff;border:none;border-radius:5px;cursor:pointer;">Upgrade</button>`;
    } else if (type === "contact") {
        const headline = popupHeadline || "Restricted";
        popup.innerHTML = `<h3>${headline}</h3><p>Please contact admin to get access.</p><button style="margin-top:10px;padding:8px 16px;background:#007bff;color:#fff;border:none;border-radius:5px;cursor:pointer;">Contact</button>`;
    }

    // Wire up action button to open URL
    const actionBtn = popup.querySelector("button");
    if (actionBtn && popupUrl) {
        actionBtn.addEventListener("click", () => window.open(popupUrl, "_blank"));
    }

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText = "margin-top:15px;padding:8px 16px;border:1px solid #ccc;border-radius:5px;background:#fff;cursor:pointer;display:block;margin-left:auto;margin-right:auto;";
    closeBtn.onclick = () => overlay.remove();

    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    }
    function applyLockedMenus() {
            const savedRaw = localStorage.getItem("userTheme");
            const saved = JSON.parse(savedRaw) || {};
            if (!saved.themeData || !saved.themeData["--lockedMenus"]) return;

            let lockedMenus;
            try { lockedMenus = JSON.parse(saved.themeData["--lockedMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --lockedMenus"); return; }
            if (!lockedMenus || typeof lockedMenus !== "object") return;

            const locationId = getCurrentLocationId();
            console.log("(settings.js) applyLockedMenus called, locationId:", locationId);
            console.log("lockedMenus:", lockedMenus);
            
            // Select all sidebar menus
            const allMenus = document.querySelectorAll("a[id^='sb_'], .hl_nav-header a");
            
            allMenus.forEach(menu => {
                const menuId = menu.id?.trim();
                if (!menuId) return;
                
                const isLocked = locationId ? (lockedMenus[locationId]?.[menuId] && typeof lockedMenus[locationId][menuId] === 'object' ? lockedMenus[locationId][menuId].locked : !!lockedMenus[locationId]?.[menuId]) : (lockedMenus[menuId] && typeof lockedMenus[menuId] === 'object' ? lockedMenus[menuId].locked : !!lockedMenus[menuId]);
                console.log("(settings.js) Processing menu:", menuId, "isLocked:", isLocked);
                
                if (isLocked) {
                if (!menu.querySelector(".tb-lock-icon")) {
                    const lockIcon = document.createElement("i");
                    lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
                    lockIcon.style.color = "#F54927";
                    lockIcon.style.setProperty("display", "inline-block", "important");
                    lockIcon.style.setProperty("visibility", "visible", "important");
                    lockIcon.style.setProperty("opacity", "1", "important");
                    lockIcon.style.setProperty("position", "relative", "important");
                    lockIcon.style.setProperty("z-index", "9999", "important");
                    menu.appendChild(lockIcon);
                }
                menu.style.setProperty("opacity", "0.6", "important");
                menu.style.setProperty("cursor", "not-allowed", "important");
                // Extract the popup type stored for this menu
                const lockData = locationId
                    ? lockedMenus[locationId]?.[menuId]
                    : lockedMenus[menuId];
                const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
                const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
                const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
                if (menu.dataset.tbLockBound !== "1") {
                    menu.addEventListener("click", (e) => {
                        blockMenuClick(e, menuId);
                        showPreviewPopup(popupType, popupUrl, popupHeadline);
                    }, true);
                    menu.dataset.tbLockBound = "1";
                }
                } else {
                console.log("(settings.js) Unlocking menu:", menuId);
                const icon = menu.querySelector(".tb-lock-icon");
                if (icon) {
                    console.log("(settings.js) Removing icon for", menuId);
                    icon.remove();
                } else {
                    console.log("(settings.js) No icon found for", menuId);
                }
                menu.style.setProperty("opacity", "1", "important");
                menu.style.setProperty("cursor", "auto", "important");
                if (menu.dataset.tbLockBound === "1") {
                    menu.removeEventListener("click", blockMenuClick, true);
                    delete menu.dataset.tbLockBound;
                }
                }
        });
        }

    document.addEventListener("DOMContentLoaded", applyLockedMenus);
   
    setTimeout(applyLockedMenus, 1500);

    // Helper for blocking click
    function blockMenuClick(e, menuId) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const savedRaw = localStorage.getItem("userTheme");
    const saved = JSON.parse(savedRaw) || {};
    const lockedMenus = saved.themeData?.["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
    const agencyData = saved.themeData?.["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
    const locationId = getCurrentLocationId();

    // Read lockData once — covers both location and global
    const lockData = locationId
        ? lockedMenus[locationId]?.[menuId]
        : agencyData.locked?.[menuId];

    const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
    const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
    const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";

    showPreviewPopup(popupType, popupUrl, popupHeadline);
    }
    function updateIconVariable(menuId, unicodeValue) {
        const cssVarName = getCssVarName(menuId);
        if (!cssVarName) {
            return;
        }
        // ✅ Format the unicode properly
        if (!unicodeValue.startsWith("\\f")) {
            unicodeValue = "\\" + unicodeValue;
        }

        document.documentElement.style.setProperty(cssVarName, `"${unicodeValue}"`);
    }
    function getCssVarName(menuId) {
        const map = {
            "sb_agency-dashboard": "--agency-dashboard-icon",
            "sb_agency-saas-configurator": "--agency-sass-configurator-icon",
            "sb_location-prospect": "--agency-prospect-icon",
            "sb_agency-accounts": "--agency-subaccount-icon",
            "sb_agency-account-snapshots": "--agency-snapshot-icon",
            "sb_agency-account-reselling": "--agency-reselling-icon",
            "sb_agency-marketplace": "--agency-marketplace-icon",
            "sb_agency-affiliate-portal": "--agency-affiliate-icon",
            "sb_agency-template-library": "--agency-templatelibrary-icon",
            "sb_agency-partners": "--agency-partners-icon",
            "sb_agency-university": "--agency-university-icon",
            "sb_saas-education": "--agency-sasseducation-icon",
            "sb_ghl-swag": "--agency-sassswag-icon",
            "sb_saas-fasttrack": "--agency-sassfasttrack-icon",
            "sb_agency-ideas": "--agency-ideas-icon",
            "sb_mobile-app-customiser": "--agency-mobileapp-icon",
            "sb_agency-app-marketplace": "--agency-app-marketplace-icon",
            "sb_agency-settings": "--agency-settings-icon",
            "sb_launchpad":"--sidebar-menu-icon-lunchpad",
            "sb_dashboard":"--sidebar-menu-icon-dashboard-active",
            "sb_conversations":"--sidebar-menu-icon-conversations",
            "sb_opportunities":"--sidebar-menu-icon-opportunities",
            "sb_calendars":"--sidebar-menu-icon-calendars",
            "sb_contacts":"--sidebar-menu-icon-contact",
            "sb_payments":"--sidebar-menu-icon-payments",
            "sb_reporting":"--sidebar-menu-icon-reporting",
            "sb_email-marketing":"--sidebar-menu-icon-marketing",
            "sb_automation":"--sidebar-menu-icon-automation",
            "sb_sites":"--sidebar-menu-icon-site",
            "sb_app-media":"--sidebar-menu-icon-media-storage",
            "sb_memberships":"--sidebar-menu-icon-memberships-hover",
            "sb_reputation":"--sidebar-menu-icon-reputation",
        };

        return map[menuId] || null;
    }

    // 🔥 Core function: apply all saved icon customizations
    function applyMenuIconCustomizations() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme?.themeData || {};
        const rawCustomizations = themeData["--menuCustomizations"];

        if (!rawCustomizations) {
            return;
        }

        // Parse string if needed
        const customizations =
            typeof rawCustomizations === "string"
                ? JSON.parse(rawCustomizations)
                : rawCustomizations;

        // 🔁 Loop through each menu item and apply icon
        Object.entries(customizations).forEach(([menuId, data]) => {
            const cssVar = getCssVarName(menuId);
            const iconUnicode = data?.icon;

            if (cssVar && iconUnicode) {
                // Make sure it’s formatted correctly for CSS content
                document.documentElement.style.setProperty(
                    cssVar,
                    `"\\${iconUnicode}"`
                );
            } else {
            }
        });
    }
    // 🚀 Run it
    function applyMenuCustomizations() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");

        const themeData = savedTheme.themeData || {};
        const menuCustomizations = themeData["--menuCustomizations"]
            ? JSON.parse(themeData["--menuCustomizations"])
            : {};

        // Load Font Awesome if missing
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
            link.onload = () => applyMenuCustomizations();
            document.head.appendChild(link);
            return;
        }

        Object.keys(menuCustomizations).forEach(menuId => {
            const menuData = menuCustomizations[menuId];
            const menuEl = document.getElementById(menuId);
            if (!menuEl) return;

            // Update Title
            const titleSpan = menuEl.querySelector(".nav-title");
            if (titleSpan) titleSpan.textContent = menuData.title || menuEl.dataset.defaultLabel || "";
            if (menuData.icon) {
                // Remove only existing icon inside this menu
                const existingImg = menuEl.querySelector("img");
                const existingI = menuEl.querySelector("i");
                if (existingImg) existingImg.remove();
                if (existingI) existingI.remove();
            // ✅ Clear old CSS mask icon
                const cssVarName = `--sidebar-menu-icon-${menuId.replace(/^sb_/, "")}`;
                document.documentElement.style.setProperty(cssVarName, "");
                if (/^f[0-9a-f]+$/i.test(menuData.icon)) {
                    menuEl.classList.add("tb-has-fa-icon");
                    menuEl.classList.remove("tb-has-svg-icon"); // hide the old SVG mask
                } else if (/^https?:\/\//.test(menuData.icon)) {
                    menuEl.classList.remove("tb-has-fa-icon");
                    menuEl.classList.add("tb-has-svg-icon");
                }
                menuEl.classList.remove('tb-has-svg-icon'); // optional, for clarity
                let iconEl;
                if (/^https?:\/\//.test(menuData.icon)) {
                    // Image URL
                    iconEl = document.createElement("img");
                    iconEl.src = menuData.icon;
                    iconEl.alt = menuData.title || "icon";
                    iconEl.className = "md:mr-0 h-5 w-5 mr-2 lg:mr-2 xl:mr-2";
                } else if (/^f[0-9a-f]+$/i.test(menuData.icon)) {
                        // Unicode like "f015", "f232", "f436"

                        const iconValue = menuData.icon.toLowerCase();

                        // Known Font Awesome Brands unicodes (extend as needed)
                        const BRAND_UNICODE_RANGE = ["f09a", "f16d", "f232", "f436"];

                        const isBrandIcon = BRAND_UNICODE_RANGE.includes(iconValue);

                        iconEl = document.createElement("i");
                        iconEl.className = "tb-sidebar-icon";
                        iconEl.innerHTML = `&#x${iconValue};`;

                        if (isBrandIcon) {
                            // ✅ Font Awesome Brands
                            iconEl.style.fontFamily = "Font Awesome 6 Brands";
                            iconEl.style.fontWeight = "400";
                        } else {
                            // ✅ Font Awesome Solid
                            iconEl.style.fontFamily = "Font Awesome 6 Free";
                            iconEl.style.fontWeight = "900";
                        }

                        iconEl.style.fontSize = "16px";
                        iconEl.style.marginRight = "0.5rem";
                        iconEl.style.lineHeight = "1";
                    }
                    else {
                    let iconValue = menuData.icon.trim();

                    if (/^f[0-9a-f]{3}$/i.test(iconValue)) {
                        iconEl = document.createElement("i");
                        iconEl.className = "fa-regular tb-sidebar-icon";
                        iconEl.innerHTML = `&#x${iconValue};`;
                        iconEl.style.fontFamily = "Font Awesome 6 Free";
                        iconEl.style.fontWeight = "900";
                    } else {
                        if (
                            iconValue.startsWith("fa-") &&
                            // !iconValue.includes("fa-solid") &&
                            !iconValue.includes("fa-regular") &&
                            !iconValue.includes("fa-brands")
                        ) {
                            iconValue = `fa-regular ${iconValue}`;
                        } else if (!iconValue.startsWith("fa-")) {
                            iconValue = `fa-regular fa-${iconValue}`;
                        }

                        iconEl = document.createElement("i");
                        iconEl.className = `${iconValue} tb-sidebar-icon`;
                        iconEl.style.fontFamily = "Font Awesome 6 Free";
                        iconEl.style.fontWeight = "900";
                        iconEl.style.fontSize = "16px";
                        iconEl.style.marginRight = "0.5rem";
                    }
                }

                // Add new icon for this menu
                menuEl.prepend(iconEl);
              
                // ✅ Toggle classes for CSS
                if (/^f[0-9a-f]+$/i.test(menuData.icon)) {
                    menuEl.classList.add("tb-has-fa-icon");
                    menuEl.classList.remove("tb-has-svg-icon");
                } else if (/^https?:\/\//.test(menuData.icon)) {
                    menuEl.classList.remove("tb-has-fa-icon");
                    menuEl.classList.add("tb-has-svg-icon");
                }
                // 🧠 If icon is added, shift title like default
                const titleEl = menuEl.querySelector(".nav-title");
                if (titleEl) {
                    titleEl.style.right = "28px";
                }
            }
        });
    }

    function buildMenuCustomizationSection(container) {
        if (document.getElementById("tb-menu-customization")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-menu-customization";
        wrapper.className = "tb-menu-customization";

        const separator = document.createElement("hr");
        separator.className = "tb-section-separator";
        wrapper.appendChild(separator);
        // ---------------- Menu definitions ----------------
        let subAccountMenus = [
            { id: "sb_launchpad", label: "Launchpad" },
            { id: "sb_dashboard", label: "Dashboard" },
            { id: "sb_conversations", label: "Conversations" },
            { id: "sb_opportunities", label: "Opportunities" },
            { id: "sb_calendars", label: "Calendars" },
            { id: "sb_contacts", label: "Contacts" },
            { id: "sb_payments", label: "Payments" },
            { id: "sb_reporting", label: "Reporting" },
            { id: "sb_email-marketing", label: "Email Marketing" },
            { id: "sb_automation", label: "Automation" },
            { id: "sb_sites", label: "Sites" },
            { id: "sb_app-media", label: "App Media" },
            { id: "sb_memberships", label: "Memberships" },
            { id: "sb_reputation", label: "Reputation" },
            //{ id: "sb_app-marketplace", label: "App Marketplace" },
            //{ id: "sb_custom-values", label: "Custom Values" },
            //{ id: "sb_manage-scoring", label: "Manage Scoring" },
            //{ id: "sb_domains-urlRedirects", label: "Domains & URL Redirects" },
            //{ id: "sb_integrations", label: "Integrations" },
            //{ id: "sb_undefined", label: "Private Integrations" },
            //{ id: "sb_conversations_providers", label: "Conversation Providers" },
            //{ id: "sb_tags", label: "Tags" },
            //{ id: "sb_labs", label: "Labs" },
            //{ id: "sb_audit-logs-location", label: "Audit Logs" },
            //{ id: "sb_brand-boards", label: "Brand Boards" },
            //{ id: "sb_business_info", label: "Business Profile" },
            //{ id: "sb_saas-billing", label: "Billing" },
            //{ id: "sb_my-staff", label: "My Staff" },
            //{ id: "sb_Opportunities-Pipelines", label: "Opportunities & Pipelines" },
            //{ id: "sb_", label: "Automation" },
            //{ id: "sb_calendars", label: "Calendars" },
            //{ id: "sb_location-email-services", label: "Email Services" },
            //{ id: "sb_phone-number", label: "Phone Numbers" },
            //{ id: "sb_whatsapp", label: "WhatsApp" },
            //{ id: "sb_objects", label: "Objects" },
            //{ id: "sb_custom-fields-settings", label: "Custom Fields" }
        ];

        let agencyMenus = [
            { id: "sb_agency-dashboard", label: "Agency Dashboard" },
            { id: "sb_location-prospect", label: "Prospecting" },
            { id: "sb_agency-account-reselling", label: "Account Reselling" },
            { id: "sb_agency-marketplace", label: "Add-Ons" },
            { id: "sb_agency-affiliate-portal", label: "Affiliate Portal" },
            { id: "sb_agency-template-library", label: "Template Library" },
            { id: "sb_agency-partners", label: "Partners" },
            { id: "sb_agency-university", label: "University" },
            { id: "sb_saas-education", label: "SaaS Education" },
            { id: "sb_ghl-swag", label: "GHL Swag" },
            { id: "sb_agency-saas-configurator", label: "Saas Configurator" },
            { id: "sb_agency-ideas", label: "Agency Ideas" },
            { id: "sb_mobile-app-customiser", label: "Mobile App Customiser" },
            { id: "sb_agency-account-snapshots", label: "Account Snapshots" },

            //{ id: "sb_agency-accounts", label: "App Marketplace" },

            //Settings menu
            //{ id: "sb_agency-profile-settings", label: "My Profile" },
            //{ id: "sb_agency-company-settings", label: "Company" },
            //{ id: "sb_agency-team-settings", label: "Team" },
            //{ id: "sb_agency-twilio-settings", label: "Phone Integration" },
            //{ id: "sb_agency-email-settings", label: "Email Services" },
            //{ id: "sb_system-emails-setting", label: "System Emails" },
            //{ id: "sb_agency-banner-management", label: "Announcements" },
            //{ id: "sb_workflow-premium-actions-setting", label: "Workflow - Premium Features" },
            //{ id: "sb_conversation-ai-setting", label: "AI Employee" },
            //{ id: "sb_ask-ai-configuration-setting", label: "Ask AI Configuration" },
            //{ id: "sb_workflow-ai-setting", label: "Workflow - External AI Models" },
            //{ id: "sb_domain-purchase-setting", label: "Domain Purchase" },
            //{ id: "sb_undefined", label: "Private Integrations" },
            //{ id: "sb_agency-affiliate-settings", label: "Affiliates" },
            //{ id: "sb_agency-custom-link-settings", label: "Custom Menu Links" },
            //{ id: "sb_agency-stripe-settings", label: "Stripe" },
            //{ id: "sb_agency-api-keys-settings", label: "API Keys" },
            //{ id: "sb_agency-compliance-settings", label: "Compliance" },
            //{ id: "sb_agency-labs-settings", label: "Labs" },
            //{ id: "sb_agency-audit-logs-settings", label: "Audit Logs" }
        ];
        const SUBACCOUNT_ORDER_MAP = {
              "sb_launchpad": "launchpad",
              "sb_dashboard": "dashboard",
              "sb_conversations": "conversations",
              "sb_opportunities": "opportunities",
              "sb_calendars": "calendars",
              "sb_contacts": "contacts",
              "sb_payments": "payments",
              "sb_reporting": "reporting",
              "sb_email-marketing": "marketing",
              "sb_automation": "automation",
              "sb_sites": "sites",
              "sb_app-media": "media-storage",
              "sb_memberships": "memberships",
              "sb_reputation": "reputation",
              "sb_app-marketplace": "app-marketplace",
              "sb_location-mobile-app": "mobile-app"
            };

        // ✅ Debug: check if your menus arrays are defined correctly
        // Load saved theme 
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};

        // ---------------- Helper to build each section ----------------
        const buildSection = (menus, sectionTitle, storageKey, sidebarParentSelector) => {
            const sectionHeading = document.createElement("h4");
            sectionHeading.className = "tb-header-controls";
            sectionHeading.textContent = sectionTitle;
            sectionHeading.style.cursor = "var(--custom-pointer,auto)"; // Make clickable
            // sectionHeading.style.display = "flex";
            sectionHeading.style.alignItems = "center";

             // Add arrow for toggle
            // const arrow = document.createElement("span");
            // arrow.innerHTML = "▶"; // Right arrow initially
            // arrow.style.marginLeft = "8px";
            // sectionHeading.appendChild(arrow);
            const arrow = document.createElement("span");
            arrow.innerHTML = `<i class="fa-solid fa-angle-down tb-toggle-icon" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff; padding: 0px 2px 0px 2px;"></i>`;
            arrow.style.marginLeft = "8px";
            sectionHeading.appendChild(arrow);
            wrapper.appendChild(sectionHeading);

            const listContainer = document.createElement("div");
            listContainer.className = "tb-draggable-menu-list tb-section-container";
            listContainer.style.overflow = "hidden";
            listContainer.style.maxHeight = "0px";
            listContainer.style.transition = "max-height 0.3s ease, padding 0.3s ease";
            //const savedOrder = themeData[storageKey] ? JSON.parse(themeData[storageKey]) : [];
            //if (savedOrder.length > 0) {
            //    const indexOf = id => {
            //        const idx = savedOrder.indexOf(id);
            //        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
            //    };
            //    menus.sort((a, b) => indexOf(a.id) - indexOf(b.id));
            //}
            const savedOrder = themeData[storageKey] ? JSON.parse(themeData[storageKey]) : [];

            if (Array.isArray(savedOrder) && savedOrder.length > 0) {
                // Reorder menus according to saved order only
                const orderedMenus = [];
                savedOrder.forEach(id => {
                    const found = menus.find(m => m.id === id);
                    if (found) orderedMenus.push(found);
                });

                // Add any new menus not in savedOrder (to preserve new additions)
                menus.forEach(m => {
                    if (!savedOrder.includes(m.id)) orderedMenus.push(m);
                    
                });

                menus = orderedMenus;
            }
            menus.forEach(menu => {
                const row = document.createElement("div");
                row.className = "tb-menu-row";
                row.dataset.id = menu.id;
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.gap = "8px";
                row.style.marginBottom = "10px";
                row.style.border = "1px solid #ddd";
                row.style.padding = "8px";
                row.style.borderRadius = "6px";
                row.style.background = "#f9f9f9";
                row.style.boxShadow = "-2px 2px 10px rgb(78 77 189 / 21%)";

                // 🖼️ Add drag icon before label
                const dragIcon = document.createElement("img");
                dragIcon.src = "https://themebuilder-six.vercel.app/images/drag-logo-2.png";
                dragIcon.alt = "drag";
                dragIcon.className = "tb-drag-handle"; // 👈 important for Sortable handle
                dragIcon.style.width = "15px";
                dragIcon.style.height = "15px";
                dragIcon.style.objectFit = "contain";
                dragIcon.style.cursor = "grab";

                const label = document.createElement("span");
                label.textContent = menu.label;
                label.style.flex = "1";

                const titleInput = document.createElement("input");
                titleInput.type = "text";
                titleInput.placeholder = "Custom Title";
                titleInput.className = "tb-input tb-title-input";
                // 🔥 Live title update as user types
                titleInput.addEventListener("input", (e) => {
                    const newLabel = e.target.value.trim();
                    const rawKey = menu.id.startsWith("sb_") ? menu.id.replace(/^sb_/, "") : menu.id;
                    updateSidebarTitle(rawKey, newLabel || menu.label);
                });
                const iconInput = document.createElement("input");
                iconInput.type = "text";
                iconInput.placeholder = "CODE";
                iconInput.className = "tb-input tb-icon-input";

                const menuCustomizations = themeData["--menuCustomizations"]
                    ? JSON.parse(themeData["--menuCustomizations"])
                    : {};

                if (menuCustomizations[menu.id]) {
                    titleInput.value = menuCustomizations[menu.id].title || "";
                    iconInput.value = menuCustomizations[menu.id].icon || "";
                } else {
                    titleInput.value = menu.label;
                }
                //Old Code
                const saveChange = () => {
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData = saved.themeData || {};

                    const customizations = saved.themeData["--menuCustomizations"]
                        ? JSON.parse(saved.themeData["--menuCustomizations"])
                        : {};

                    let iconValue = iconInput.value.trim();
                    let isUnicode = false;

                    // ✅ Detect if user pasted only Unicode like "f015"
                    if (/^f[0-9a-fA-F]{3}$/i.test(iconValue)) {
                        isUnicode = true;
                    }

                    customizations[menu.id] = {
                        title: titleInput.value,
                        icon: iconValue
                    };

                    saved.themeData["--menuCustomizations"] = JSON.stringify(customizations);
                    localStorage.setItem("userTheme", JSON.stringify(saved));

                    // Apply title instantly via CSS variable
                    const varName = `--${menu.id}-new-name`;
                    document.documentElement.style.setProperty(varName, `"${titleInput.value || menu.label}"`);

                    // 🔄 Update icon live
                    const menuEl = document.getElementById(menu.id);
                    if (menuEl) {
                        let iconEl = menuEl.querySelector("i");
                        if (!iconEl) {
                            iconEl = document.createElement("i");
                            menuEl.prepend(iconEl);
                        }

                        if (isUnicode) {
                            // ✅ Update the CSS variable instead of injecting icon manually
                            updateIconVariable(menu.id, iconValue);

                            // Optional: Add a fallback <i> for safety (not strictly required)
                            iconEl.className = "fa-solid";
                            iconEl.textContent = String.fromCharCode(parseInt(iconValue, 16));
                            iconEl.style.fontFamily = "Font Awesome 6 Free";
                            iconEl.style.fontWeight = "900";
                            iconEl.style.marginRight = "0.5rem";
                            iconEl.style.fontSize = "16px";
                        } else {
                            // ✅ User entered a normal class or URL
                            iconEl.textContent = "";

                            // 🧠 Auto-correct class before assigning
                            let finalClass = iconValue.trim();

                            // If accidentally Unicode, fallback
                            if (/^f[0-9a-f]{3}$/i.test(finalClass)) {
                                iconEl.className = "fa-solid";
                                iconEl.textContent = String.fromCharCode(parseInt(finalClass, 16));
                                iconEl.style.fontFamily = "Font Awesome 6 Free";
                                iconEl.style.fontWeight = "900";
                            } else {
                                // Normalize normal icon class
                                if (finalClass.startsWith("fa-") && !finalClass.includes("fa-solid") && !finalClass.includes("fa-regular") && !finalClass.includes("fa-brands")) {
                                    finalClass = `fa-solid ${finalClass}`;
                                } else if (!finalClass.startsWith("fa-")) {
                                    finalClass = `fa-solid fa-${finalClass}`;
                                }

                                iconEl.className = finalClass;
                                iconEl.textContent = "";
                                iconEl.style.fontFamily = "Font Awesome 6 Free";
                                iconEl.style.fontWeight = "900";
                            }

                        }
                    }
                    function waitForFontAwesome(cb) {
                        const test = document.createElement("i");
                        test.className = "fa-solid fa-house";
                        document.body.appendChild(test);
                        requestAnimationFrame(() => {
                            const style = getComputedStyle(test).fontFamily;
                            test.remove();
                            if (style.includes("Font Awesome")) {
                                cb();
                            } else {
                                setTimeout(() => waitForFontAwesome(cb), 100);
                            }
                        });
                    }

                    waitForFontAwesome(applyMenuCustomizations);
                };

                titleInput.addEventListener("input", saveChange);
                iconInput.addEventListener("input", saveChange);

                // ✅ Correct append order
                row.appendChild(dragIcon);  // use dragIcon instead of dragHandle
                row.appendChild(label);
                row.appendChild(titleInput);
                row.appendChild(iconInput);

                listContainer.appendChild(row);
            });

            wrapper.appendChild(listContainer);
            //  sectionHeading.addEventListener("click", () => {
            //     if (listContainer.classList.contains("open")) {
            //         listContainer.style.maxHeight = "0px";
            //         listContainer.style.padding = "0 0"; 
            //         listContainer.classList.remove("open");
            //         arrow.innerHTML = "▶"; // Right arrow
            //     } else {
            //         listContainer.style.maxHeight = listContainer.scrollHeight + "px";
            //         listContainer.style.padding = "10px 0"; 
            //         listContainer.classList.add("open");
            //         arrow.innerHTML = "▼"; // Down arrow
            //     }
            // });
            sectionHeading.addEventListener("click", () => {
                const icon = arrow.querySelector("i");

                if (listContainer.classList.contains("open")) {
                    // Collapse
                    listContainer.style.maxHeight = "0px";
                    listContainer.style.padding = "0 0";
                    listContainer.classList.remove("open");

                    icon.classList.remove("fa-angle-up");
                    icon.classList.add("fa-angle-down"); // collapsed icon
                } else {
                    // Expand
                    listContainer.style.maxHeight = listContainer.scrollHeight + "px";
                    listContainer.style.padding = "10px 0";
                    listContainer.classList.add("open");

                    icon.classList.remove("fa-angle-down");
                    icon.classList.add("fa-angle-up"); // expanded icon
                }
            });
            // ==========================
            // Subaccount Sidebar Observer
            // ==========================
            function applySubaccountMenuOrderCSS(order) {
                order.forEach((menuId, index) => {
                    const cssKey = SUBACCOUNT_ORDER_MAP[menuId];
                    if (!cssKey) return;

                    document.documentElement.style.setProperty(
                    `--${cssKey}-order`,
                    index
                    );
                });
                }
                function saveSubaccountOrder(order) {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData ??= {};
                saved.themeData["--subMenuOrder"] = JSON.stringify(order);
                localStorage.setItem("userTheme", JSON.stringify(saved));
                }
           
            function updateAgencyaccountSidebarRuntime(newOrder) {
                const wait = setInterval(() => {
                    const sidebarNav = document.querySelector(
                        '.hl_nav-header nav[aria-label="header"]'
                    );
                    if (!sidebarNav) return;

                    const allExist = newOrder.every(key => sidebarNav.querySelector(`[meta="${key}"]`));

                    if (!allExist) return;

                    clearInterval(wait);

                    // Reorder DOM elements
                    newOrder.forEach(metaKey => {
                        const el = sidebarNav.querySelector(`[meta="${metaKey}"]`);
                        if (el) sidebarNav.appendChild(el); // moves node in new order
                    });
                }, 50);
            }

            const isSubAccount = location.pathname.includes("/location/");
            let allowReorder = false;
           
            // ---------------- Drag & Drop ----------------
            Sortable.create(listContainer, {
                animation: 150,
                ghostClass: "tb-dragging",
                handle: ".tb-drag-handle",

                onEnd: () => {
                    allowReorder = true; // enable once, only after drag

                    const rows = listContainer.querySelectorAll(".tb-menu-row");
                    const newOrder = [...rows].map(r => r.dataset.id);

                    // Save
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData ??= {};
                    saved.themeData[storageKey] = JSON.stringify(newOrder);
                    localStorage.setItem("userTheme", JSON.stringify(saved));

                    if (isSubAccount) {
                        //   restoreSubaccountMenuOrder();

                                saveSubaccountOrder(newOrder);
                                applySubaccountMenuOrderCSS(newOrder); // 🔥 LIVE APPLY

                                applyMenuCustomizations();
                        } else {
                        updateAgencyaccountSidebarRuntime(newOrder);
                    }

                    applyMenuCustomizations();
                }
            });
        };

        // 💡 Add Instruction Paragraph under Agency Level Menu Customization
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.innerHTML = `
           💡 <strong>How to Customize Your Menu:</strong><br><br>
           1. To add a custom icon for any menu item, please visit the 
           <a href="https://fontawesome.com/icons" target="_blank" style="color:#007bff; text-decoration:underline;">
             Font Awesome Icons Library
           </a>. Once there, select your preferred icon. On the <strong>top-right corner</strong> of the icon page, you’ll find a <strong>“Copy Code”</strong> button — click it and then <strong>paste the copied code into the relevant icon field</strong> here.<br><br>
           2. You can <strong>drag and drop the menu items</strong> to change their order. This helps you organize your dashboard according to your preferences or workflow.<br><br>
           3. To <strong>change the title of any menu item</strong>, simply edit the text in the <strong>relevant title field</strong>. This allows you to personalize your menu names for better clarity and easier navigation.<br><br>
           ✨ <em>Tip:</em> Use these customization options to design a navigation layout that’s tailored to your needs — improving productivity and making your workspace more intuitive.
         `;
        wrapper.appendChild(instruction);

        // pass safeAgencyMenus / safeSubAccountMenus to buildSection
        buildSection(agencyMenus, "Agency Level", "--agencyMenuOrder", "#agencySidebar");
        buildSection(subAccountMenus, "Sub-Account Level", "--subMenuOrder", "#subAccountSidebar");


        container.appendChild(wrapper);
        applyMenuCustomizations();

        (function applySavedSubAccountOrderOnLoad() {
            if (!location.pathname.includes("/location/")) return;

            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const order = saved.themeData?.["--subMenuOrder"]
                ? JSON.parse(saved.themeData["--subMenuOrder"])
                : [];

            if (!order.length) return;

            // Apply CSS order
            order.forEach((menuId, index) => {
                const cssKey = SUBACCOUNT_ORDER_MAP[menuId];
                if (!cssKey) return;

                document.documentElement.style.setProperty(
                    `--${cssKey}-order`,
                    index
                );
            });
        })();
        // ✅ Restore order if sidebar exists
        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");

        const isSubAccount = location.pathname.includes("/location/");

        if (!isSubAccount && saved.themeData?.["--agencyMenuOrder"]) {
            const order = JSON.parse(saved.themeData["--agencyMenuOrder"]);
            reorderMenu(order, "#agencySidebar");
        }

        function reorderMenu(order, containerSelector) {
            // Try the exact selector first (keeps agency behavior unchanged)
            let container = document.querySelector(containerSelector);

            // If selector not found, attempt to infer the container from the first existing menu item
            if (!container) {
                for (let i = 0; i < order.length; i++) {
                    const id = order[i];
                    const el = document.getElementById(id);
                    if (el && el.parentElement) {
                        container = el.parentElement;
                        break;
                    }
                }
            }

            // If still not found, try a common sub-account selector (safe fallback)
            if (!container) {
                container = document.querySelector(".hl_nav-header nav") || document.querySelector(".hl_nav-header");
            }

            if (!container) return;

            // order.forEach(id => {
            //     const el = document.getElementById(id);
            //     if (el) container.appendChild(el);
            // });
           order.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (el.parentElement !== container) {
                container.appendChild(el);
            }
});

        }

    }

    // === Subaccount Sidebar Menu Title Support ===
    // === Dynamic Sidebar Title Update ===
    function updateSidebarTitle(metaKey, newLabel) {
        // 🚫 Prevent title change for this menu only
        if (metaKey === "agency-accounts") {
            console.warn("Skipping update for sb_agency-accounts");
            return;
        }

        const varName = `--${metaKey}-new-name`;

        // Inject CSS rule only once
        if (!document.querySelector(`style[data-meta="${metaKey}"]`)) {
            const style = document.createElement("style");
            style.dataset.meta = metaKey;
            style.innerHTML = `
    a[meta="${metaKey}"] .nav-title,
    a#${metaKey} .nav-title {
      visibility: hidden !important;
      position: relative !important;
    }
    a[meta="${metaKey}"] .nav-title::after,
    a#${metaKey} .nav-title::after {
      content: var(${varName}, "${metaKey}");
      visibility: visible !important;
      position: absolute !important;
      left: 0;
    }
  `;
            document.head.appendChild(style);
        }

        // Apply CSS variable
        document.documentElement.style.setProperty(varName, `"${newLabel}"`);

        // Save
        const saved = JSON.parse(localStorage.getItem("--themebuilder_sidebarTitles") || "{}");
        saved[varName] = newLabel;
        localStorage.setItem("--themebuilder_sidebarTitles", JSON.stringify(saved));
    }

    function restoreSidebarTitles() {
        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (saved.themeData && saved.themeData["--sidebarTitles"]) {
            try {
                const titles = JSON.parse(saved.themeData["--sidebarTitles"]);
                Object.entries(titles).forEach(([varName, value]) => {

                    // 🚫 Skip restore for sb_agency-accounts
                    if (varName.includes("agency-accounts")) return;

                    document.documentElement.style.setProperty(varName, `"${value}"`);
                });
            } catch (err) {
                console.error("❌ Failed to restore sidebar titles:", err);
            }
        }
    }

    restoreSidebarTitles();

    function buildFeedbackForm(section) {
        // Wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "tb-bg-gradient-settings";
        wrapper.id = "tb-feedback-form";
        wrapper.style.marginTop = "16px";

        // Title
        const title = document.createElement("h4");
        title.className = "tb-section-background-title";
        title.innerText = "Send Us Your Feedback";
        wrapper.appendChild(title);

        // ✅ Add description paragraph below title
        const infoPara = document.createElement("p");
        infoPara.className = "tb-instruction-text";
        infoPara.textContent = "If you have any suggestions for ThemeBuilder that need to be updated or changed, please send us your feedback using this form below.";
        wrapper.appendChild(infoPara);

        // ✅ Embed iframe instead of custom form
        const iframe = document.createElement("iframe");
        iframe.src = "https://api.glitchgone.com/widget/form/lv8RbD6M9IzPnummFGHC";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";

        // Copy over the data attributes if needed:
        iframe.id = "inline-lv8RbD6M9IzPnummFGHC";
        iframe.setAttribute("data-layout", "{'id':'INLINE'}");
        iframe.setAttribute("data-trigger-type", "alwaysShow");
        iframe.setAttribute("data-trigger-value", "");
        iframe.setAttribute("data-activation-type", "alwaysActivated");
        iframe.setAttribute("data-activation-value", "");
        iframe.setAttribute("data-deactivation-type", "neverDeactivate");
        iframe.setAttribute("data-deactivation-value", "");
        iframe.setAttribute("data-form-name", "Theme Builder Feedback Form");
        iframe.setAttribute("data-height", "534");
        iframe.setAttribute("data-layout-iframe-id", "inline-lv8RbD6M9IzPnummFGHC");
        iframe.setAttribute("data-form-id", "lv8RbD6M9IzPnummFGHC");
        iframe.title = "Theme Builder Feedback Form";

        wrapper.appendChild(iframe);

        // ✅ Dynamically load the script
        const script = document.createElement("script");
        script.src = "https://api.glitchgone.com/js/form_embed.js";
        script.async = true;
        wrapper.appendChild(script);

        // Append wrapper to section
        section.appendChild(wrapper);
    }

    // --- 1️⃣ Create a helper to run your theme logic ---
    function reapplyThemeOnRouteChange() {
        waitForSidebarMenus(() => {
            applyLockedMenus(); // optional
            applyMenuCustomizations();
            initThemeBuilder(0);
            //applymenuReorder();
            applyMenuIconCustomizations();
        });
    }

    // --- 2️⃣ Detect URL changes in an SPA ---
    (function () {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        function onRouteChange() {
            reapplyThemeOnRouteChange();
        }

        history.pushState = function () {
            pushState.apply(this, arguments);
            onRouteChange();
        };
        history.replaceState = function () {
            replaceState.apply(this, arguments);
            onRouteChange();
        };

        window.addEventListener("popstate", onRouteChange);

        // Run on first load
        reapplyThemeOnRouteChange();
    })();

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
    // Create Builder UI
    function createBuilderUI(controlsContainer) {
        const existingIcon = document.getElementById("hl_header--themebuilder-icon");
        const existingDrawer = document.getElementById("themeBuilderDrawer");
        

        // 🛠️ If UI already exists, just rebind listeners and return
        if (existingIcon && existingDrawer) {
            bindThemeBuilderEvents(existingIcon, existingDrawer);
            return;
        }

        if (!controlsContainer) return;

        // Theme Builder Icon Button
        const btn = document.createElement("a");
        btn.href = "javascript:void(0);";
        btn.id = "hl_header--themebuilder-icon";
        btn.className = "tb-btn-icon";
        btn.innerHTML = '<span style="font-size:18px; display:none">🖌️</span>';
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


            // ===== Title, Logo & Close Button =====
            const drawerTitleWrapper = document.createElement('div');
            drawerTitleWrapper.className = "tb-drawer-title-wrapper";

            // Left: Title
            const title = document.createElement('div');
            title.innerHTML = "Theme Builder";
            title.className = "tb-title";
            
            // Version text as a small <span> below the title
            // const version = document.createElement('span');
            // version.className = "tb-version";
            // version.textContent = "v1.0";

            // // Append version inside the title div
            // title.appendChild(document.createElement('br')); // new line
            // title.appendChild(version);

            // Right: Logo + Close Button wrapper
            const rightWrapper = document.createElement('div');
            rightWrapper.className = "tb-header-right";

            // Logo
            // const logo = document.createElement('img');
            // logo.src = "https://themebuilder-six.vercel.app/images/growthable-icon.png";
            // logo.className = "tb-company-logo";
            // logo.alt = "Company Logo";

            // Close button (below logo)
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = "tb-drawer-close";

            // Assemble right section
            // rightWrapper.appendChild(logo);
            rightWrapper.appendChild(closeBtn);

            // Assemble header
            drawerTitleWrapper.appendChild(title);
            drawerTitleWrapper.appendChild(rightWrapper);
            drawer.appendChild(drawerTitleWrapper);

            //old code start from here 12-16-2025
            //// ===== Title with Close Button =====
            //const drawerTitleWrapper = document.createElement('div');
            //drawerTitleWrapper.className = "tb-drawer-title-wrapper";

            ////const title = document.createElement('div');
            ////title.textContent = "GlitchGone<br>Theme Builder";
            ////title.className = "tb-title";
            //const title = document.createElement('div');
            //title.innerHTML = "Theme Builder";
            //title.className = "tb-title";

            //const closeBtn = document.createElement('button');
            //closeBtn.innerHTML = '&times;';
            //closeBtn.className = "tb-drawer-close";

            //drawerTitleWrapper.appendChild(title);
            //drawerTitleWrapper.appendChild(closeBtn);
            //drawer.appendChild(drawerTitleWrapper);
            //end here 12-16-2025



            //// ===== Theme Mode Toggle (Dark / Light) =====
            //const toggleWrapper = document.createElement('div');
            //toggleWrapper.className = "tb-toggle-wrapper";

            //const toggleTitle = document.createElement('span');
            //toggleTitle.className = "tb-toggle-title";
            //toggleTitle.textContent = "Theme Mode";

            //const toggleSwitch = document.createElement('div');
            //toggleSwitch.className = "toggle-switch";

            //const toggleInput = document.createElement('input');
            //toggleInput.type = "checkbox";
            //toggleInput.className = "toggle-input";
            //toggleInput.id = "tb-theme-toggle";

            //const toggleLabel = document.createElement('label');
            //toggleLabel.className = "toggle-label";
            //toggleLabel.setAttribute("for", "tb-theme-toggle");

            //const sunIcon = document.createElement('span');
            //sunIcon.className = "toggle-icon sun";
            //sunIcon.innerHTML = "☀️";

            //const moonIcon = document.createElement('span');
            //moonIcon.className = "toggle-icon moon";
            //moonIcon.innerHTML = "🌙";

            //toggleLabel.appendChild(sunIcon);
            //toggleLabel.appendChild(moonIcon);

            //toggleSwitch.appendChild(toggleInput);
            //toggleSwitch.appendChild(toggleLabel);

            //toggleWrapper.appendChild(toggleTitle);
            //toggleWrapper.appendChild(toggleSwitch);
            //drawerTitleWrapper.appendChild(toggleWrapper);

            //// ===============================
            //// ✅ Load saved mode on startup
            //// ===============================
            //const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            //const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");
            //const currentMode = savedThemeObj?.themeData?.["--theme-mode"];
            //if (selectedTheme == "Dark Theme" || selectedTheme == "Light Theme") {
            //// Apply the saved or default theme
            //    applyTheme(currentMode);
            //    // Reflect saved mode in toggle + body
            //    if (currentMode === "dark") {
            //        toggleInput.checked = true;
            //        document.body.classList.add("dark-mode");
            //    } else {
            //        document.body.classList.remove("dark-mode");
            //    }
            //}
            //    // ===============================
            //    // ✅ Toggle change event
            //    // ===============================
            //    toggleInput.addEventListener("change", (e) => {
            //        const isDark = e.target.checked;
            //        const newMode = isDark ? "dark" : "light";
            //        // Apply and save theme using our helper
            //        applyTheme(newMode);
            //        // Visual mode toggle (optional animation or CSS class)
            //        document.body.classList.toggle("dark-mode", isDark);
            //    });

            //// Your dark -> light mapping
            //const darkThemes = darkthemes();
            //const lightThemes = getPredefinedThemes();

            //// ===============================
            //// ✅ Initialize toggle on page load
            //// ===============================
            //if (selectedTheme) {
            //    let isDark = false;

            //    // Check if saved theme is a dark theme
            //    if (darkThemes[selectedTheme]) {
            //        isDark = true;
            //    } else if (lightThemes[selectedTheme]) {
            //        isDark = false;
            //    } else {
            //        // fallback: check currentMode
            //        isDark = currentMode === "dark";
            //    }

            //    // Apply saved theme
            //    applyTheme(currentMode || (isDark ? "dark" : "light"));

            //    // Set toggle state and body class
            //    toggleInput.checked = isDark;
            //    //document.body.classList.toggle("dark-mode", isDark);
            //}

            //// ===============================
            //// ✅ Toggle change event
            //// ===============================
            //toggleInput.addEventListener("change", (e) => {
            //    const isDark = e.target.checked;
            //    const newMode = isDark ? "dark" : "light";

            //    // Apply and save theme using helper
            //    applyTheme(newMode);

            //    // Visual mode toggle
            //    //document.body.classList.toggle("dark-mode", isDark);
            //});

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
                        const instruction = document.createElement("p");
                        instruction.className = "tb-instruction-text";
                        instruction.textContent =
                            "💡 For Flat Color: Choose the same color for Start & End. For gradient color choose different in start and end color.";
                        section.appendChild(instruction);
                        addLogoSettings(section) 
                        addLogoUrlInputSetting(section);
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
                        const instruction = document.createElement("p");
                        instruction.className = "tb-instruction-text";
                        instruction.textContent =
                             "💡 For Flat Color: Choose the same color for Start & End. For gradient color choose different in start and end color. This Logo will only be use on login page.!";
                        section.appendChild(instruction);

                        const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");

                        const companylogo = document.createElement("h4");
                        companylogo.className = "tb-header-controls";
                        companylogo.textContent = "Logo";
                        section.appendChild(companylogo);
                        section.appendChild(createLoginLogoInput("Logo URL", "--login-company-logo"));

                        /* ================================
                           BACKGROUND (already working)
                        ================================ */
                        const bgSectionWrapper = document.createElement("div");
                        bgSectionWrapper.className = "bg-section-wrapper";

                        const header = document.createElement("h4");
                        header.className = "tb-header-controls";
                        header.textContent = "Background Color";
                        bgSectionWrapper.appendChild(header);

                        bgSectionWrapper.appendChild(createLoginGradientPicker());
                        // bgSectionWrapper.appendChild(createLoginBackgroundImageInput());

                        section.appendChild(bgSectionWrapper);

                        const loginimageurl= document.createElement("div");
                        loginimageurl.className = "bg-section-wrapper";

                        const headerd = document.createElement("h4");
                        headerd.className = "tb-header-controls";
                        headerd.textContent = "Login Image Appearance";
                        loginimageurl.appendChild(headerd);

                        loginimageurl.appendChild(createLoginBackgroundImageInput());

                        section.appendChild(loginimageurl);
                        /* ================================
                           ✅ CARD BG SECTION (NEW WRAPPER)
                        ================================ */
                        const cardBgSectionWrapper = document.createElement("div");
                        cardBgSectionWrapper.className = "card-bg-section-wrapper";

                        const loginheader = document.createElement("h4");
                        loginheader.className = "tb-header-controls";
                        loginheader.textContent = "Card BG Color";
                        cardBgSectionWrapper.appendChild(loginheader);

                        cardBgSectionWrapper.appendChild(createLoginCardGradientPicker());

                        section.appendChild(cardBgSectionWrapper);

                        function updateBgSectionState() {
                            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");

                            const isDefaultTheme = selectedTheme === "Default Theme";
                            const isVelvetNightTheme = selectedTheme === "VelvetNight Theme";
                            const isjetblack = selectedTheme === "JetBlack Luxury Gold Theme";

                            // Default Theme → disable BOTH
                            if (isDefaultTheme) {
                                //bgSectionWrapper.classList.add("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.add("disabled-section");
                            }
                            // VelvetNight Theme → disable ONLY card bg section
                            else if (isVelvetNightTheme) {
                                bgSectionWrapper.classList.remove("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.add("disabled-section");
                            }
                            // Any other theme → enable BOTH
                            else if(isjetblack){
                                loginimageurl.classList.add("disabled-section");
                            }else{
                                  bgSectionWrapper.classList.remove("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.remove("disabled-section");
                            }
                        }

                        // Run on load
                        updateBgSectionState();

                        // Listen when localStorage changes from other tabs
                        window.addEventListener("storage", function (event) {
                            if (event.key === "themebuilder_selectedTheme") {
                                updateBgSectionState();
                            }
                        });

                        // Listen when theme changes in the same tab
                        window.addEventListener("themeChanged", updateBgSectionState);


                        //const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");


                        //const header = document.createElement("h4");
                        //header.className = "tb-header-controls";
                        //header.textContent = "Background Gradient Color & Image";
                        //section.appendChild(header);

                        //section.appendChild(createLoginGradientPicker());
                        //// Attach it after End Color row
                        //section.appendChild(createLoginBackgroundImageInput());



                        const loginbutton = document.createElement("h4");
                        loginbutton.className = "tb-header-controls";
                        loginbutton.textContent = "Login Button";
                        section.appendChild(loginbutton);

                        section.appendChild(createLoginButtonGradientPicker());
                        section.appendChild(createLoginButtonBorderRadiusInput());
                        section.appendChild(createLoginButtonFontColorPicker());
                        // Append these after your other login button settings
                        section.appendChild(createLoginButtonHoverBgColorPicker());
                        //section.appendChild(createLoginButtonHoverTextColorPicker());
                        //section.appendChild(createLoginButtonTextInput());
                        const forgetpass = document.createElement("h4");
                        forgetpass.className = "tb-header-controls";
                        forgetpass.textContent = "Forgot Password & Policy Text Styling";
                        section.appendChild(forgetpass);


                        // Append these after your login button hover settings
                        section.appendChild(createLoginLinkTextColorPicker());
                        //section.appendChild(createLoginLinkTextSizeInput());
                        //section.appendChild(createForgetPasswordTextInput());

                        const heading = document.createElement("h4");
                        heading.className = "tb-header-controls";
                        heading.textContent = "Card Title";
                        section.appendChild(heading);

                        section.appendChild(createLoginHeadingControls());

                    },
                    "",
                    true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-database"style="color:white;margin-right:6px;font-size:17px;"></i>Advance Settings', (section) => {
                    const instruction = document.createElement("p");
                    instruction.className = "tb-instruction-text";
                    instruction.textContent =
                        "💡 For Flat Color: Choose the same color for Start & End. For gradient color choose different in start and end color.";

                    section.appendChild(instruction);
                    //buildThemeColorsSection(section); //Main Colors
                    //buildHeaderControlsSection(section);
                    buildHelpButtonControls(section);   // Profile Button Color Controls
                    buildProfileButtonControls(section);   // Profile Button Color Controls
                    addScrollbarSettings(section);   // Profile Button Color Controls
                    addDashboardCardSettings(section);
                    addBackgroundGradientSettings(section);
                   
                    //buildFeedbackForm(section);
                    addCursorSelectorSettings(section);

                    addCursorPointerSelectorSettings(section);
                    addLoaderColorSettings(section);
                    addLoaderSelectorSettings(section);
                    //buildHeadingSettings(section) //Commented Will see next time
                    // Add more advanced options later
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-lock"style="color:white;margin-right:6px;font-size:17px;"></i>Feature Lock & Hide', (section) => {
                    buildFeatureLockSection(section);
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-brands fa-intercom"style="color:white;margin-right:6px;font-size:17px;"></i>Menu Customizer', (section) => {
                    buildMenuCustomizationSection(section);
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<img src="https://raw.githubusercontent.com/iAsadSaleem/GlitchGone/main/feedback_icon.png" class="icon-img" />Feedback', (section) => {
                    buildFeedbackForm(section);
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

            // ===== Apply Button Outside Card =====
            const buttonsWrapper = document.createElement("div");
            buttonsWrapper.className = "tb-buttons-wrapper";

            const applyBtn = document.createElement("button");
            applyBtn.className = "tb-apply-btn";
            applyBtn.innerHTML = `<i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i> Apply Changes`;

            applyBtn.addEventListener("click", () => {
                const loaderOverlay = document.getElementById("tb-loader-overlay");

                // ✅ Show loader inside Theme Builder before popup
                loaderOverlay.style.display = "flex";

                setTimeout(() => {
                    loaderOverlay.style.display = "none"; // hide before confirm

                    showJCConfirm(
                        "Do you want to apply these changes? Press Yes to apply & reload the page. Press No to revert.",
                        async () => {
                            // ✅ Show success GIF only
                            const successOverlay = document.getElementById("tb-success-overlay");
                            successOverlay.style.display = "flex";

                            setTimeout(async () => {
                                try {
                                    // ✅ Your existing apply code here (unchanged)
                                    const themeData = collectThemeVars() || {};
                                    const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
                                    const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");

                                    savedTheme.themeData = savedTheme.themeData || {};
                                    // Preserve login background image
                                    if (savedTheme.themeData["--login-background-image"]) {
                                        themeData["--login-background-image"] =
                                            savedTheme.themeData["--login-background-image"];
                                    }

                                    Object.keys(themeData).forEach(key => {
                                        if (key !== "--lockedMenus" && key !== "--hiddenMenus") {
                                            savedTheme.themeData[key] = themeData[key];
                                        }
                                    });

                                    const localSaved = JSON.parse(localStorage.getItem("userTheme") || "{}");

                                    if (localSaved.themeData["--menuCustomizations"])
                                        savedTheme.themeData["--menuCustomizations"] = localSaved.themeData["--menuCustomizations"];

                                    if (localSaved.themeData["--agencyMenuOrder"])
                                        savedTheme.themeData["--agencyMenuOrder"] = localSaved.themeData["--agencyMenuOrder"];

                                    if (localSaved.themeData["--subMenuOrder"])
                                        savedTheme.themeData["--subMenuOrder"] = localSaved.themeData["--subMenuOrder"];

                                    const lockedMenus = JSON.parse(savedTheme.themeData["--lockedMenus"] || "{}");
                                    savedTheme.themeData["--lockedMenus"] = JSON.stringify(lockedMenus);

                                    const hiddenMenus = JSON.parse(savedTheme.themeData["--hiddenMenus"] || "{}");
                                    savedTheme.themeData["--hiddenMenus"] = JSON.stringify(hiddenMenus);

                                    const localSidebarTitles = JSON.parse(localStorage.getItem("--themebuilder_sidebarTitles") || "{}");
                                    let existingSidebarTitles = {};
                                    try {
                                        if (savedTheme.themeData["--sidebarTitles"]) {
                                            existingSidebarTitles = JSON.parse(savedTheme.themeData["--sidebarTitles"]);
                                        }
                                    } catch (e) {
                                        console.warn("Invalid existing --sidebarTitles JSON, resetting.", e);
                                        existingSidebarTitles = {};
                                    }
                                    // 🚫 Exclude sb_agency-accounts ONLY if it already exists
                                    if (existingSidebarTitles["sb_agency-accounts"]) {
                                        delete localSidebarTitles["sb_agency-accounts"];
                                    }
                                    const mergedSidebarTitles = { ...existingSidebarTitles, ...localSidebarTitles };
                                    savedTheme.themeData["--sidebarTitles"] = JSON.stringify(mergedSidebarTitles);

                                    localStorage.setItem("userTheme", JSON.stringify(savedTheme));

                                    const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
                                    const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
                                    const agencyId = localStorage.getItem("agn") ? atob(localStorage.getItem("agn")) : null;

                                    const dbData = {
                                        rlNo,
                                        email: email ? [email] : [],
                                        agencyId,
                                        themeData: savedTheme.themeData,
                                        selectedTheme: selectedtheme,
                                        bodyFont: savedTheme.themeData["--body-font"] || "Arial, sans-serif",
                                        updatedAt: new Date().toISOString(),
                                        updatedBy:email || null
                                    };
                                    // console.log('dbData:', dbData);
                                    //console.log('Here is the themeData:', dbData.themeData);
                                    await fetch("https://themebuilder-six.vercel.app/api/theme", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(dbData),
                                    });
                                    // --- Add new API call for loader-css status ---
                                    try {
                                        const loaderCSSRaw = savedTheme.themeData["--loader-css"];

                                        if (loaderCSSRaw) {
                                            const loaderCSSData = JSON.parse(loaderCSSRaw);

                                            const payload = {
                                                _id: loaderCSSData._id,
                                                email: email || null
                                            };

                                            await fetch("https://themebuilder-six.vercel.app/api/theme/loader-css/status", {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(payload),
                                            });
                                        }
                                    } catch (error) {
                                        console.error("Error sending loader-css status:", error);
                                    }

                                    location.reload();
                                } catch (error) {
                                    console.error(error);
                                    loaderOverlay.style.display = "none";
                                    alert("Something went wrong while applying changes.");
                                }
                            }, 500);
                        },
                        () => {
                            loaderOverlay.style.display = "none"; // No button hides loader
                        }
                    );
                }, 1500);
            });

            buttonsWrapper.appendChild(applyBtn);
            // --- Add branding after Apply button ---
            const brandingWrapper = document.createElement("div");
            brandingWrapper.className = "tb-branding-wrapper";

            // Set inner HTML with logo + text
            brandingWrapper.innerHTML = `
                <span>Powered by: Growthable</span>
                <img src="https://themebuilder-six.vercel.app/images/growthable-icon.png" alt="Growthable" class="tb-branding-logo">
            `;
            // Append right after Apply button
            buttonsWrapper.appendChild(brandingWrapper);
            drawer.appendChild(buttonsWrapper); // Outside card
            document.body.appendChild(drawer);
            // ✅ Create loader overlay inside Theme Builder drawer
            createTBLoader();
            createSuccessGIF();  
            // ===== Make Draggable =====
            (function makeDraggable(el, handle) {
                let isDragging = false;
                let startX = 0, startY = 0, offsetX = 0, offsetY = 0;

                handle.addEventListener("mousedown", (e) => {
                    startX = e.clientX;
                    startY = e.clientY;
                    offsetX = e.clientX - el.offsetLeft;
                    offsetY = e.clientY - el.offsetTop;
                    document.body.style.userSelect = "none";

                    const onMouseMove = (moveEvent) => {
                        const dx = moveEvent.clientX - startX;
                        const dy = moveEvent.clientY - startY;

                        // Only activate drag after a few pixels of movement
                        if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                            isDragging = true;
                            el.style.position = "absolute";
                            el.style.zIndex = "9999";
                        }

                        if (isDragging) {
                            el.style.left = (moveEvent.clientX - offsetX) + "px";
                            el.style.top = (moveEvent.clientY - offsetY) + "px";
                        }
                    };

                    const onMouseUp = () => {
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                        document.body.style.userSelect = "";
                        isDragging = false;
                    };

                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            })(drawer, drawerTitleWrapper);

            // Drawer toggle
            btn.addEventListener('click', () => {
                const drawer = document.getElementById("themeBuilderDrawer");
                if (drawer.classList.contains("open")) {
                    drawer.classList.remove("open");
                } else {
                    drawer.classList.add("open");
                }
            });

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // ⛔ stop bubbling so it doesn't re-open
                const drawer = document.getElementById("themeBuilderDrawer");
                drawer.classList.remove("open");
                drawer.style.left = ""; // 🛠️ Reset position so drag state doesn’t break clicks
                drawer.style.top = "";
                drawer.style.position = "";   // 🧩 Added
                drawer.style.zIndex = "";     // 🧩 Added
            });

            bindThemeBuilderEvents(btn, drawer);
        }
    }
    function bindThemeBuilderEvents(btn, drawer) {
        if (!btn || !drawer) return;

        // Remove any old listeners
        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);

        // Re-bind click to toggle drawer
        newBtn.addEventListener("click", () => {
            drawer.classList.toggle("open");
        });

        // Re-bind close button
        const closeBtn = drawer.querySelector(".tb-drawer-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                drawer.classList.remove("open");
                drawer.style.left = "";
                drawer.style.top = "";
            });
        }

    }
    function injectThemeBuilderMenu() {
        // Find the "Login As" element
        const loginAsItem = Array.from(document.querySelectorAll(".dropdown-item"))
            .find(el => el.textContent.trim().startsWith("Login As"));
        if (!loginAsItem) {
            console.warn("❗ 'Login As' menu item not found!");
            return;
        }

        // Prevent duplicate insert
        if (document.querySelector(".theme-builder-highlight")) {
            return;
        }

        // Create new Theme Builder item
        const themeBuilderItem = document.createElement("div");
        themeBuilderItem.className = "py-2 dropdown-item theme-builder-highlight";
        themeBuilderItem.style.cursor = "var(--custom-pointer)";
        themeBuilderItem.innerHTML = `
        <span class="rainbow-text"> Theme Builder</span>
        <span class="new-badge">NEW</span>
    `;

        // ✅ Add click: Open Theme Builder drawer
        themeBuilderItem.addEventListener("click", function () {
            let controlsContainer = document.querySelector(".hl_header--controls") || document.body;
            createBuilderUI(controlsContainer);
            document.getElementById("themeBuilderDrawer")?.classList.add("open"); // Show drawer
        });

        // Insert before "Login As"
        loginAsItem.parentNode.insertBefore(themeBuilderItem, loginAsItem);

        // Inject CSS (only once)
        if (!document.getElementById("theme-builder-style")) {
            const style = document.createElement("style");
            style.id = "theme-builder-style";
            style.innerHTML = `
            .theme-builder-highlight {
                height:50px;
                position: relative;
                border: 2px solid transparent;
                border-radius: 6px;
                background-color: rgba(255, 255, 255, 0.05);
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: borderGlow 2s infinite;
                padding-right: 10px;
            }
            @keyframes borderGlow {
                0% { box-shadow: 0 0 10px red; border-color: red; }
                25% { box-shadow: 0 0 10px orange; border-color: orange; }
                50% { box-shadow: 0 0 10px lime; border-color: lime; }
                75% { box-shadow: 0 0 10px cyan; border-color: cyan; }
                100% { box-shadow: 0 0 10px violet; border-color: violet; }
            }
            .rainbow-text {
                position: relative;
                left: 50px;
                font-size: 23px;
                font-weight: 700;
                -webkit-background-clip: text;
                color: black;
                animation: rainbowMove 2s linear;
            }
            @keyframes rainbowMove {
                from { background-position: 0%; }
                to { background-position: 100%; }
            }
            .new-badge {
                background: red;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 8px;
                margin-left: 10px;
                animation: pulse 1.2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 5px red; }
                50% { transform: scale(1.2); box-shadow: 0 0 10px yellow; }
                100% { transform: scale(1); box-shadow: 0 0 5px red; }
            }
        `;
            document.head.appendChild(style);
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
                const response = await fetch(`https://themebuilder-six.vercel.app/api/theme/${decodedEmail}`);
                const data = await response.json();
                if (data.success) {
                    injectThemeBuilderMenu(); 
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
    (function () {
        let lastUrl = location.href;

        new MutationObserver(() => {
            const currentUrl = location.href;

            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                handleUrlChange();
            }
        }).observe(document, { subtree: true, childList: true });

    })();
    function handleUrlChange() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeName = savedThemeObj.selectedTheme;

        if (!themeName) return;

        const isSubAccount = window.location.pathname.startsWith("/v2/location/");

        if (themeName === "BlueWave TopNav Theme" && isSubAccount) {
            window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
            enableBlueWaveTopNav();
        } else {
            window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
            resetGhlSidebar();
            disableBlueWaveTopNav();
        }
    }

    document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const drawer = document.getElementById("themeBuilderDrawer");
                if (drawer && drawer.classList.contains("open")) {
                    drawer.classList.remove("open");
                }
            }
        });

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            // ✅ runs late now
            initThemeBuilder(0);
        }, 500); // ⏳ delay so "Login As" exists
    });

    document.addEventListener('DOMContentLoaded', () =>
        setTimeout(() => initThemeBuilder(0), 1050));
        setTimeout(() => initThemeBuilder(0), 1050);

// ---- Hidden/Locked menus ----

// Function to get current location ID from URL
function getCurrentLocationId() {
  const path = window.location.pathname;
  const parts = path.split('/');
  const locationIndex = parts.indexOf('location');
  if (locationIndex !== -1 && parts.length > locationIndex + 1) {
    return parts[locationIndex + 1];
  }
  return null; // No location ID in URL (agency level)
}

function restoreHiddenMenus() {
  const savedRaw = localStorage.getItem("userTheme");
  const saved = JSON.parse(savedRaw) || {};
  if (!saved.themeData) return;

  const locationId = getCurrentLocationId();
  
  if (locationId) {
    // Location-specific mode - use --hiddenMenus
    if (!saved.themeData["--hiddenMenus"]) return;
    let hiddenMenus;
    try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --hiddenMenus"); return; }
    if (!hiddenMenus || typeof hiddenMenus !== "object" || !hiddenMenus[locationId]) return;
    
    Object.keys(hiddenMenus[locationId]).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      const toggleEl = document.getElementById("hide-" + menuId);
      if (!menuEl) return;
      
      const menuConfig = hiddenMenus[locationId][menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  } else {
    // Global mode - use --agencyLockedHideMenus
    if (!saved.themeData["--agencyLockedHideMenus"]) return;
    let agencyData;
    try { agencyData = JSON.parse(saved.themeData["--agencyLockedHideMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --agencyLockedHideMenus"); return; }
    if (!agencyData || typeof agencyData !== "object") return;
    
    let globalHidden = agencyData.hidden || {};
    Object.keys(globalHidden).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      const toggleEl = document.getElementById("hide-" + menuId);
      if (!menuEl) return;
      
      const menuConfig = globalHidden[menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  }
}

function applyHiddenMenus() { 
  restoreHiddenMenus(); 
}

function applyLockedMenus() {
  const savedRaw = localStorage.getItem("userTheme");
  const saved = JSON.parse(savedRaw) || {};
  if (!saved.themeData) return;

  const locationId = getCurrentLocationId();
  
  if (locationId) {
    // Location-specific mode - use --lockedMenus
    if (!saved.themeData["--lockedMenus"]) return;
    let lockedMenus;
    try { lockedMenus = JSON.parse(saved.themeData["--lockedMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --lockedMenus"); return; }
    if (!lockedMenus || typeof lockedMenus !== "object" || !lockedMenus[locationId]) return;
    
    Object.keys(lockedMenus[locationId]).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      if (!menuEl) return;
      
      const isLocked = !!lockedMenus[locationId][menuId];
      
      if (isLocked) {
        if (!menuEl.querySelector(".tb-lock-icon")) {
          const lockIcon = document.createElement("i");
          lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
          lockIcon.style.color = "#F54927";
          menuEl.appendChild(lockIcon);
        }
        menuEl.style.opacity = "0.6";
        menuEl.style.cursor = "not-allowed";
        // Extract the popup type stored for this menu
                const lockData = locationId
                    ? lockedMenus[locationId]?.[menuId]
                    : lockedMenus[menuId];
                const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
                const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
                const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
                if (menu.dataset.tbLockBound !== "1") {
                    menu.addEventListener("click", (e) => {
                        blockMenuClick(e, menuId);
                        showPreviewPopup(popupType, popupUrl, popupHeadline);
                    }, true);
                    menu.dataset.tbLockBound = "1";
                }
      } else {
        const icon = menuEl.querySelector(".tb-lock-icon");
        if (icon) icon.remove();
        menuEl.style.opacity = "";
        menuEl.style.cursor = "";
        if (menuEl.dataset.tbLockBound === "1") {
          menuEl.removeEventListener("click", blockMenuClick, true);
          delete menuEl.dataset.tbLockBound;
        }
      }
    });
  } else {
    // Global mode - use --agencyLockedHideMenus
    if (!saved.themeData["--agencyLockedHideMenus"]) return;
    let agencyData;
    try { agencyData = JSON.parse(saved.themeData["--agencyLockedHideMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --agencyLockedHideMenus"); return; }
    if (!agencyData || typeof agencyData !== "object") return;
    
    let globalLocked = agencyData.locked || {};
    Object.keys(globalLocked).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      if (!menuEl) return;
      
      const lockData = globalLocked[menuId];
      const isLocked = lockData && typeof lockData === 'object' ? lockData.locked : !!lockData;
      
      if (isLocked) {
        if (!menuEl.querySelector(".tb-lock-icon")) {
          const lockIcon = document.createElement("i");
          lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
          lockIcon.style.color = "#F54927";
          menuEl.appendChild(lockIcon);
        }
        menuEl.style.opacity = "0.6";
        menuEl.style.cursor = "not-allowed";
        // Extract the popup type stored for this menu
                const lockData = locationId
                    ? lockedMenus[locationId]?.[menuId]
                    : lockedMenus[menuId];
                const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
                const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
                const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
                if (menu.dataset.tbLockBound !== "1") {
                    menu.addEventListener("click", (e) => {
                        blockMenuClick(e, menuId);
                        showPreviewPopup(popupType, popupUrl, popupHeadline);
                    }, true);
                    menu.dataset.tbLockBound = "1";
                }
      } else {
        const icon = menuEl.querySelector(".tb-lock-icon");
        if (icon) icon.remove();
        menuEl.style.opacity = "";
        menuEl.style.cursor = "";
        if (menuEl.dataset.tbLockBound === "1") {
          menuEl.removeEventListener("click", blockMenuClick, true);
          delete menuEl.dataset.tbLockBound;
        }
      }
    });
  }
}

 function blockMenuClick(e, menuId) {
        e.preventDefault();
        e.stopImmediatePropagation();

        // Get popupType from localStorage
        const savedRaw = localStorage.getItem("userTheme");
        const saved = JSON.parse(savedRaw) || {};
        const lockedMenus = saved.themeData && saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
        const agencyData = saved.themeData && saved.themeData["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
        const locationId = getCurrentLocationId();

        let popupType = "simple"; // default
        if (locationId) {
            const lockData = lockedMenus[locationId]?.[menuId];
            console.log(lockedMenus,'Here is the lockedMenus');
            console.log(lockData,'Here is the lockData');
            if (lockData && typeof lockData === 'object') {
                popupType = lockData.popupType || "simple";
            }
        } else {
            const lockData = agencyData.locked?.[menuId];
            if (lockData && typeof lockData === 'object') {
                popupType = lockData.popupType || "simple";
            }
        }
        console.log('(settings.js) last method popup type on click:', popupType);
        showPreviewPopup(popupType);
    }
})();
