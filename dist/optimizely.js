'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

// import 'https://cdn.optimizely.com/js/216755552.js';

/**
 * optimizely ODL plugin
 *
 * Includes optimizely lib and hands over conversion data when on checkout-comnfirmation page.
 */
var Optimizely =

/**
 * Fired when the plugin is loaded by the ODL (during or after DOM load)
 *
 * @param  {ODL}      odl     the global ODL instance
 * @param  {Object}   data    the global ODL data object (as returned by ODL.getData)
 * @param  {Object}   config  custom configuration for this service
 */
function Optimizely(odl, data, config) {
  babelHelpers.classCallCheck(this, Optimizely);

  if (data.page.type === 'checkout-confirmation') {
    // @TODO use System.import once systemjs is globally available
    _opendatalayer.window.require([_opendatalayer.window.location.protocol + '//cdn.optimizely.com/js/216755552.js'], function () {
      _opendatalayer.window.optimizely = _opendatalayer.window.optimizely || [];
      _opendatalayer.window.optimizely.push(['trackEvent', 'purchase', { revenue: data.order.priceData.total * 100 }]);
    });
  }
};

exports.default = Optimizely;