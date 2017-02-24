/* eslint-disable no-underscore-dangle */
import { window, Logger, helpers } from 'opendatalayer';

const logger = new Logger('shoppingcom');

/**
 * Shopping.com ODL plugin
 */
export default class ShoppingCOM {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      const _roi = window._roi || [];

      _roi.push(['_setMerchantId', config.merchantId]);
      _roi.push(['_setOrderAmount', data.order.priceData.total]);

      data.order.products.forEach((p) => {
        _roi.push(['_addItem',
          p.aonr, // Händler-Artikelnr.
          p.name, // Produktname
          '', // Kategorie-ID
          p.category, // Kategorie-Name
          p.priceData.total, // Einzelpreis (inkl. MwSt.)
          p.quantity, // Artikelmenge
        ]);
      });
      _roi.push(['_trackTrans']);
      window._roi = _roi;

      helpers.addScript('//stat.dealtime.com/ROI/ROI2.js');
    }
  }
}
