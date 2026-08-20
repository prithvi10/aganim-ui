(function () {
  if (document.querySelector(".series-topnav")) return;

  var host = window.location.hostname;
  var isSubdomain =
    host === "prithvirajpawar.aganim-ai.com" ||
    host === "prithvirajpawar.localhost" ||
    host === "prithvirajpawar.local";

  var homeHref;
  if (isSubdomain) {
    homeHref = "/#study-series";
  } else if (host === "localhost" || host === "127.0.0.1") {
    homeHref = "/profile#study-series";
  } else {
    homeHref = "https://prithvirajpawar.aganim-ai.com/#study-series";
  }

  document.body.classList.add("has-series-topnav");

  var bar = document.createElement("div");
  bar.className = "series-topnav";
  bar.setAttribute("role", "navigation");
  bar.setAttribute("aria-label", "Portfolio navigation");
  bar.innerHTML =
    '<a class="home" href="' +
    homeHref +
    '"><span class="home-arrow" aria-hidden="true">←</span> Prithviraj Pawar</a>' +
    '<a class="section-link" href="' +
    homeHref +
    '">Study Series</a>';

  document.body.insertBefore(bar, document.body.firstChild);
})();
