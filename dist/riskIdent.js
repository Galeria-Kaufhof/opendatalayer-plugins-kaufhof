'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _pixelHelper = require('./../../pixelHelper');

var pixelHelper = babelHelpers.interopRequireWildcard(_pixelHelper);


var logger = new _logger2.default('ba/lib/dal/aff/riskIdent');

/**
 * Device Ident DAL plugin
 *
 * @module   ba.lib.dal.aff.riskIdent
 * @class    RiskIdent
 * @implements  IDALService
 */

var RiskIdent = function RiskIdent(dal, data, config) {
  babelHelpers.classCallCheck(this, RiskIdent);

  logger.log('initialize');

  if (data.page.type !== 'checkout-confirmation') {
    return;
  }

  // setup DI values
  var diSite = config.diSite;
  var token = data.order.id;
  _window2.default.di = {
    t: token,
    v: diSite,
    l: 'Checkout'
  };

  pixelHelper.addScript('//www.jsctool.com/' + diSite + '/di.js');
  pixelHelper.addHTML('BODY', '<object type="application/x-shockwave-flash" data="//www.jsctool.com/' + diSite + '/c.swf" width="0" height="0"><param name="movie" value="//www.jsctool.com/' + diSite + '/c.swf" /><param name="flashvars" value="t=' + token + '&v=' + diSite + '"/></object>');
  pixelHelper.addHTML('BODY', '<link rel="stylesheet" type="text/css" media="jsctool" href="//media1.galeria-kaufhof.de/di.css?t=' + token + '&sd=1&v=' + diSite + '&l=Checkout">');
};

exports.default = RiskIdent;