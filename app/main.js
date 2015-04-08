var fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    css = require('css'),
    cssFile = '/System/Library/Messages/PlugIns/Balloons.transcriptstyle/Contents/Resources/balloons-modern.css',
    gui = require('nw.gui'),
    bubblepainter = gui.Window.get(),
    nativeMenuBar = new gui.Menu({type: 'menubar'}),
    configFile,
    parsedCss,
    needPassword = false;

// activate express-mapper plugin
pageExpressMapper({
  renderMethod: function(template, model) {
    if (!teddy.compiledTemplates[template]) {
      teddy.compile(document.getElementById(template).innerHTML, template);
    }
    document.getElementsByTagName('main')[0].innerHTML = teddy.render(template + '.html', model);
  },
  expressAppName: 'app'
});

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
  fs.open(cssFile, 'r+', function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        res.render('fileError', {msg: 'Could not locate Messages.app preference files'});
      }
      else {
        fs.open(cssFile, 'r', function(err, data) {
          needPassword = true;
          callback(req, res);
        });
      }
    }
    else {
      callback(req, res);
    }
  });
}

function setColors(skipInputs) {
  var previewOverrides = document.getElementById('previewOverrides'),
      previewOverrideCss = '';

  if (!skipInputs) {
    document.getElementById('sameforboth').checked = localStorage.getItem('sameforboth') === 'true' ? true : false;
    
    document.getElementById('msgwidth').value = localStorage.getItem('msgwidth');

    document.getElementById('received').value = localStorage.getItem('received');
    document.getElementById('receivedText').value = localStorage.getItem('receivedText');

    document.getElementById('senttop').value = localStorage.getItem('senttop');
    document.getElementById('sentbottom').value = localStorage.getItem('sentbottom');
    document.getElementById('sentText').value = localStorage.getItem('sentText');

    document.getElementById('isenttop').value = localStorage.getItem('isenttop');
    document.getElementById('isentbottom').value = localStorage.getItem('isentbottom');
    document.getElementById('isentText').value = localStorage.getItem('isentText');
  }

  if (previewOverrides) {
    previewOverrides.parentNode.removeChild(previewOverrides);
  }
  previewOverrideCss += '<style id="previewOverrides">';

  previewOverrideCss += '.received-preview div,.sent-preview div,.isent-preview div {width: '+localStorage.getItem('msgwidth')+'% !important;}';

  previewOverrideCss += '.from-them{color:'+localStorage.getItem('receivedText')+' !important;background:'+localStorage.getItem('received')+' !important;}';
  previewOverrideCss += '.from-them:before{border-left:18px solid '+localStorage.getItem('received')+' !important;}';

  previewOverrideCss += '.isent-preview .from-me{color:'+localStorage.getItem('isentText')+' !important;background:'+localStorage.getItem('isentbottom')+' !important;}';
  previewOverrideCss += '.isent-preview .from-me:before{border-right:18px solid '+localStorage.getItem('isentbottom')+' !important;}';

  if (document.getElementById('sameforboth').checked) {
    document.getElementById('sentcolors').className = 'disabled';
    document.getElementById('senttop').setAttribute('disabled', 'disabled');
    document.getElementById('sentbottom').setAttribute('disabled', 'disabled');
    document.getElementById('sentText').setAttribute('disabled', 'disabled');

    previewOverrideCss += '.sent-preview .from-me{color:'+localStorage.getItem('isentText')+' !important;background:'+localStorage.getItem('isentbottom')+' !important;}';
    previewOverrideCss += '.sent-preview .from-me:before{border-right:18px solid '+localStorage.getItem('isentbottom')+' !important;}';
  }
  else {
    document.getElementById('sentcolors').className = '';
    document.getElementById('senttop').removeAttribute('disabled');
    document.getElementById('sentbottom').removeAttribute('disabled');
    document.getElementById('sentText').removeAttribute('disabled');

    previewOverrideCss += '.sent-preview .from-me{color:'+localStorage.getItem('sentText')+' !important;background:'+localStorage.getItem('sentbottom')+' !important;}';
    previewOverrideCss += '.sent-preview .from-me:before{border-right:18px solid '+localStorage.getItem('sentbottom')+' !important;}';
  }
  
  previewOverrideCss += '</style>';
  document.body.insertAdjacentHTML('beforeend', previewOverrideCss);
  
  document.getElementById('sameforboth').onclick = setColors;
  document.getElementById('senttop').onchange = onColorChange;
  document.getElementById('sentbottom').onchange = onColorChange;
  document.getElementById('sentText').onchange = onColorChange;
  document.getElementById('isenttop').onchange = onColorChange;
  document.getElementById('isentbottom').onchange = onColorChange;
  document.getElementById('isentText').onchange = onColorChange;
  document.getElementById('received').onchange = onColorChange;
  document.getElementById('receivedText').onchange = onColorChange;
  document.getElementById('msgwidth').onchange = onColorChange;
}

