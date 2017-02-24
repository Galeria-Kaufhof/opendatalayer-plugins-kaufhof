'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('opendatalayer-plugins-kaufhof/adnymics');

/**
 * Adnymics pixel ODL plugin
 */

var Adnymics = function Adnymics(odl, data, config) {
  babelHelpers.classCallCheck(this, Adnymics);

  logger.log('initialize');

  var _paq = _opendatalayer.window._paq || [];
  // pass bid as unique identifier for this specific user
  _paq.push(['setCustomVariable', 1, 'identity', data.identity.bid, 'page']);

  // pass product info (only on ADS or after checkout)
  if (data.page.type === 'productdetail') {
    _paq.push(['setCustomVariable', 2, 'productId', data.product.ean, 'page']);
  } else if (data.page.type === 'checkout-confirmation') {
    var o = data.order;
    for (var i in o.products) {
      var p = o.products[i];
      _paq.push(['addEcommerceItem', p.ean, p.name, p.abteilungName, p.priceData.total, p.quantity]);
    }
    _paq.push(['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, o.couponCode != null]);
  }

  // load script
  var url = '//s1.adnymics.com/';
  if (data.page.type !== 'checkout-confirmation') {
    _paq.push(['enableLinkTracking']);
  }
  _paq.push(['setTrackerUrl', url + 'piwik.php']);
  _paq.push(['setSiteId', config.siteId]);
  _paq.push(['trackPageView']);
  _opendatalayer.window._paq = _paq;
  _opendatalayer.helpers.addScript(url + 'piwik.js');
};

exports.default = Adnymics;