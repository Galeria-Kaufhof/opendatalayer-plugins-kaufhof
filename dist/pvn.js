'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('PVN');

/**
 * PVN pixel ODL plugin
 */

var PVN = function PVN(odl, data, config) {
  _classCallCheck(this, PVN);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    // order pixel
    _opendatalayer.helpers.addScript('https://partnerprogramm.galeria-kaufhof.de/trck/etrack/?campaign_id=1&trigger_id=1&token=' + data.order.id + '&descr=&currency=' + config.currency + '&turnover=' + data.order.priceData.net + '&vc=' + data.order.couponCode + '&t=js');

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