import { window, Logger, cookie } from 'opendatalayer';

const logger = new Logger('criteo');

/**
 * Criteo ODL plugin, integrating criteo pixel
 */
export default class Criteo {

  constructor(odl, data, config) {
    // append script to DOM
    const el = window.document.createElement('script');
    el.src = '//static.criteo.net/js/ld/ld.js';
    el.async = true;
    const head = window.document.getElementsByTagName('HEAD')[0];
    head.appendChild(el);
    // create core tracking object and track basics
    window.criteo_q = window.criteo_q || [];
    this.event('setAccount', { account: config.accountId });
    this.event('setSiteType', { type: config.siteType });
    // track event depending on type
    switch (data.page.type) {
      case 'homepage':
        this.event('viewHome');
        break;
      case 'search':
        this.event('viewList', { item: data.search.aonrs });
        break;
      case 'category':
        this.event('viewList', { item: data.category.aonrs });
        break;
      case 'productdetail':
        this.event('viewItem', { item: data.product.aonr });
        break;
      case 'checkout-cart':
        this.event('viewBasket', { item: this.getProductItems(data.cart) });
        break;
      case 'checkout-confirmation': {
        const emosJckamp = cookie.get('emos_jckamp');
        const evData = {
          id: data.order.id,
          deduplication: emosJckamp && emosJckamp.match(/campaign=criteo/) ? 1 : 0,
          item: this.getProductItems(data.order),
        };
        if (data.order.paybackPoints > 0) {
          evData.user_segment = '1';
        }
        this.event('trackTransaction', evData);
        break;
      }
      default:
    }
  }

  // get product items from a ODLCartData object the way criteo needs it
  getProductItems(data) {
    const items = [];
    for (let i = 0; i < data.products.length; i += 1) {
      const p = data.products[i];
      items.push({ id: p.aonr, price: p.priceData.total, quantity: p.quantity });
    }
    return items;
  }

  // send an event to criteo
  event(name, data = {}) {
    const eventObj = { event: name };
    for (const d in data) {
      const v = data[d];
      eventObj[d] = v;
    }
    logger.log('pushing event', eventObj);
    return window.criteo_q.push(eventObj);
  }
}

