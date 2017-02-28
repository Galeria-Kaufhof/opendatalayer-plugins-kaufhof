'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('marin');

/**
 * Marin Conversion pixel ODL plugin.
 */

var Marin = function Marin(odl, data, config) {
  _classCallCheck(this, Marin);

  logger.log('initialize');

  _opendatalayer.window._mTrack = _opendatalayer.window._mTrack || [];
  _opendatalayer.window._mTrack.push(['activateAnonymizeIp']);
  _opendatalayer.window._mTrack.push(['trackPage']);

  // handle "conversion"
  if (data.page.type === 'checkout-confirmation' || data.page.type === 'newsletter-subscribed') {
    _opendatalayer.window._mTrack.push(['addTrans', {
      currency: 'EUR',
      items: [{
        convType: data.order != null ? 'order' : 'nl_lead',
        price: data.order ? data.order.priceData.total : '',
        orderId: data.order ? data.order.id : ''
      }]
    }]);
    _opendatalayer.window._mTrack.push(['processOrders']);
  }

  // send tracking request
  _opendatalayer.helpers.addScript('//tracker.marinsm.com/tracker/async/' + config.accountId + '.js', false);
};

exports.default = Marin;