'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /* eslint-disable no-underscore-dangle */


var logger = new _opendatalayer.Logger('shoppingcom');

/**
 * Shopping.com ODL plugin
 */

var ShoppingCOM = function ShoppingCOM(odl, data, config) {
  _classCallCheck(this, ShoppingCOM);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var _roi = _opendatalayer.window._roi || [];

    _roi.push(['_setMerchantId', config.merchantId]);
    _roi.push(['_setOrderAmount', data.order.priceData.total]);

    data.order.products.forEach(function (p) {
      _roi.push(['_addItem', p.aonr, // Händler-Artikelnr.
      p.name, // Produktname
      '', // Kategorie-ID
      p.category, // Kategorie-Name
      p.priceData.total, // Einzelpreis (inkl. MwSt.)
      p.quantity]);
    });
    _roi.push(['_trackTrans']);
    _opendatalayer.window._roi = _roi;

    _opendatalayer.helpers.addScript('//stat.dealtime.com/ROI/ROI2.js');
  }
};

exports.default = ShoppingCOM;