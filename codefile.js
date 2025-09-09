(function () {
    const settingsUrl = "/settings/company";

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none"; // hide it
    iframe.src = settingsUrl;

    iframe.onload = function () {
        try {
            // Access the iframe DOM
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            const labelSpan = Array.from(doc.querySelectorAll("span"))
                .find(span => span.textContent.trim() === "Relationship Number");

            if (labelSpan && labelSpan.nextElementSibling) {
                const rlNo = labelSpan.nextElementSibling.textContent.trim();
                localStorage.setItem("rlno", btoa(rlNo));
                console.log("Relationship Number stored:", rlNo);
            }
        } catch (err) {
            console.error("Cannot access iframe DOM:", err);
        }

        // Remove the iframe after use
        iframe.remove();
    };

    // Append iframe to body
    document.body.appendChild(iframe);
})();
