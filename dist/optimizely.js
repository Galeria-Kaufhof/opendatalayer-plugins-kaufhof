'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

// import 'https://cdn.optimizely.com/js/216755552.js';

/**
 * optimizely DAL plugin
 *
 * Includes optimizely lib and hands over conversion data when on checkout-comnfirmation page
 *
 * @module   gk.lib.dal
 * @class    Optimizely
 * @implements  IDALService
 */
var Optimizely =

/**
 * Fired when the plugin is loaded by the DAL (during or after DOM load)
 *
 * @param  {gk.lib.DAL}  dal     the global DAL instance
 * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
 * @param  {Object}      config  custom configuration for this service
 */
function Optimizely(dal, data, config) {
  babelHelpers.classCallCheck(this, Optimizely);

  if (data.page.type === 'checkout-confirmation') {
    // @TODO use System.import once systemjs is globally available
    _window2.default.require([_window2.default.location.protocol + '//cdn.optimizely.com/js/216755552.js'], function () {
      _window2.default.optimizely = _window2.default.optimizely || [];
      _window2.default.optimizely.push(['trackEvent', 'purchase', { revenue: data.order.priceData.total * 100 }]);
    });
  }
};

exports.default = Optimizely;