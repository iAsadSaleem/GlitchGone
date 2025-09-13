(function () {
    function Main() {
        var rlno = localStorage.getItem("rlno");
        var email = localStorage.getItem("email");

        // ✅ Prefer email if exists
        var identifier = email ? email.toLowerCase() : rlno;

        if (!identifier) {
            setTimeout(Main, 200);
            return;
        }

        // ✅ Always fetch CSS file from your deployed API
        var code = "https://theme-builder-delta.vercel.app/api/theme/file/" + encodeURIComponent(identifier);

        fetch(code)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Unauthorized or server error");
                }
                return res.text();
            })
            .then(encodedCSS => {
                var decodedCSS = atob(encodedCSS.trim());
                var style = document.createElement("style");
                style.innerHTML = decodedCSS;
                document.head.appendChild(style);
            })
            .catch(err => console.error("❌ Failed to load CSS:", err.message));
    }

    Main();
})();
