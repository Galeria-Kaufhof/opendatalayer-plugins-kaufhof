'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _config = require('gk/lib/config');

var _config2 = babelHelpers.interopRequireDefault(_config);

var _pixelHelper = require('./../pixelHelper');

var pixelHelper = babelHelpers.interopRequireWildcard(_pixelHelper);

//const logger = new Logger('ba/lib/dal/trbo');

var Trbo = function () {
  function Trbo(dal, data, config) {
    babelHelpers.classCallCheck(this, Trbo);

    //logger.log('initialize');

    // disable in FOC/App cases
    if (_config2.default.focMode || _config2.default.isAppContext) {
      return;
    }

    // add trbo script
    pixelHelper.addScript(config.scriptUrl);

    var _trboq = _window2.default._trboq || [];
    var pt = '';

    switch (data.page.type) {
      case 'homepage':
        pt = 'home';
        break;
      case 'search':
        pt = 'search';
        break;
      case 'category':
        pt = 'category';
        break;
      case 'productdetail':
        pt = 'detail';
        _trboq.push(['productView', {
          products: [{
            product_id: data.product.aonr,
            name: data.product.name,
            price: data.product.priceData.total
          }]
        }]);
        break;
      case 'checkout-cart':
        pt = 'basket';
        _trboq.push(['basket', {
          // coupon_code: data.cart.couponCode,
          value: data.cart.priceData.total,
          products: this.buildProductsFromDAL(data.cart.products)
        }]);
        break;
      case 'checkout-confirmation':
        {
          pt = 'confirmation';
          _trboq.push(['sale', {
            order_id: data.order.id,
            coupon_code: data.order.couponCode,
            value: data.order.priceData.total,
            products: this.buildProductsFromDAL(data.order.products)
          }]);
          break;
        }
      default:
    }

    // add pagetype
    _trboq.push(['page', { type: pt }]);

    // for testing
    _window2.default._trboq = _trboq;
  }

  babelHelpers.createClass(Trbo, [{
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      if (name === 'addtocart') {
        _trboq.push(['basket', {}]);
      }
    }
  }, {
    key: 'buildProductsFromDAL',
    value: function buildProductsFromDAL(dalProducts) {
      return dalProducts.map(function (p) {
        return {
          product_id: p.aonr,
          name: p.name,
          price: p.priceData.total,
          quantity: p.quantity
        };
      });
    }
  }]);
  return Trbo;
}();
//import Logger from 'gk/lib/logger';
/* eslint-disable no-underscore-dangle */


exports.default = Trbo;