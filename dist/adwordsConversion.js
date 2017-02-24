'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('adwordsConversion');

/**
 * Google Adwords Conversion pixel ODL plugin
 */

var AdwordsConversion = function AdwordsConversion(odl, data, config) {
  babelHelpers.classCallCheck(this, AdwordsConversion);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    _opendatalayer.window.require([_opendatalayer.window.location.protocol + '//www.googleadservices.com/pagead/conversion_async.js'], function () {
      // async tracking
      _opendatalayer.window.google_trackConversion({
        google_conversion_id: config.conversionId,
        google_conversion_label: config.conversionLabel,
        google_conversion_format: 3,
        google_conversion_currency: config.conversionCurrency,
        google_conversion_value: data.order.priceData.total,
        google_remarketing_only: false
      });
    });
  }
};

exports.default = AdwordsConversion;