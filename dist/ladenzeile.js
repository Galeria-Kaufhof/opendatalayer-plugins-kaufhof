'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('ladenzeile');

/**
 * Ladenzeile ODL plugin.
 */

var Ladenzeile = function Ladenzeile(odl, data, config) {
  _classCallCheck(this, Ladenzeile);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    // Ladenzeile global object
    _opendatalayer.window.vmt_pi = {
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
    _opendatalayer.helpers.addScript('//www.ladenzeile.de/controller/visualMetaTrackingJs');
  }
};

exports.default = Ladenzeile;