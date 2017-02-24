import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';
import A3320 from 'ba/vendor/A3320_tracking';

const logger = new Logger('ba/lib/dal/bt/psm');

/**
 * PSM DAL plugin
 *
 * @module   ba.lib.dal.bt.psm
 * @class    PSM
 * @implements  IDALService
 */
export default class PSM {

  constructor(dal, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      A3320.advertiserId = config.advertiserId; // 643
      A3320.advertiserRestricted = false; // false

      const properties = {
        billing_advid: config.advertiserId, // 643 do not change this line
        billing_orderid: data.order.id, // this id must be unique otherwise we will count the conversion only once
        billing_address: 'NULL', // if needed
        billing_customerid: 'NULL', // if needed
        billing_sum: data.order.priceData.net,
        ec_Event: data.order.products.map(p => ['buy', p.ean, p.name, p.priceData.net, window.encodeURIComponent(p.category), p.quantity, 'NULL', 'NULL', 'NULL']),
      };

      A3320.trackEvent(properties);
    }
  }
}
