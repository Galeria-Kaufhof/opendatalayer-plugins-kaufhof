import { window, Logger } from 'opendatalayer';
import A3320 from './../lib/A3320_tracking';

const logger = new Logger('ba/lib/odl/bt/psm');

/**
 * PSM ODL plugin
 */
export default class PSM {

  constructor(odl, data, config) {
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
