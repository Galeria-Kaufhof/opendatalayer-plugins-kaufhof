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


var logger = new _logger2.default('ba/lib/dal/aff/sovendus');

/**
 * Sovendus DAL plugin
 *
 * @module   ba.lib.dal
 * @class    Sovendus
 * @implements  IDALService
 */

var Sovendus = function Sovendus(dal, data, config) {
  babelHelpers.classCallCheck(this, Sovendus);

  if (data.page.type === 'checkout-confirmation') {
    // create target element in container on confirmation page
    pixelHelper.addHTML('#or-page__confirmation__sovendus', '<div id="gutscheinconnection-container1" />');

    // configure Sovendus
    var gd = _window2.default._gconData || [];
    gd.length = 0;
    gd.push(['_shopId', config.shopId]);
    gd.push(['_bannerId', config.bannerId]);
    gd.push(['_sessionId', '']);
    gd.push(['_timestamp', new _window2.default.Date().getTime() / 1000]);
    gd.push(['_customerSalutation', data.order.customer.salutation === 'MR' ? 'Herr' : 'Frau']);
    gd.push(['_customerFirstName', data.order.customer.firstName]);
    gd.push(['_customerLastName', data.order.customer.lastName]);
    gd.push(['_customerEmail', data.order.customer.email]);
    gd.push(['_orderId', data.order.id]);
    gd.push(['_orderValue', data.order.priceData.net]);
    gd.push(['_orderCurrency', config.currency]);
    gd.push(['_usedCouponCode', data.order.couponCode || '']);
    gd.push(['_checksum', '']);
    gd.push(['_htmlElementId', 'gutscheinconnection-container1']);
    _window2.default._gconData = gd;

    // build/add script include
    pixelHelper.addScript('//api.gutscheinconnection.de/js/client.js');
  }
};

exports.default = Sovendus;