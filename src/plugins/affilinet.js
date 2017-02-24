import { Logger, helpers } from 'opendatalayer';

const logger = new Logger('affilinet');

/**
 * Affili.net ODL plugin
 */
export default class Affilinet {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      let articles = '';
      for (let i = 0; i < data.order.products.length; i++) {
        const p = data.order.products[i];
        articles += `ArticleNb%3D${escape(p.ean)}%26`;
        articles += `ProductName%3D${escape(p.name)}%26`;
        articles += `Category%3D${escape(encodeURIComponent(p.abteilungNummer))}%26`;
        articles += `Quantity%3D${escape(p.quantity)}%26`;
        articles += `SinglePrice%3D${escape(parseFloat(p.priceData.net).toFixed(2))}%26`;
        articles += 'Brand%3D%26';
        articles += '%0D%0A'; // newline to separate articles
      }

      helpers.addImage(`//partners.webmasterplan.com/registersale.asp?site=${config.site}&ref=&affmt=&affmn=&price=${data.order.priceData.net}&order=${data.order.id}&vcode=${data.order.couponCode}&basket=${articles}`, 1, 1);
    }
  }
}
