'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('ba/lib/odl/aff/facebookWCA');

/**
 * facebook ODL plugin, intergating facebook remarketing pixel
 * See https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/product-audiences/v2.2
 */

var FacebookWCA = function () {
  function FacebookWCA(odl, data, config) {
    _classCallCheck(this, FacebookWCA);

    // load FB pixel and append it to DOM
    if (!_opendatalayer.window._fbq) {
      _opendatalayer.window._fbq = [];
    }
    var _fbq = _opendatalayer.window._fbq;

    if (!_fbq.loaded) {
      var fbds = _opendatalayer.window.document.createElement('script');
      fbds.src = '//connect.facebook.net/en_US/fbds.js';
      var head = _opendatalayer.window.document.getElementsByTagName('head')[0];
      head.appendChild(fbds);
      _fbq.loaded = true;
    }
    _fbq.push(['addPixelId', config.pixelId]);
    _fbq.push(['track', 'PixelInitialized', {}]);
    // track event depending on type
    switch (data.page.type) {
      case 'productdetail':
        {
          if (data.product != null) {
            this.trackProductEvent('ViewContent', data.product.ean);
          }
          break;
        }
      case 'checkout-confirmation':
        {
          var ids = [];
          for (var i = 0; i < data.order.products.length; i++) {
            var p = data.order.products[i];
            ids.push(p.ean);
          }
          this.trackEvent('Purchase', {
            value: data.order.priceData.total,
            currency: config.currency || 'EUR',
            content_ids: ids,
            content_type: 'product'
          });
          break;
        }
      default:
        logger.log('not sending any product data for pagetype \'' + data.page.type + '\'');
    }
  }

  // handle async event


  _createClass(FacebookWCA, [{
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      if (data.product != null) {
        switch (name) {
          case 'addtocart':
            return this.trackProductEvent('AddToCart', data.product.ean);
          case 'product-changevariant':
            return this.trackProductEvent('ViewContent', data.product.ean);
        }
      }
    }

    /**
     * Send tracking event to facebook
     */

  }, {
    key: 'trackEvent',
    value: function trackEvent(type, data) {
      logger.log('sending FB event: \'' + type + '\'', data);
      _opendatalayer.window._fbq.push(['track', type, data]);
    }

    /**
     * Send product tracking event to facebook
     * @param  type      {String}  FB-specific type for this event
     * @param  products  {Array|String}   single product id or a list with product ids
     */

  }, {
    key: 'trackProductEvent',
    value: function trackProductEvent(type, products) {
      this.trackEvent(type, {
        content_ids: products instanceof Array ? products : [products],
        content_type: 'product'
      });
    }
  }]);

  return FacebookWCA;
}();

exports.default = FacebookWCA;