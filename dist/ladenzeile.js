'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _pixelHelper = require('../../pixelHelper');

var pixelHelper = babelHelpers.interopRequireWildcard(_pixelHelper);


var logger = new _logger2.default('ba/lib/dal/bt/ladenzeile');

/**
 * Ladenzeile DAL plugin
 *
 * @module   ba.lib.dal.bt.ladenzeile
 * @class    Ladenzeile
 * @implements  IDALService
 */

var Ladenzeile = function Ladenzeile(dal, data, config) {
  babelHelpers.classCallCheck(this, Ladenzeile);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    // Ladenzeile global object
    _window2.default.vmt_pi = {
      trackingId: config.trackingId,
      type: 'confirmed',
      amount: data.order.priceData.total,
      skus: data.order.products.map(function (p) {
        return p.ean;
      }),
      prices: data.order.products.map(function (p) {
        return p.priceData.net;
      }),
      currency: config.currency };

    // add script
    pixelHelper.addScript('//www.ladenzeile.de/controller/visualMetaTrackingJs');
  }
};

exports.default = Ladenzeile;