function onColorChange(e) {
  localStorage.setItem(e.target.id, e.target.value);
  setColors(true);
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
        receivedHex,
        msgwidth;

    if (err) {
      res.render('fileError', {msg: 'Could not locate Messages.app preference files'});
    }
    else {
      if (data.indexOf('/* begin Bubble Painter code */') > -1) {
        req.altered = true;
      }
      callback(req, res, function() {        
        if (localStorage.getItem('isenttop')) {
          setColors();
        }
        else {

          configFile = data;
          parsedCss = css.parse(configFile);
          rules = parsedCss.stylesheet.rules;
          for (i in rules) {
            rule = rules[i];
            if (rule.selectors == '[typing-indicator="no"][emote="no"] messagetext') {
              declarations = rule.declarations;
              for (d in declarations) {
                prop = declarations[d];
                if (prop.property == 'max-width' && prop.value.indexOf('!important') == -1) {
                  msgwidth = prop.value.split('%')[0];
                  localStorage.setItem('msgwidth', msgwidth);
                  break;
                }
              }
            }
            else if (rule.selectors == '[from-me="yes"][emote="no"] messagetext') {
              declarations = rule.declarations;
              for (d in declarations) {
                prop = declarations[d];
                if (prop.property == 'background-image' && prop.value.indexOf('!important') == -1) {
                  sentRgb = prop.value.split('),')[0].split('rgb(')[1].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  localStorage.setItem('senttop', sentHex);
                  sentRgb = prop.value.split(', rgb(')[1].split('));')[0].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  localStorage.setItem('sentbottom', sentHex);
                  break;
                }
              }
            }
            else if (rule.selectors == '[from-me="yes"][emote="no"][service="imessage"][typing-indicator="no"] messagetext') {
              declarations = rule.declarations;
              for (d in declarations) {
                prop = declarations[d];
                if (prop.property == 'background-image' && prop.value.indexOf('!important') == -1) {
                  sentRgb = prop.value.split('),')[0].split('rgb(')[1].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  localStorage.setItem('isenttop', sentHex);
                  sentRgb = prop.value.split(', rgb(')[1].split('));')[0].split(',');
                  sentHex = rgbToHex(parseInt(sentRgb[0]), parseInt(sentRgb[1]), parseInt(sentRgb[2]));
                  localStorage.setItem('isentbottom', sentHex);
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
                    localStorage.setItem('received', receivedHex);
                    break;
                  }
                }
              }
            }
          }
          localStorage.setItem('sentText', '#ffffff');
          localStorage.setItem('isentText', '#ffffff');
          localStorage.setItem('receivedText', '#000000');
          setColors();
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

/*
 * define routes
 */

// first page
app.route('/').get(function(req, res) {
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
app.route('/change').post(function(req, res) {
  if (needPassword) {
    exec("osascript -e \"do shell script \\\"chmod 777 "+cssFile+"\\\" with administrator privileges\"", function(error, stdout, stderr) {
      if (!error && !stderr) {
        needPassword = false;
        change(req, res);
      }
      else {
        // do nothing
      }
    });
  }
  else {
    change(req, res);
  }
  
  function change(req, res) {
    if (typeof req.body.change != 'undefined') {
      // change button was pressed
      removeBubblePainterLines(req, res, function(req, res) {
        var code = "\n";
        if (req.err) {
          res.render('fileError', {msg: 'Could not write to Messages.app preference files'});
        }
        else {
          localStorage.setItem('sameforboth', req.body.sameforboth);

          code += '/* begin Bubble Painter code */' + "\n";

          // message width
          code += '[typing-indicator="no"][emote="no"] messagetext {max-width: '+(parseInt(req.body.msgwidth) + 3)+'% !important;}' + "\n";
          
          // sent gradient (iMessage)
          code += '[from-me="yes"][emote="no"][service="imessage"][typing-indicator="no"] messagetext {' + "\n";
          code += 'background-image:-webkit-linear-gradient('+req.body.isenttop+', '+req.body.isentbottom+') !important;' + "\n";
          code += '}' + "\n";

          // sent when gradients-disabled is flagged (iMessage)
          code += '[disable-gradients="yes"] [from-me="yes"][emote="no"][service="imessage"][typing-indicator="no"] messagetext {' + "\n";
          code += 'background-color:rgb('+req.body.isentbottom+') !important;' + "\n";
          code += '}' + "\n";

          // sent text (iMessage)
          code += '[item-type="text"] [emote="no"][from-me="yes"][service="imessage"][typing-indicator="no"] span {' + "\n";
          code += 'color:'+req.body.isentText+' !important;' + "\n";
          code += '}' + "\n";

          // sent links (iMessage)
          code += '[from-me="yes"][emote="no"][service="imessage"][typing-indicator="no"] a:link {' + "\n";
          code += 'color:'+req.body.isentText+' !important;' + "\n";
          code += '}' + "\n";
          
          if (!req.body.sameforboth) {
            // sent gradient ("green bubble friends")
            code += '[from-me="yes"][emote="no"] messagetext {' + "\n";
            code += 'background-image:-webkit-linear-gradient('+req.body.senttop+', '+req.body.sentbottom+') !important;' + "\n";
            code += '}' + "\n";

            // sent when gradients-disabled is flagged ("green bubble friends")
            code += '[disable-gradients="yes"] [from-me="yes"][emote="no"] messagetext {' + "\n";
            code += 'background-color:rgb('+req.body.sentbottom+') !important;' + "\n";
            code += '}' + "\n";

            // sent text (global default)
            code += '[item-type="text"] [emote="no"][from-me="yes"] span {' + "\n";
            code += 'color:'+req.body.sentText+' !important;' + "\n";
            code += '}' + "\n";

            // sent links (global default)
            code += '[from-me="yes"] a:link {' + "\n";
            code += 'color:'+req.body.sentText+' !important;' + "\n";
            code += '}' + "\n";
          }
          else {

            // sent gradient ("green bubble friends")
            code += '[from-me="yes"][emote="no"] messagetext {' + "\n";
            code += 'background-image:-webkit-linear-gradient('+req.body.isenttop+', '+req.body.isentbottom+') !important;' + "\n";
            code += '}' + "\n";

            // sent when gradients-disabled is flagged ("green bubble friends")
            code += '[disable-gradients="yes"] [from-me="yes"][emote="no"] messagetext {' + "\n";
            code += 'background-color:rgb('+req.body.isentbottom+') !important;' + "\n";
            code += '}' + "\n";

            // sent text (global default)
            code += '[item-type="text"] [emote="no"][from-me="yes"] span {' + "\n";
            code += 'color:'+req.body.isentText+' !important;' + "\n";
            code += '}' + "\n";

            // sent links (global default)
            code += '[from-me="yes"] a:link {' + "\n";
            code += 'color:'+req.body.isentText+' !important;' + "\n";
            code += '}' + "\n";
          }

          // received background color
          code += '[item-type="attachment"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext,' + "\n";
          code += '[item-type="audio-message"] [from-me="no"][emote="no"][typing-indicator="no"] messagetext,' + "\n";
          code += '[from-me="no"][emote="no"][typing-indicator="no"] messagetext {' + "\n";
          code += 'background-color:'+req.body.received+' !important;' + "\n";
          code += '}' + "\n";

          // received text
          code += '[item-type="text"] [emote="no"][from-me="no"] span {' + "\n";
          code += 'color:'+req.body.receivedText+' !important;' + "\n";
          code += '}' + "\n";

          // received links
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
              exec('killall Messages && open /Applications/Messages.app', function(error, stdout, stderr) {
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
          localStorage.removeItem('sentText');
          localStorage.removeItem('isenttop');
          localStorage.removeItem('isentbottom');
          localStorage.removeItem('isentText');
          localStorage.removeItem('received');
          localStorage.removeItem('receivedText');
          localStorage.setItem('sameforboth', 'false');
          exec("osascript -e \"do shell script \\\"chmod 755 "+cssFile+"\\\" with administrator privileges\"", function(error, stdout, stderr) {
            needPassword = true;
            res.redirect('/');
            // ignore output
            exec('killall Messages && open /Applications/Messages.app', function(error, stdout, stderr) {
              // ignore output
            });
          });
        }
      });
    }
  }
});

// activate router
page();

// activate page.js body-parser plugin
pageBodyParser();

/*
 * initialize the app
 */

// render first page
page('/');

// render native mac menus
nativeMenuBar.createMacBuiltin('Bubble Painter', {
  hideEdit: true
});
bubblepainter.menu = nativeMenuBar;

// handles cmd+q on OSX
bubblepainter.on('close', function() {
  gui.App.quit();
});

// hide window until fully loaded
window.addEventListener('load', function() {
  gui.Window.get().show();
  gui.Window.get().focus();
});