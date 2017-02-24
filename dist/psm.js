'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _A3320_tracking = require('ba/vendor/A3320_tracking');

var _A3320_tracking2 = babelHelpers.interopRequireDefault(_A3320_tracking);

var logger = new _logger2.default('ba/lib/dal/bt/psm');

/**
 * PSM DAL plugin
 *
 * @module   ba.lib.dal.bt.psm
 * @class    PSM
 * @implements  IDALService
 */

var PSM = function PSM(dal, data, config) {
  babelHelpers.classCallCheck(this, PSM);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    _A3320_tracking2.default.advertiserId = config.advertiserId; // 643
    _A3320_tracking2.default.advertiserRestricted = false; // false

    var properties = {
      billing_advid: config.advertiserId, // 643 do not change this line
      billing_orderid: data.order.id, // this id must be unique otherwise we will count the conversion only once
      billing_address: 'NULL', // if needed
      billing_customerid: 'NULL', // if needed
      billing_sum: data.order.priceData.net,
      ec_Event: data.order.products.map(function (p) {
        return ['buy', p.ean, p.name, p.priceData.net, _window2.default.encodeURIComponent(p.category), p.quantity, 'NULL', 'NULL', 'NULL'];
      })
    };

    _A3320_tracking2.default.trackEvent(properties);
  }
};

exports.default = PSM;