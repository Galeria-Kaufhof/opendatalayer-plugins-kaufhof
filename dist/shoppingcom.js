'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _pixelHelper = require('../../pixelHelper');

var _pixelHelper2 = babelHelpers.interopRequireDefault(_pixelHelper);

var logger = new _logger2.default('ba/lib/dal/bt/shoppingcom');

/**
 * Shopping.com DAL plugin
 *
 * @module   ba.lib.dal.bt.shoppingcom
 * @class    ShoppingCOM
 * @implements  IDALService
 */
/* eslint-disable no-underscore-dangle */

var ShoppingCOM = function ShoppingCOM(dal, data, config) {
  babelHelpers.classCallCheck(this, ShoppingCOM);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var _roi = _window2.default._roi || [];

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
    _window2.default._roi = _roi;

    _pixelHelper2.default.addScript('//stat.dealtime.com/ROI/ROI2.js');
  }
};

exports.default = ShoppingCOM;