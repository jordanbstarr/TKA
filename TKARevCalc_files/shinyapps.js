(function() {
  var logit, render, url;

  logit = function(msg) {
    if ((typeof console !== "undefined" && console !== null) && (console.debug != null)) {
      return console.debug(msg);
    }
  };

  render = function(data) {};

  $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    href: "" + shinyapps_static_url + "/css/misc.css"
  }).appendTo("head");

  if (self !== top) {
    window.addEventListener('beforeunload', function(event) {
      if (window.location.host !== document.activeElement.host && (document.activeElement.href != null)) {
        return window.parent.postMessage('shinyapps_url_change ' + document.activeElement.href, '*');
      }
    });
  }

  if (typeof shinyapps_app_id !== "undefined" && shinyapps_app_id !== null) {
    url = "/__shinyapps__/v1/public/applications/" + shinyapps_app_id;
  }

}).call(this);
