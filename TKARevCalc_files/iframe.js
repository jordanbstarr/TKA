(function() {
  var branding, calcHeight, logit, max_url_changes, pymParent, render, url, url_change_count;

  pymParent = new pym.Parent('shinyapp', shinyapp_url, {});

  if (!Array.prototype.last) {
    Array.prototype.last = function() {
      return this[this.length - 1];
    };
  }

  logit = function(msg) {
    if ((typeof console !== "undefined" && console !== null) && (console.debug != null)) {
      return console.debug(msg);
    }
  };

  branding = function(enable) {
    var branding_bar_css_class, branding_bar_id, branding_bar_spacer_id, branding_html, rstudio_link, shinyapps_link;
    if (enable == null) {
      enable = true;
    }
    $("<link/>", {
      rel: "stylesheet",
      type: "text/css",
      href: "" + static_base_url + "/css/branding.css"
    }).appendTo("head");
    branding_bar_id = "rstudio_branding_bar";
    branding_bar_css_class = "rstudio-branded";
    branding_bar_spacer_id = "rstudio_branding_bar_spacer";
    rstudio_link = "http://www.rstudio.com";
    shinyapps_link = "https://www.shinyapps.io";
    branding_html = "<div id=\"" + branding_bar_id + "\">\n  <span class=\"pull-left\" id=rstudio_branding_title onclick=\"location.href='" + shinyapps_link + "'\">shinyapps.io</span>\n  <div class=\"pull-right\" id=rstudio_branding_powered_by onclick=\"location.href='" + rstudio_link + "';\">\n    <div class=\"pull-right\" id=rstudio_branding_logo>\n      <a href=\"" + rstudio_link + "\">\n        <img id=rstudio_branding_logo_img src=\"" + static_base_url + "/img/white-rstudio-logo.png\" alt=\"RStudio\">\n      </a>\n    </div>\n    <span class=\"pull-right\">Powered by &nbsp;</span>\n  </div>\n</div>\n<div id=\"" + branding_bar_spacer_id + "\"></div>";
    if (enable) {
      $('body').addClass(branding_bar_css_class);
      return $('body').prepend(branding_html);
    } else {
      $('body').removeClass(branding_bar_css_class);
      $("#" + branding_bar_id).hide();
      return $("#" + branding_bar_spacer_id).hide();
    }
  };

  render = function(data) {
    return branding(data.branding);
  };

  if (typeof shinyapp_id !== "undefined" && shinyapp_id !== null) {
    url = "/__shinyapps__/v1/public/applications/" + shinyapp_id;
    $.ajax({
      url: url,
      dataType: "json",
      success: function(data, textStatus, jqXHR) {
        return render(data);
      }
    });
  }

  max_url_changes = 10;

  url_change_count = 0;

  window.addEventListener('message', (function(e) {
    if (/internal.shinyapps.(test|io)$/.test(e.origin)) {
      if (/^shinyapps_url_change /.test(e.data)) {
        if (url_change_count < max_url_changes) {
          url_change_count += 1;
          url = e.data.split('shinyapps_url_change ').last();
          return window.location.href = url;
        }
      }
    }
  }), false);

  calcHeight = function() {
    var headerDimensions;
    headerDimensions = $('#rstudio_branding_bar_spacer').height();
    return $('#shinyapp iframe').height($(window).height() - headerDimensions);
  };

  $(document).ready(function() {
    calcHeight();
    return $(window).resize(function() {
      return calcHeight();
    }).load(function() {
      return calcHeight();
    });
  });

}).call(this);
