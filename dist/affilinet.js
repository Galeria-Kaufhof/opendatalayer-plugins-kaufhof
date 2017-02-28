'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('affilinet');

/**
 * Affili.net ODL plugin
 */

var Affilinet = function Affilinet(odl, data, config) {
  _classCallCheck(this, Affilinet);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var articles = '';
    for (var i = 0; i < data.order.products.length; i++) {
      var p = data.order.products[i];
      articles += 'ArticleNb%3D' + escape(p.ean) + '%26';
      articles += 'ProductName%3D' + escape(p.name) + '%26';
      articles += 'Category%3D' + escape(encodeURIComponent(p.abteilungNummer)) + '%26';
      articles += 'Quantity%3D' + escape(p.quantity) + '%26';
      articles += 'SinglePrice%3D' + escape(parseFloat(p.priceData.net).toFixed(2)) + '%26';
      articles += 'Brand%3D%26';
      articles += '%0D%0A'; // newline to separate articles
    }

    _opendatalayer.helpers.addImage('//partners.webmasterplan.com/registersale.asp?site=' + config.site + '&ref=&affmt=&affmn=&price=' + data.order.priceData.net + '&order=' + data.order.id + '&vcode=' + data.order.couponCode + '&basket=' + articles, 1, 1);
  }
};

exports.default = Affilinet;