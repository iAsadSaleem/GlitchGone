(function () {
    function findAndStore() {
        localStorage.removeItem("rlno");
        localStorage.removeItem("gem");
        function tryStore() {
            let rlStored = localStorage.getItem("rlno");
            let gem = localStorage.getItem("gem");

            let found = false;

            if (!rlStored) {
                var labelSpan = Array.from(document.querySelectorAll("span"))
                    .find(span => span.textContent.trim() === "Relationship Number");
                if (labelSpan && labelSpan.nextElementSibling) {
                    var rlNo = labelSpan.nextElementSibling.textContent.trim();
                    localStorage.setItem("rlno", btoa(rlNo));
                    found = true;
                }
            }

            if (!gem) {
                var emailDiv = document.querySelector("div.text-xs.text-gray-900.truncate");
                if (emailDiv) {
                    var email = emailDiv.textContent.trim();
                    localStorage.setItem("g-em", btoa(email));
                    found = true;
                }
            }

            if (!localStorage.getItem("rlno") || !localStorage.getItem("gem")) {
                setTimeout(tryStore, 200);
            }
        }

        tryStore();
    }

    findAndStore();

    window.addEventListener("load", findAndStore);

    window.addEventListener("beforeunload", findAndStore);
})();
