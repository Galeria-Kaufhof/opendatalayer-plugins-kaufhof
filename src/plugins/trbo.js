/* eslint-disable no-underscore-dangle */
import { window, Logger, helpers } from 'opendatalayer';

//const logger = new Logger('ba/lib/odl/trbo');

export default class Trbo {

  constructor(odl, data, config) {
    //logger.log('initialize');

    // disable in FOC/App cases (@TODO: put in rule in ODL config)
    //if (gkConfig.focMode || gkConfig.isAppContext) {
    //  return;
    //}

    // add trbo script
    helpers.addScript(config.scriptUrl);

    const _trboq = window._trboq || [];
    let pt = '';

    switch (data.page.type) {
      case 'homepage':
        pt = 'home';
        break;
      case 'search':
        pt = 'search';
        break;
      case 'category':
        pt = 'category';
        break;
      case 'productdetail':
        pt = 'detail';
        _trboq.push(['productView', {
          products: [
            {
              product_id: data.product.aonr,
              name: data.product.name,
              price: data.product.priceData.total,
            },
          ],
        }]);
        break;
      case 'checkout-cart':
        pt = 'basket';
        _trboq.push(['basket', {
          // coupon_code: data.cart.couponCode,
          value: data.cart.priceData.total,
          products: this.buildProductsFromODL(data.cart.products),
        }]);
        break;
      case 'checkout-confirmation': {
        pt = 'confirmation';
        _trboq.push(['sale', {
          order_id: data.order.id,
          coupon_code: data.order.couponCode,
          value: data.order.priceData.total,
          products: this.buildProductsFromODL(data.order.products),
        }]);
        break;
      }
      default:
    }

    // add pagetype
    _trboq.push(['page', { type: pt }]);

    // for testing
    window._trboq = _trboq;
  }

  handleEvent(name, data) {
    if (name === 'addtocart') {
      _trboq.push(['basket', {}]);
    }
  }

  buildProductsFromODL(odlProducts) {
    return odlProducts.map((p) => {
      return {
        product_id: p.aonr,
        name: p.name,
        price: p.priceData.total,
        quantity: p.quantity,
      };
    });
  }
}
