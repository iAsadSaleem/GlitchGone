(function () {
    const settingsUrl = "/settings/company";
    const dashboardUrl = "/agency_dashboard/";
    const cameFromDashboard = new URLSearchParams(window.location.search).get("fromDashboard");

    // If we are not on the settings page, go there
    if (window.location.pathname !== settingsUrl && !cameFromDashboard) {
        window.location.href = settingsUrl + "?fromDashboard=true";
        return;
    }

    // Function to grab Relationship Number
    function grabRLNo() {
        const labelSpan = Array.from(document.querySelectorAll("span"))
            .find(span => span.textContent.trim() === "Relationship Number");

        if (labelSpan && labelSpan.nextElementSibling) {
            const rlNo = labelSpan.nextElementSibling.textContent.trim();
            localStorage.setItem("rlno", btoa(rlNo));

            // Return to dashboard if we came from there
            if (cameFromDashboard) {
                window.location.href = dashboardUrl;
            }
        } else {
            setTimeout(grabRLNo, 200); // Retry until element loads
        }
    }

    grabRLNo();
})();
