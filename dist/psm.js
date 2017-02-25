'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var _A3320_tracking = require('./../lib/A3320_tracking');

var _A3320_tracking2 = babelHelpers.interopRequireDefault(_A3320_tracking);

var logger = new _opendatalayer.Logger('psm');

/**
 * PSM ODL plugin
 */

var PSM = function PSM(odl, data, config) {
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
        return ['buy', p.ean, p.name, p.priceData.net, _opendatalayer.window.encodeURIComponent(p.category), p.quantity, 'NULL', 'NULL', 'NULL'];
      })
    };

    _A3320_tracking2.default.trackEvent(properties);
  }
};

exports.default = PSM;