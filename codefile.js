(function () {
    function findAndStore() {
        let rlStored = localStorage.getItem("rlno");
        let emailStored = localStorage.getItem("userEmail");

        let found = false;

        // 🔹 Find and store Relationship Number if not already stored
        if (!rlStored) {
            var labelSpan = Array.from(document.querySelectorAll("span"))
                .find(span => span.textContent.trim() === "Relationship Number");
            if (labelSpan && labelSpan.nextElementSibling) {
                var rlNo = labelSpan.nextElementSibling.textContent.trim();
                localStorage.setItem("rlno", btoa(rlNo));
                found = true;
            }
        }

        // 🔹 Find and store Email if not already stored
        if (!emailStored) {
            var emailDiv = document.querySelector("div.text-xs.text-gray-900.truncate");
            if (emailDiv) {
                var email = emailDiv.textContent.trim();
                localStorage.setItem("userEmail", btoa(email));
                found = true;
            }
        }

        // 🔹 If at least one is still missing, keep retrying
        if (!localStorage.getItem("rlno") || !localStorage.getItem("userEmail")) {
            setTimeout(findAndStore, 200);
        }
    }

    findAndStore();
})();
