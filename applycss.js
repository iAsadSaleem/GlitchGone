(function () {
    var key = [btoa("0-373-489")]; // Use plain number, encode once

    function Main() {
        var rlno = localStorage.getItem("rlno");
        if (!rlno) {
            setTimeout(Main, 200);
            return;
        }

        if (key.includes(rlno)) {
            var code = "https://glitch-gone-nu.vercel.app/style-base64.txt";
            fetch(code)
                .then(res => res.text())
                .then(encodedCSS => {
                    var decodedCSS = atob(encodedCSS.trim());
                    var style = document.createElement("style");
                    style.innerHTML = decodedCSS;
                    document.head.appendChild(style);
                })
                .catch(err => console.error("❌ Failed to load CSS", err));
        } else {
            console.log("❌ Unauthorized Relationship Number:", rlno);
        }
    }

    Main();
})();
