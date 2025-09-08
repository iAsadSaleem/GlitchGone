(function () {
  function srlno() {
    var labelSpan = Array.from(document.querySelectorAll("span"))
      .find(span => span.textContent.trim() === "Relationship Number");

    if (labelSpan && labelSpan.nextElementSibling) {
      var rlNo = labelSpan.nextElementSibling.textContent.trim();
      var encodedRel = btoa(rlNo); // Encode the correct variable
      localStorage.setItem("rlno", encodedRel);
    } else {
      setTimeout(srlno, 200);
    }
  }

  srlno();
})();
