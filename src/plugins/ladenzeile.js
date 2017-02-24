import { window, Logger, helpers } from 'opendatalayer';

const logger = new Logger('ladenzeile');

/**
 * Ladenzeile ODL plugin.
 */
export default class Ladenzeile {

  constructor(odl, data, config) {
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
      helpers.addScript('//www.ladenzeile.de/controller/visualMetaTrackingJs');
    }
  }
}
