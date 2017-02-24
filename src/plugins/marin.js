import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';
import * as pixelHelper from './../../pixelHelper';

const logger = new Logger('ba/lib/dal/aff/marin');

/**
 * Marin Conversion pixel DAL plugin
 *
 * @module   ba.lib.dal.aff.marin
 * @class    Marin
 * @implements  IDALService
 */
export default class Marin {

  constructor(dal, data, config) {
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
    pixelHelper.addScript(`//tracker.marinsm.com/tracker/async/${config.accountId}.js`, false);
  }
}
