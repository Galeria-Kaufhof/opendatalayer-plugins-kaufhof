import { window, Logger } from 'opendatalayer';

const logger = new Logger('ba/lib/odl/aff/facebookWCA');

/**
 * facebook ODL plugin, intergating facebook remarketing pixel
 * See https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/product-audiences/v2.2
 */
export default class FacebookWCA {

  constructor(odl, data, config) {
    // load FB pixel and append it to DOM
    if (!window._fbq) {
      window._fbq = [];
    }
    const { _fbq } = window;
    if (!_fbq.loaded) {
      const fbds = window.document.createElement('script');
      fbds.src = '//connect.facebook.net/en_US/fbds.js';
      const s = window.document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(fbds, s);
      _fbq.loaded = true;
    }
    _fbq.push(['addPixelId', config.pixelId]);
    _fbq.push(['track', 'PixelInitialized', {}]);
    // track event depending on type
    switch (data.page.type) {
      case 'productdetail': {
        if (data.product != null) { this.trackProductEvent('ViewContent', data.product.ean); }
        break;
      }
      case 'checkout-confirmation': {
        const ids = [];
        for (let i = 0; i < data.order.products.length; i++) {
          const p = data.order.products[i];
          ids.push(p.ean);
        }
        this.trackEvent('Purchase', {
          value: data.order.priceData.total,
          currency: config.currency || 'EUR',
          content_ids: ids,
          content_type: 'product',
        });
        break;
      }
      default:
        logger.log(`not sending any product data for pagetype '${data.page.type}'`);
    }
  }

  // handle async event
  handleEvent(name, data) {
    if (data.product != null) {
      switch (name) {
        case 'addtocart':
          return this.trackProductEvent('AddToCart', data.product.ean);
        case 'product-changevariant':
          return this.trackProductEvent('ViewContent', data.product.ean);
      }
    }
  }

  /**
   * Send tracking event to facebook
   */
  trackEvent(type, data) {
    logger.log(`sending FB event: '${type}'`, data);
    window._fbq.push(['track', type, data]);
  }

  /**
   * Send product tracking event to facebook
   * @param  type      {String}  FB-specific type for this event
   * @param  products  {Array|String}   single product id or a list with product ids
   */
  trackProductEvent(type, products) {
    this.trackEvent(type, {
      content_ids: products instanceof Array ? products : [products],
      content_type: 'product',
    });
  }
}
