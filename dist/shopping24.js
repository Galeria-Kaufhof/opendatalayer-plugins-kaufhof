'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('shopping24');

/**
 * Shopping24 ODL plugin
 */

var Shopping24 = function Shopping24(odl, data, config) {
  babelHelpers.classCallCheck(this, Shopping24);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    _opendatalayer.helpers.addImage('https://tracking.s24.com/TrackOrder?shopId=' + config.hashId + '&netRevenue=' + data.order.priceData.net + '&shipping=&products=' + data.order.products.map(function (p) {
      return p.aonr;
    }).join(',') + '&lineItems=' + data.order.products.length + '&orderNumber=' + data.order.id);
  }
};

exports.default = Shopping24;