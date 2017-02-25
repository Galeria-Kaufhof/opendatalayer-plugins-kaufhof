'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('riskIdent');

/**
 * Device Ident ODL plugin.
 */

var RiskIdent = function RiskIdent(odl, data, config) {
  babelHelpers.classCallCheck(this, RiskIdent);

  logger.log('initialize');

  if (data.page.type !== 'checkout-confirmation') {
    return;
  }

  // setup DI values
  var diSite = config.diSite;
  var token = data.order.id;
  _opendatalayer.window.di = {
    t: token,
    v: diSite,
    l: 'Checkout'
  };

  _opendatalayer.helpers.addScript('//www.jsctool.com/' + diSite + '/di.js');
  _opendatalayer.helpers.addHTML('BODY', '<object type="application/x-shockwave-flash" data="//www.jsctool.com/' + diSite + '/c.swf" width="0" height="0"><param name="movie" value="//www.jsctool.com/' + diSite + '/c.swf" /><param name="flashvars" value="t=' + token + '&v=' + diSite + '"/></object>');
  _opendatalayer.helpers.addHTML('BODY', '<link rel="stylesheet" type="text/css" media="jsctool" href="//media1.galeria-kaufhof.de/di.css?t=' + token + '&sd=1&v=' + diSite + '&l=Checkout">');
};

exports.default = RiskIdent;