import { window, Logger, helpers } from 'opendatalayer';

const logger = new Logger('marin');

/**
 * Marin Conversion pixel ODL plugin.
 */
export default class Marin {

  constructor(odl, data, config) {
    logger.log('initialize');

    window._mTrack = window._mTrack || [];
    window._mTrack.push(['activateAnonymizeIp']);
    window._mTrack.push(['trackPage']);

    // handle "conversion"
    if (data.page.type === 'checkout-confirmation' || data.page.type === 'newsletter-subscribed') {
      window._mTrack.push(['addTrans', {
        currency: 'EUR',
        items: [{
          convType: (data.order != null) ? 'order' : 'nl_lead',
          price: data.order ? data.order.priceData.total : '',
          orderId: data.order ? data.order.id : '',
        }],
      }]);
      window._mTrack.push(['processOrders']);
    }

    // send tracking request
    helpers.addScript(`//tracker.marinsm.com/tracker/async/${config.accountId}.js`, false);
  }
}
