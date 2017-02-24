'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jquery = require('jquery');

var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _pixelHelper = require('../../pixelHelper');

var pixelHelper = babelHelpers.interopRequireWildcard(_pixelHelper);


var logger = new _logger2.default('ba/lib/dal/bt/affilinet');

/**
 * PVN pixel DAL plugin
 *
 * @module   ba.lib.dal.bt.pvn
 * @class    PVN
 * @implements  IDALService
 */

var PVN = function PVN(dal, data, config) {
  babelHelpers.classCallCheck(this, PVN);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    // order pixel
    pixelHelper.addScript('https://partnerprogramm.galeria-kaufhof.de/trck/etrack/?campaign_id=1&trigger_id=1&token=' + data.order.id + '&descr=&currency=' + config.currency + '&turnover=' + data.order.priceData.net + '&vc=' + data.order.couponCode + '&t=js');

    // START EASY AFFILIATE
    var orderId = data.order.id;
    _jquery2.default.post('https://partnerprogramm.galeria-kaufhof.de/basket_tracking.php', {
      basket: data.order.products.map(function (p) {
        return {
          bestid: orderId,
          productid: p.ean,
          productname: p.name,
          amount: p.quantity,
          price: p.priceData.net,
          category: p.abteilungNummer
        };
      })
    });
  }
};

exports.default = PVN;