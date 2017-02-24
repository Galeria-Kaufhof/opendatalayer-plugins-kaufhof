import { Logger, helpers } from 'opendatalayer';

const logger = new Logger('billiger');

/**
 * Billiger.de ODL plugin
 */
export default class Billiger {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      let articles = '';
      for (let i = 0; i < data.order.products.length; i += 1) {
        const p = data.order.products[i];
        const num = i + 1;
        articles += `&aid_${num}=${p.ean}&name_${num}=${encodeURIComponent(p.name)}&cnt_${num}=${p.quantity}&val_${num}=${p.priceData.net}`;
      }

      helpers.addImage(`//billiger.de/sale?shop_id=${config.shopId}&oid=${data.order.id}${articles}`, 1, 1);
    }
  }
}
