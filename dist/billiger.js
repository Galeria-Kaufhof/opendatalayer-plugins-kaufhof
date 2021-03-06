'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('billiger');

/**
 * Billiger.de ODL plugin
 */

var Billiger = function Billiger(odl, data, config) {
  _classCallCheck(this, Billiger);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var articles = '';
    for (var i = 0; i < data.order.products.length; i += 1) {
      var p = data.order.products[i];
      var num = i + 1;
      articles += '&aid_' + num + '=' + p.ean + '&name_' + num + '=' + encodeURIComponent(p.name) + '&cnt_' + num + '=' + p.quantity + '&val_' + num + '=' + p.priceData.net;
    }

    _opendatalayer.helpers.addImage('//billiger.de/sale?shop_id=' + config.shopId + '&oid=' + data.order.id + articles, 1, 1);
  }
};

exports.default = Billiger;