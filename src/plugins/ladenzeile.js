import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';
import * as pixelHelper from '../../pixelHelper';

const logger = new Logger('ba/lib/dal/bt/ladenzeile');

/**
 * Ladenzeile DAL plugin
 *
 * @module   ba.lib.dal.bt.ladenzeile
 * @class    Ladenzeile
 * @implements  IDALService
 */
export default class Ladenzeile {

  constructor(dal, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      // Ladenzeile global object
      window.vmt_pi = {
        trackingId: config.trackingId,
        type: 'confirmed',
        amount: data.order.priceData.total,
        skus: data.order.products.map(p => p.ean),
        prices: data.order.products.map(p => p.priceData.net),
        currency: config.currency, // -> "EUR"
      };

      // add script
      pixelHelper.addScript('//www.ladenzeile.de/controller/visualMetaTrackingJs');
    }
  }
}
