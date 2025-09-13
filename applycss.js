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
            .then(res => res.text())  // ✅ no need for res.ok check, your API always returns Base64
            .then(encodedCSS => {
                try {
                    var decodedCSS = atob(encodedCSS.trim()); // decode Base64 to CSS
                    console.log("✅ CSS loaded successfully");

                    var style = document.createElement("style");
                    style.innerHTML = decodedCSS;
                    document.head.appendChild(style);
                } catch (err) {
                    console.error("❌ Failed to decode CSS:", err.message);
                }
            })
            .catch(err => console.error("❌ Fetch error:", err.message));
    }

    Main();
})();
