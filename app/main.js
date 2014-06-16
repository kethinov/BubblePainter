var fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    css = require('css'),
    cssFile = '/System/Library/Messages/PlugIns/Balloons.transcriptstyle/Contents/Resources/balloons-modern.css',
    gui = require('nw.gui'),
    bubblepainter = gui.Window.get(),
    configFile,
    parsedCss,

    // imitate Express 4 API
    res = {
      render: function(template, model) {
        if (!teddy.compiledTemplates[template]) {
          teddy.compile(document.getElementById(template).innerHTML, template);
        }
        document.getElementsByTagName('main')[0].innerHTML = teddy.render(template + '.html', model);
        secureExternalLinks();
      },
      redirect: function(route) {
        page(route);
      }
    },
    app = {
      route: function(route) {
        return {
          get: function(callback) {
            page(route, callback);
          },
          post: function(callback) {
            page(route, callback);
          }
        }
      }
    };

// make res global for express imitation purposes
global.res = res;


/*
 * utility methods
 */

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function checkYourPrivilege(req, res, callback) {
  fs.readFile(cssFile, 'utf8', function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        res.render('fileError', {msg: 'Could not locate Messages.app preference files'});
      }
      else {
        res.render('passPrompt', {});
      }
    }
    else {
      callback(req, res);
    }
  });
}

function getDefaultColors(req, res, callback) {
  fs.readFile(cssFile, 'utf8', function(err, data) {
    var i,
        rules,
        rule,
        d,
        declarations,
        prop,
        sentRgb,
        receivedRgb,
        sentHex,
        receivedHex;

    if (err) {
      res.render('fileError', {msg: 'Could not locate Messages.app preference files'});
    }
    else {
      if (data.indexOf('/* begin Bubble Painter code */') > -1) {
        req.altered = true;
      }
      callback(req, res, function() {

        if (localStorage.getItem('senttop')) {
          document.getElementById('senttop').value = localStorage.getItem('senttop');
          document.getElementById('sentbottom').value = localStorage.getItem('sentbottom');
          document.getElementById('received').value = localStorage.getItem('received');
          document.getElementById('sentText').value = localStorage.getItem('sentText');
          document.getElementById('receivedText').value = localStorage.getItem('receivedText');
        }
        else {

          configFile = data;
          parsedCss = css.parse(configFile);
          rules = parsedCss.stylesheet.rules;
          for (i in rules) {
            rule = rules[i];
            if (rule.selectors == '[from-me="yes"][emote="no"] messagetext') {
              declarations = rule.declarations;
              for (d in declarations) {
                prop = declarations[d];
                if (prop.property == 'background-image' && prop.value.indexOf('!important') == -1) {
                  sentRgb = prop.value.split('),')[0].split('rgb(')[1].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  document.getElementById('senttop').value = sentHex;
                  sentRgb = prop.value.split(', rgb(')[1].split('));')[0].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  document.getElementById('sentbottom').value = sentHex;
                  break;
                }
              }
            }
            else if (Array.isArray(rule.selectors) && rule.selectors.length === 3) {
              if (
                  rule.selectors[0] == '[selected="yes"][item-type="attachment"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext' &&
                  rule.selectors[1] == '[selected="yes"][item-type="audio-message"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext' &&
                  rule.selectors[2] == '[selected="yes"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext'
                 ) {
                declarations = rule.declarations;
                for (d in declarations) {
                  prop = declarations[d];
                  if (prop.property == 'background-color' && prop.value.indexOf('!important') == -1) {
                    receivedRgb = prop.value.split(');')[0].split('rgb(')[1].split(',');
                    receivedHex = rgbToHex(parseInt(receivedRgb[0]), parseInt(receivedRgb[1]), parseInt(receivedRgb[2]));
                    document.getElementById('received').value = receivedHex;
                    break;
                  }
                }
              }
            }
          }
        }
      });
    }
  });
}

function removeBubblePainterLines(req, res, callback) {
  fs.readFile(cssFile, 'utf8', function(err, data) {
    var i,
        before,
        after,
        code;

    if (err) {
      res.render('fileError', {msg: 'Could not locate Messages.app preference files'});
    }
    else {
      before = data.split('/* begin Bubble Painter code */')[0];
      after = data.split('/* end Bubble Painter code */')[1];
      code = before;
      if (!before) {
        res.render('fileError', {msg: 'Could not parse Messages.app preference files'});
        return;
      }
      if (after) {
        code += after;
      }
      fs.writeFile(cssFile, code, 'utf8', function(err, data) {
        req.writeError = err;
        callback(req, res);
      });
    }
  });
}

