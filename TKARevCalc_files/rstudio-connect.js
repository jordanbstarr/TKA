
(function( $ ) {
  var exports = window.ShinyServer = window.ShinyServer || {};
  exports.debugging = false;
  $(function() {
    /**
     * Detects whether or not this application is an embedded sub app in 
     * a larger rmd file.
     **/
    function isSubApp(){
      var subApp = window.location.search.match(/\?.*__subapp__=(\d)/);
      return (subApp && subApp[1]); //is truthy
    }

    function spliceString(str, idx, rem, s ) {
      return (str.slice(0,idx) + s + str.slice(idx + Math.abs(rem)));
    }

    $('body').on('click', 'a', function(ev){
      if (ev.currentTarget.href === null || ! ev.currentTarget.href || isSubApp()){
        return;
      }
      var href = ev.currentTarget.href;
      href = href.replace(/\/_w_[a-f0-9]+\//g, '/');

      // href doesn't include the query string, which means that if one is present
      // (e.g. ?rscembedded=1) anchor links will be labeled page changes by the
      // browser, triggering a reload (and perhaps nested toolbars).
      var ind = href.indexOf('#');
      if ( ind === -1){
        ind = href.length;
      }

      // Only manipulate if we're on the same page.
      var trimmedLoc = location.href;
      if (trimmedLoc.indexOf('?') !== -1){
        trimmedLoc = trimmedLoc.substring(0, trimmedLoc.indexOf('?'));
      }
      if (trimmedLoc.indexOf('#') !== -1){
        trimmedLoc = trimmedLoc.substring(0, trimmedLoc.indexOf('#'));
      }
      if (href.substring(0, ind) === trimmedLoc){
        href = spliceString(href, ind, 0, location.search);
      }

      ev.currentTarget.href = href;
    });

    if (typeof(Shiny) != "undefined") {
      (function() {
        var $ = jQuery;
        function formatDate(date) {
          if (!date)
            return '?/?/????';

          var months = ['January', 'February', 'March', 'April', 'May',
            'June', 'July', 'August', 'September', 'October', 'November',
            'December'];
          return months[date.getMonth()] + ' ' + date.getDate() + ', ' +
            date.getFullYear();
        }

        function onLicense(license) {
          if (!license)
            return;
          if (license.status !== 'expired' && license.status !== 'grace')
            return;

          var noun = license.evaluation ? 'evaluation' : 'license';
          var message = 'Your RStudio Connect Server ' + noun + ' expired';
          if (license.expiration)
            message += ' on ' + formatDate(new Date(license.expiration));
          message += '.';

          if (license.status === 'expired') {
            setTimeout(function() {
              window.alert(message + '\n\n' +
                'Please purchase and activate a license.');
            }, 0);
            if (window.Shiny && Shiny.shinyapp && Shiny.shinyapp.$socket) {
              Shiny.shinyapp.$socket.close();
            }
          } else if (license.status === 'grace') {
            $('.shiny-server-expired').remove();
            var div = $(
              '<div class="shiny-server-expired">' +
              'WARNING: ' + message +
              '</div>'
            );
            $('body').append(div);
            setTimeout(function() {
              div.animate({
                top: -(div.height() + 16 /* total vertical padding */)
              }, 'slow', function() {
                div.remove();
              });
            }, 8000);
          }
        }      

        var loc = location.pathname;
        loc = loc.replace(/\/$/, '');
        
        // TODO: Condense these down to one call for all subapps.
        var xhr = jQuery.ajax("__token__", {
          type: "GET",
          async: false,
          cache: false
        });
        if (xhr.status != 200)
          throw new Error("Failed to retrieve auth token");
        var token = xhr.responseText;
                  
        var search = location.search.replace(/^\?/, '')
        var worker = '';
        if (search.match(/\bw=[^&]+/)){
          worker = search.match(/\bw=[^&]+/)[0].substring(2);
        }

        if (!worker){
          // Check to see if we were assigned a base href
          var base = $('base').attr('href');
          // Extract the worker ID if it's included in a larger URL.
          mtch = base.match(/_w_(\w+)\//);
          base = mtch[1];
          if (base){
            // Trim trailing slash
            base = base.replace(/\/$/, '');
            base = base.replace(/^_w_/, '');
            worker = base;
          }
        }

        var sockjsUrl = loc + "/__sockjs__/t=" + token + '/w=' + worker  + 
          '/s=' + (isSubApp()? '1':'0')

        exports.url = sockjsUrl;

        if (isSubApp()) {
          // Take from nodeJS's path module.
          // The doc's on this function are lacking, but it looks like the last 
          // element in each path is treated as a file (regardless of the
          // presence/absence of a trailing slash). So the relativePath from 
          // `/foo/a` to `/foo/b` is the empty string, since you're already
          // in the right directory -- the same holds true if you add trailing
          // slashes to the above examples. So if we want to resolve the
          // relative difference between the above two dirs, we need to add 
          // something to each, like `/whatever/`, then we'd get '../b'.
          // This is why we append `__sockjs__` to each path before comparing.
          function getRelativePath(from, to, includeLast) {
            // The last element would otherwise get trimmed off, if you want it,
            // add some garbage to the end that can be trimmed.
            if (includeLast){
              to += '/a';
            }

            function trim(arr) {
              var start = 0;
              for (; start < arr.length; start++) {
                if (arr[start] !== '') break;
              }

              var end = arr.length - 1;
              for (; end >= 0; end--) {
                if (arr[end] !== '') break;
              }

              if (start > end) return [];
              return arr.slice(start, end - start + 1);
            }

            var fromParts = trim(from.split('/'));
            var toParts = trim(to.split('/'));

            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
              if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
              }
            }

            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
              outputParts.push('..');
            }

            outputParts = outputParts.concat(toParts.slice(samePartsLength));

            return outputParts.join('/');
          }

          Shiny.createSocket = function() {
            try {
              if (window.parent.ShinyServer && window.parent.ShinyServer.multiplexer) {
                var relURL = getRelativePath(window.parent.ShinyServer.url, sockjsUrl, true);
                return window.parent.ShinyServer.multiplexer.open(relURL);
              }
              log("Couldn't get multiplexer: multiplexer not found in parent");
            } catch (e) {
              log("Couldn't get multiplexer: " + e);
            }

            var fakeSocket = {};
            setTimeout(function() {
              if (fakeSocket.onclose) {
                fakeSocket.onclose();
              }
            }, 0);
          };
          Shiny.oncustommessage = function(message) {
            if (typeof message === "string" && console.log) console.log(message); // Legacy format
            if (message.alert && console.log) console.log(message.alert);
            if (message.console && console.log) console.log(message.console);
          };
          return;
        }

        // Keep session alive by refreshing cookies every 5 minutes
        jQuery.ajax("__extendsession__", {type:"POST", async: true});
        var extendSessionInterval = setInterval(function(){jQuery.ajax("__extendsession__", {type:"POST", async: true});},5*60*1000);

        var supports_html5_storage = exports.supports_html5_storage = function() {
          try {
            return 'localStorage' in window && window['localStorage'] !== null;
          } catch (e) {
            return false;
          }
        }

        var availableOptions = ['websocket','xhr-streaming','iframe-eventsource','iframe-htmlfile','xhr-polling','iframe-xhr-polling','jsonp-polling',];
        
        var store = null;
        var whitelist = [];        

        if (supports_html5_storage()){
          store = window.localStorage;
          whitelistStr = store["shiny.whitelist"];
          if (!whitelistStr || whitelistStr === ""){
            whitelist = availableOptions;
          } else{
            whitelist = JSON.parse(whitelistStr);
          }
        } 
  
        if (!whitelist){
          whitelist = availableOptions;
        }

        var networkSelectorVisible = false;
        var networkSelector = undefined;
        var networkOptions = undefined;

        // Build the SockJS network protocol selector. 
        // 
        // Has the side-effect of defining values for both "networkSelector"
        // and "networkOptions".
        function buildNetworkSelector() {
          networkSelector = $('<div style="top: 50%; left: 50%; position: absolute;">' + 
                           '<div style="position: relative; width: 300px; margin-left: -150px; padding: .5em 1em 0 1em; height: 400px; margin-top: -190px; background-color: #FAFAFA; border: 1px solid #CCC; font.size: 1.2em;">'+
                           '<h3>Select Network Methods</h3>' +
                           '<div id="ss-net-opts"></div>' + 
                           '<div id="ss-net-prot-warning" style="color: #44B">'+(supports_html5_storage()?'':"These network settings can only be configured in browsers that support HTML5 Storage. Please update your browser or unblock storage for this domain.")+'</div>' +
                           '<div style="float: right;">' +
                           '<input type="button" value="Reset" onclick="ShinyServer.enableAll()"></input>' +
                           '<input type="button" value="OK" onclick="ShinyServer.toggleNetworkSelector();" style="margin-left: 1em;" id="netOptOK"></input>' +
                           '</div>' +
                           '</div></div>');

          networkOptions = $('#ss-net-opts', networkSelector);
          $.each(availableOptions, function(index, val){
            var checked = ($.inArray(val, whitelist) >= 0);
            var opt = $('<label><input type="checkbox" id="ss-net-opt-'+val+'" name="shiny-server-proto-checkbox" value="'+index+'" '+
                        (ShinyServer.supports_html5_storage()?'':'disabled="disabled"')+
                        '> '+val+'</label>').appendTo(networkOptions);
            var checkbox = $('input', opt);
            checkbox.change(function(evt){
              ShinyServer.setOption(val, $(evt.target).prop('checked'));
            });
            if (checked){
              checkbox.prop('checked', true);
            }
          });
        }

        $(document).keydown(function(event){
          if (event.shiftKey && event.ctrlKey && event.altKey && event.keyCode == 65){
            ShinyServer.toggleNetworkSelector();
          }
        });

        var toggleNetworkSelector = exports.toggleNetworkSelector = function(){
          if (networkSelectorVisible) {
            networkSelectorVisible = false;
            networkSelector.hide();
          } else {
            // Lazily build the DOM for the selector the first time it is toggled.
            if (networkSelector === undefined) {
              buildNetworkSelector();
              $('body').append(networkSelector);
            }

            networkSelectorVisible = true;
            networkSelector.show();
          }
        }

        var enableAll = exports.enableAll = function(){
          $('input', networkOptions).each(function(index, val){
            $(val).prop('checked', true)
          });
          // Enable each protocol internally
          $.each(availableOptions, function(index, val){
            setOption(val, true);
          });
        }

        /**
         * Doesn't update the DOM, just updates our internal model.
         */
        var setOption = exports.setOption = function(option, enabled){
          $("#ss-net-prot-warning").html("Updated settings will be applied when you refresh your browser or load a new Shiny application.");
          if (enabled && $.inArray(option, whitelist) === -1){
            whitelist.push(option);
          }
          if (!enabled && $.inArray(option, whitelist >= 0)){
            // Don't remove if it's the last one, and recheck
            if (whitelist.length === 1){
              $("#ss-net-prot-warning").html("You must leave at least one method selected.");
              $("#ss-net-opt-" + option).prop('checked', true);
            } else{
              whitelist.splice($.inArray(option, whitelist), 1);  
            }
          }
          store["shiny.whitelist"] = JSON.stringify(whitelist);
        }

        var conn = new SockJS(sockjsUrl,
          null,{protocols_whitelist: whitelist});

        exports.multiplexer = new MultiplexClient(conn);
        exports.multiplexer.onclose.push(function() {
          // Stop session-alive refreshing if the SockJS connection closes.
          clearInterval(extendSessionInterval);
        });

        Shiny.createSocket = function() {
          return exports.multiplexer.open("");
        };

        Shiny.oncustommessage = function(message) {
          if (message.license) onLicense(message.license);

          if (typeof message === "string") alert(message); // Legacy format
          if (message.alert) alert(message.alert);
          if (message.console && console.log) console.log(message.console);
        };
      })();
    }
  });

  function debug(msg) {
    if (window.console && exports.debugging){
      console.log(new Date() + ": " + msg);
    }
  }

  function log(msg) {
    if (window.console){
      console.log(new Date() + ": " + msg);
    }
  }

  // MultiplexClient sits on top of a SockJS connection and lets the caller
  // open logical SockJS connections (channels). The SockJS connection is
  // closed when all of the channels close. This means you can't start with
  // zero channels, open a channel, close that channel, and then open
  // another channel.
  function MultiplexClient(conn) {
    // The underlying SockJS connection. At this point it is not likely to
    // be opened yet.
    this._conn = conn;
    // A table of all active channels.
    // Key: id, value: MultiplexClientChannel
    this._channels = {};
    this._channelCount = 0;
    // ID to use for the next channel that is opened
    this._nextId = 0;
    // Channels that need to be opened when the SockJS connection's open
    // event is received
    this._pendingChannels = [];
    // A list of functions that fire when our connection goes away.
    this.onclose = []

    var self = this;
    this._conn.onopen = function() {
      log("Connection opened. " + window.location.href);
      var channel;
      while ((channel = self._pendingChannels.shift())) {
        // Be sure to check readyState so we don't open connections for
        // channels that were closed before they finished opening
        if (channel.readyState === 0) {
          channel._open();
        } else {
          debug("NOT opening channel " + channel.id);
        }
      }
    };
    this._conn.onclose = function(e) {
      log("Connection closed. Info: " + JSON.stringify(e));
      debug("SockJS connection closed");
      // If the SockJS connection is terminated from the other end (or due
      // to loss of connectivity or whatever) then we can notify all the
      // active channels that they are closed too.
      for (var key in self._channels) {
        if (self._channels.hasOwnProperty(key)) {
          self._channels[key]._destroy();
        }
      }
      for (var i = 0; i < self.onclose.length; i++) {
        self.onclose[i]();
      }
    };
    this._conn.onmessage = function(e) {
      var msg = parseMultiplexData(e.data);
      if (!msg) {
        log("Invalid multiplex packet received from server");
        self._conn.close();
        return;
      }
      var id = msg.id;
      var method = msg.method;
      var payload = msg.payload;
      var channel = self._channels[id];
      if (!channel) {
        log("Multiplex channel " + id + " not found");
        return;
      }
      if (method === "c") {
        // If we're closing, we want to close everything, not just a subapp.
        // So don't send to a single channel.
        self._conn.close();
      } else if (method === "m") {
        channel.onmessage({data: payload});
      }
    };
  }
  MultiplexClient.prototype.open = function(url) {
    var channel = new MultiplexClientChannel(this, this._nextId++ + "",
                                             this._conn, url);
    this._channels[channel.id] = channel;
    this._channelCount++;

    switch (this._conn.readyState) {
      case 0:
        this._pendingChannels.push(channel);
        break;
      case 1:
        setTimeout(function() {
          channel._open();
        }, 0);
        break;
      default:
        setTimeout(function() {
          channel.close();
        }, 0);
        break;
    }
    return channel;
  };
  MultiplexClient.prototype.removeChannel = function(id) {
    delete this._channels[id];
    this._channelCount--;
    debug("Removed channel " + id + ", " + this._channelCount + " left");
    if (this._channelCount === 0 && this._conn.readyState < 2) {
      debug("Closing SockJS connection since no channels are left");
      this._conn.close();
    }
  };

  function MultiplexClientChannel(owner, id, conn, url) {
    this._owner = owner;
    this.id = id;
    this.conn = conn;
    this.url = url;
    this.readyState = 0;
    this.onopen = function() {};
    this.onclose = function() {};
    this.onmessage = function() {};
  }
  MultiplexClientChannel.prototype._open = function(parentURL) {
    debug("Open channel " + this.id);
    this.readyState = 1;

    //var relURL = getRelativePath(parentURL, this.url)
    
    this.conn.send(formatOpenEvent(this.id, this.url));
    this.onopen();
  };
  MultiplexClientChannel.prototype.send = function(data) {
    if (this.readyState === 0)
      throw new Error("Invalid state: can't send when readyState is 0");
    if (this.readyState === 1)
      this.conn.send(formatMessage(this.id, data));
  };
  MultiplexClientChannel.prototype.close = function(code, reason) {
    if (this.readyState >= 2)
      return;
    debug("Close channel " + this.id);
    if (this.conn.readyState === 1) {
      // Is the underlying connection open? Send a close message.
      this.conn.send(formatCloseEvent(this.id, code, reason));
    }
    this._destroy(code, reason);
  };
  // Internal version of close that doesn't notify the server
  MultiplexClientChannel.prototype._destroy = function(code, reason) {
    var self = this;
    // If we haven't already, invoke onclose handler.
    if (this.readyState !== 3) {
      this.readyState = 3;
      debug("Channel " + this.id + " is closed");
      setTimeout(function() {
        self._owner.removeChannel(self.id);
        self.onclose();
      }, 0);
    }
  }

  function formatMessage(id, message) {
    return id + '|m|' + message;
  }
  function formatOpenEvent(id, url) {
    return id + '|o|' + url;
  }
  function formatCloseEvent(id, code, reason) {
    return id + '|c|' + JSON.stringify({code: code, reason: reason});
  }
  function parseMultiplexData(msg) {
    try {
      var m = /^(\d+)\|(m|o|c)\|([\s\S]*)$/m.exec(msg);
      if (!m)
        return null;
      msg = {
        id: m[1],
        method: m[2],
        payload: m[3]
      }

      switch (msg.method) {
        case 'm':
          break;
        case 'o':
          if (msg.payload.length === 0)
            return null;
          break;
        case 'c':
          try {
            msg.payload = JSON.parse(msg.payload);
          } catch(e) {
            return null;
          }
          break;
        default:
          return null;
      }

      return msg;

    } catch(e) {
      logger.debug('Error parsing multiplex data: ' + e);
      return null;
    }
  }
})(jQuery);
