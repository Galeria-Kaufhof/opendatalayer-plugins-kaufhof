'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _pixelHelper = require('./../../pixelHelper');

var pixelHelper = babelHelpers.interopRequireWildcard(_pixelHelper);


var logger = new _logger2.default('ba/lib/dal/aff/marin');

/**
 * Marin Conversion pixel DAL plugin
 *
 * @module   ba.lib.dal.aff.marin
 * @class    Marin
 * @implements  IDALService
 */

var Marin = function Marin(dal, data, config) {
  babelHelpers.classCallCheck(this, Marin);

  logger.log('initialize');

  _window2.default._mTrack = _window2.default._mTrack || [];
  _window2.default._mTrack.push(['activateAnonymizeIp']);
  _window2.default._mTrack.push(['trackPage']);

  // handle "conversion"
  if (data.page.type === 'checkout-confirmation' || data.page.type === 'newsletter-subscribed') {
    _window2.default._mTrack.push(['addTrans', {
      currency: 'EUR',
      items: [{
        convType: data.order != null ? 'order' : 'nl_lead',
        price: data.order ? data.order.priceData.total : '',
        orderId: data.order ? data.order.id : ''
      }]
    }]);
    _window2.default._mTrack.push(['processOrders']);
  }

  // send tracking request
  pixelHelper.addScript('//tracker.marinsm.com/tracker/async/' + config.accountId + '.js', false);
};

exports.default = Marin;