// suppress remaining links and open externals in new window
function secureExternalLinks() {
  var links = document.getElementsByTagName('a');
  Object.keys(links).forEach(function(link) {
    var link = links[link];
    if (link.getAttribute) {
      link.addEventListener('mousedown', function(e) {
        e.preventDefault();
      }, false);
      if (link.getAttribute('rel') === 'external') {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          gui.Shell.openExternal(e.target.href);
        }, false);
      };
    }
  });
}

/*
 * define routes
 */

// first page
app.route('/').get(function(req, res) {
  var res = global && global.res || res;
  checkYourPrivilege(req, res, function(req, res) {
    getDefaultColors(req, res, function(req, res, applyColors) {
      var model = {};
      if (req.altered) {
        model.altered = true;
      }
      res.render('index', model);
      applyColors();
    });
  });
});

// handler for when you change the colors
app.route('/password').post(function(req, res) {
  var res = global && global.res || res;

  if (typeof req.body.submit != 'undefined') {
    exec('echo '+req.body.password+' | sudo -S chmod 777 '+cssFile, function (error, stdout, stderr) {
      if (error !== null) {
        res.render('passPrompt', {msg: 'Please enter a valid password.'});
      }
      else {
        res.redirect('/');
      }
    });
  }
});

// handler for when you change the colors
app.route('/change').post(function(req, res) {
  var res = global && global.res || res;

  if (typeof req.body.change != 'undefined') {
    // change button was pressed
    removeBubblePainterLines(req, res, function(req, res) {
      var code = "\n";
      if (req.err) {
        res.render('fileError', {msg: 'Could not write to Messages.app preference files'});
      }
      else {
        code += '/* begin Bubble Painter code */' + "\n";

        // sent gradient
        code += '[from-me="yes"][emote="no"] messagetext {' + "\n";
        code += 'background-image:-webkit-linear-gradient('+req.body.senttop+', '+req.body.sentbottom+') !important;' + "\n";
        code += '}' + "\n";

        // received background color
        code += '[item-type="attachment"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext,' + "\n";
        code += '[item-type="audio-message"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext,' + "\n";
        code += '[from-me="no"][emote="no"][typing-indicator="no"] messagetext {' + "\n";
        code += 'background-color:'+req.body.received+' !important;' + "\n";
        code += '}' + "\n";

        // sent text
        code += '[item-type="text"] [emote="no"][from-me="yes"] span {' + "\n";
        code += 'color:'+req.body.sentText+' !important;' + "\n";
        code += '}' + "\n";

        // sent links
        code += '[from-me="yes"] a:link {' + "\n";
        code += 'color:'+req.body.sentText+' !important;' + "\n";
        code += '}' + "\n";

        // received text
        code += '[item-type="text"] [emote="no"][from-me="no"] span {' + "\n";
        code += 'color:'+req.body.receivedText+' !important;' + "\n";
        code += '}' + "\n";

        // sent links
        code += '[from-me="no"] a:link {' + "\n";
        code += 'color:'+req.body.receivedText+' !important;' + "\n";
        code += '}' + "\n";

        code += '/* end Bubble Painter code */' + "\n";
        fs.appendFile(cssFile, code, 'utf8', function(err, data) {
          if (err) {
            res.render('fileError', {msg: 'Could not write to Messages.app preference files'});
          }
          else {
            localStorage.setItem('senttop', req.body.senttop);
            localStorage.setItem('sentbottom', req.body.sentbottom);
            localStorage.setItem('received', req.body.received);
            localStorage.setItem('sentText', req.body.sentText);
            localStorage.setItem('receivedText', req.body.receivedText);
            res.redirect('/');
            exec('killall Messages && open /Applications/Messages.app', function (error, stdout, stderr) {
              // ignore output
            });
          }
        });
      }
    });
  }

  if (typeof req.body.reset != 'undefined') {
    // reset button was pressed
    removeBubblePainterLines(req, res, function(req, res) {
      if (req.err) {
        res.render('fileError', {msg: 'Could not write to Messages.app preference files'});
      }
      else {
        localStorage.removeItem('senttop');
        localStorage.removeItem('sentbottom');
        localStorage.removeItem('received');
        localStorage.removeItem('sentText');
        localStorage.removeItem('receivedText');
        res.redirect('/');
        exec('killall Messages && open /Applications/Messages.app', function (error, stdout, stderr) {
          // ignore output
        });
      }
    });
  }
});

// activate router
page();

/*
 * initialize the app
 */

// render first page
res.redirect('/');

// handles cmd+q on OSX
bubblepainter.on('close', function() {
  gui.App.quit();
});
