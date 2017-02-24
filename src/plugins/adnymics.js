import { window, Logger, helpers } from 'opendatalayer';

const logger = new Logger('opendatalayer-plugins-kaufhof/adnymics');

/**
 * Adnymics pixel ODL plugin
 */
export default class Adnymics {

  constructor(odl, data, config) {
    logger.log('initialize');

    const _paq = window._paq || [];
    // pass bid as unique identifier for this specific user
    _paq.push(['setCustomVariable', 1, 'identity', data.identity.bid, 'page']);

    // pass product info (only on ADS or after checkout)
    if (data.page.type === 'productdetail') {
      _paq.push(['setCustomVariable', 2, 'productId', data.product.ean, 'page']);
    } else if (data.page.type === 'checkout-confirmation') {
      const o = data.order;
      for (const i in o.products) {
        const p = o.products[i];
        _paq.push(['addEcommerceItem', p.ean, p.name, p.abteilungName, p.priceData.total, p.quantity]);
      }
      _paq.push(['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, (o.couponCode != null)]);
    }

    // load script
    const url = '//s1.adnymics.com/';
    if (data.page.type !== 'checkout-confirmation') {
      _paq.push(['enableLinkTracking']);
    }
    _paq.push(['setTrackerUrl', `${url}piwik.php`]);
    _paq.push(['setSiteId', config.siteId]);
    _paq.push(['trackPageView']);
    window._paq = _paq;
    helpers.addScript(`${url}piwik.js`);
  }
}
