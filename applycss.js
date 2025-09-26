(function () {
    function Main() {
        var rlno = localStorage.getItem("rlno");
        var email = localStorage.getItem("email");

        // Prefer email if exists
        var identifier = email ? email.toLowerCase() : rlno;

        if (!identifier) {
            setTimeout(Main, 200);
            return;
        }

        var url = "https://theme-builder-delta.vercel.app/api/theme/file/" + encodeURIComponent(identifier);

        fetch(url)
            .then(res => res.text())
            .then(cssText => {
                try {
                    var style = document.createElement("style");
                    style.innerHTML = cssText;  // ⬅️ no atob, directly inject
                    document.head.appendChild(style);
                } catch (err) {
                    console.error("❌ Failed to apply CSS:", err.message);
                }
            })
            .catch(err => console.error("❌ Fetch error:", err.message));
    }

    Main();
})();
