import window from 'gk/globals/window';
import mediaQuery from 'gk/lib/mediaQuery';
import Logger from 'gk/lib/logger';
import localStorage from 'gk/globals/localStorage';
import rumba from './../rumba';

const logger = new Logger('ba/lib/dal/bsna');

/**
 * bsna DAL plugin
 *
 * Includes rumba logging library and hands over specific data to our logging backend.
 * Interface and transport data is compliant with JUMPRFC018,
 * see http://gitlab.gkh-setu.de/specs/jumprfc-018-analytics/blob/master/jumprfc-018-analytics.md
 */
export default class BSNA {

  /**
   * Fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @param  {ba.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(dal, data, config) {
    logger.log('initialize');
    this.optedOut = localStorage.getItem('ba:optout') === '1';
    if (!this.optedOut) {
      logger.log('starting bsna tracking');
      // init rumba
      rumba.init({
        backend: config.backend || '/bsna/rumba/v1',
        repostOnError: false,
        pushInterval: 5,
        sessionLifetime: 1800,
        // pass bid as option
        browserId: data.identity.bid,
      });
      // handle opt-out requests for rumba
      if (window.location.href.match(/(\?|&)trackingoptout=1/i)) {
        localStorage.setItem('ba:optout', '1');
      }
    } else {
      logger.log('bsna tracking opt-out is active');
    }
  }

  /**
   * Capture all async events and send them to rumba.
   * @TODO add loglevel argument to DAL
   */
  handleEvent(name, data) {
    if (this.optedOut) {
      return;
    }
    logger.log(`event '${name}' caught`);
    switch (name) {
      case 'initialize': {
        const navigationData = data.navigation ? data.navigation : {entries: []};
        const pageLoad = rumba.BAPageLoadEvent.create(data.page.type, data.page.name, mediaQuery.currentRange, navigationData);
        switch (data.page.type) {
          case 'productdetail': {
            pageLoad.product = this.rumbaProductFromDALProductData(data.product);
            break;
          }
          case 'checkout-confirmation': {
            const lineItems = data.order.products.map((p) => rumba.BALineItem.create(this.rumbaProductFromDALProductData(p), p.quantity));
            pageLoad.order = rumba.BAOrder.create(lineItems);
            break;
          }
          case 'category': {
            if (data.brand) {
              pageLoad.brand = this.rumbaBrandFromDALBrandData(data.brand);
            }
            break;
          }
          default:
            break;
        }
        rumba.event(pageLoad);
        // immediately push data
        rumba.push();
        break;
      }
      case 'addtocart': {
        const e = rumba.BAProductAddedToCartEvent.create(rumba.BALineItem.create(this.rumbaProductFromDALProductData(data.product), data.quantity));
        rumba.event(e);
        rumba.push();
      }
      /*
      case 'rumba-click': {
        rumba.event(new rumba.ClickEvent(data.target));
        break;
      }
      case 'rumba-focus': {
        rumba.event(new rumba.FocusEvent(data.target));
        break;
      }
      */
      default: {
        return;
      }
    }
  }

  /**
   * Create a JUMPRFC018-compliant product payload object from a DALProductData object.
   * @param  {DALProductData}  product  product data to convert
   */
  rumbaProductFromDALProductData(product) {
    return rumba.BAProduct.create(
      product.productId,
      product.variantId,
      product.ean,
      product.aonr,
      this.rumbaBrandFromDALBrandData(product.brandData),
    );
  }

  /**
   * Create a JUMPRFC018-compliant brand payload object from a DALBrandData object.
   * @param  {DALBrandData}  brand  brand data to convert
   */
  rumbaBrandFromDALBrandData(brand) {
    return rumba.BABrand.create(brand.name, brand.brandKey, brand.lineKey);
  }
}
