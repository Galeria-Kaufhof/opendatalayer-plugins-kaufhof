'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Sovendus ODL plugin
 *
 * @module   ba.lib.odl
 * @class    Sovendus
 * @implements  IODLService
 */
var Sovendus = function Sovendus(odl, data, config) {
  _classCallCheck(this, Sovendus);

  if (data.page.type === 'checkout-confirmation') {
    // create target element in container on confirmation page
    _opendatalayer.helpers.addHTML('#or-page__confirmation__sovendus', '<div id="gutscheinconnection-container1" />');

    // configure Sovendus
    var gd = _opendatalayer.window._gconData || [];
    gd.length = 0;
    gd.push(['_shopId', config.shopId]);
    gd.push(['_bannerId', config.bannerId]);
    gd.push(['_sessionId', '']);
    gd.push(['_timestamp', new _opendatalayer.window.Date().getTime() / 1000]);
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
    _opendatalayer.window._gconData = gd;

    // build/add script include
    _opendatalayer.helpers.addScript('//api.gutscheinconnection.de/js/client.js');
  }
};

exports.default = Sovendus;