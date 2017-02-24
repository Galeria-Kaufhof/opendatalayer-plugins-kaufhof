import { Logger, helpers } from 'opendatalayer';

const logger = new Logger('shopping24');

/**
 * Shopping24 ODL plugin
 */
export default class Shopping24 {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      helpers.addImage(`https://tracking.s24.com/TrackOrder?shopId=${config.hashId}&netRevenue=${data.order.priceData.net}&shipping=&products=${data.order.products.map((p) => p.aonr).join(',')}&lineItems=${data.order.products.length}&orderNumber=${data.order.id}`);
    }
  }
}
