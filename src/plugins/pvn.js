import { Logger, helpers } from 'opendatalayer';
import $ from 'jquery';

const logger = new Logger('ba/lib/odl/bt/affilinet');

/**
 * PVN pixel ODL plugin
 */
export default class PVN {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      // order pixel
      helpers.addScript(`https://partnerprogramm.galeria-kaufhof.de/trck/etrack/?campaign_id=1&trigger_id=1&token=${data.order.id}&descr=&currency=${config.currency}&turnover=${data.order.priceData.net}&vc=${data.order.couponCode}&t=js`);

      // START EASY AFFILIATE
      const orderId = data.order.id;
      $.post('https://partnerprogramm.galeria-kaufhof.de/basket_tracking.php', {
        basket: data.order.products.map(p => ({
          bestid: orderId,
          productid: p.ean,
          productname: p.name,
          amount: p.quantity,
          price: p.priceData.net,
          category: p.abteilungNummer,
        })),
      });
    }
  }
}
