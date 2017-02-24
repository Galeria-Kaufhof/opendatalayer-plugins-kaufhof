'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _pixelHelper = require('../../pixelHelper');

var _pixelHelper2 = babelHelpers.interopRequireDefault(_pixelHelper);

var logger = new _logger2.default('ba/lib/dal/bt/shopping24');

/**
 * Quantcast DAL plugin
 *
 * @module   ba.lib.dal.bt.shopping24
 * @class    Shopping24
 * @implements  IDALService
 */

var Shopping24 = function Shopping24(dal, data, config) {
  babelHelpers.classCallCheck(this, Shopping24);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    _pixelHelper2.default.addImage('https://tracking.s24.com/TrackOrder?shopId=' + config.hashId + '&netRevenue=' + data.order.priceData.net + '&shipping=&products=' + data.order.products.map(function (p) {
      return p.aonr;
    }).join(',') + '&lineItems=' + data.order.products.length + '&orderNumber=' + data.order.id);
  }
};

exports.default = Shopping24;