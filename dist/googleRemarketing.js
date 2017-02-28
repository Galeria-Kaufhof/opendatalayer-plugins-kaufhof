'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import 'https://www.googleadservices.com/pagead/conversion_async.js';

var logger = new _opendatalayer.Logger('googleRemarketing');

/**
 * GoogleRemarketing pixel ODL plugin.
 */

var GoogleRemarketing = function GoogleRemarketing(odl, data, config) {
  _classCallCheck(this, GoogleRemarketing);

  logger.log('initialize');
  // @TODO use System.import once systemjs is globally available
  _opendatalayer.window.require([_opendatalayer.window.location.protocol + '//www.googleadservices.com/pagead/conversion_async.js'], function () {
    // build params
    var _ref = [],
        pageType = _ref[0],
        category = _ref[1],
        prodName = _ref[2],
        prodPrice = _ref[3],
        prodId = _ref[4],
        memberType = _ref[5],
        payback = _ref[6];

    switch (data.page.type) {
      case 'homepage':
        pageType = 'home';
        break;
      case 'category':
        pageType = 'category';
        category = data.category.id;
        break;
      case 'productdetail':
        pageType = 'product';
        category = data.product.category;
        prodId = data.product.ean;
        prodName = data.product.name;
        prodPrice = data.product.priceData.total;
        break;
      case 'checkout-cart':
        pageType = 'cart';
        break;
      case 'checkout-confirmation':
        pageType = 'purchase';
        // build memberType (see LIVE-5019)
        payback = data.order.paybackPoints > 0 ? '1' : '0';
        memberType = data.order.customer.loginstatus.match(/Guest$/) !== null ? '0' : '1';
        break;
      default:
    }

    if (data.page.type === 'checkout-cart' || data.page.type === 'checkout-confirmation') {
      category = [];
      prodName = [];
      prodPrice = [];
      prodId = [];
      var products = data.cart ? data.cart.products : data.order.products;
      for (var i = 0; i < products.length; i++) {
        var p = products[i];
        category.push(p.category);
        prodName.push(p.name);
        prodPrice.push(p.priceData.total);
        prodId.push(p.ean);
      }
    }

    // use async tracking (see https://developers.google.com/adwords-remarketing-tag/asynchronous/)
    var customParams = {
      ecomm_pagetype: pageType,
      ecomm_category: category,
      ecomm_prodname: prodName,
      ecomm_prodid: prodId,
      ecomm_totalvalue: prodPrice
    };
    if (memberType) {
      customParams.membertype = memberType;
    }
    if (payback) {
      customParams.payback = payback;
    }
    _opendatalayer.window.google_trackConversion({
      google_conversion_id: config.conversionId,
      google_conversion_label: config.conversionLabel,
      google_remarketing_only: true,
      google_conversion_format: 3,
      google_custom_params: customParams
    });
  });
};

exports.default = GoogleRemarketing;