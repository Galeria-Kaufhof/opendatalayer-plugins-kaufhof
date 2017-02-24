import Logger from 'gk/lib/logger';
import pixelHelper from '../../pixelHelper';

const logger = new Logger('ba/lib/dal/bt/shopping24');

/**
 * Quantcast DAL plugin
 *
 * @module   ba.lib.dal.bt.shopping24
 * @class    Shopping24
 * @implements  IDALService
 */
export default class Shopping24 {

  constructor(dal, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      pixelHelper.addImage(`https://tracking.s24.com/TrackOrder?shopId=${config.hashId}&netRevenue=${data.order.priceData.net}&shipping=&products=${data.order.products.map((p) => p.aonr).join(',')}&lineItems=${data.order.products.length}&orderNumber=${data.order.id}`);
    }
  }
}
