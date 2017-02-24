import $ from 'jquery';
import Logger from 'gk/lib/logger';
import window from 'gk/globals/window';
// import '//media.richrelevance.com/rrserver/js/1.0/p13n.js';

const logger = new Logger('ba/lib/dal/richrelevance');

/**
 * richrelevance DAL plugin
 *
 * DAL service plugin for embedding richrelevance into the page. Also responsible for
 * replacing gk:recommendation meta tags with actual recommendation markup.
 *
 * @module gk.lib.dal
 * @class  richrelevance
 */
export default class Richrelevance {

  /**
   * Init callback, fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(dal, data, config) {
    this.dal = dal;
    this.data = data;
    this.config = config;
    this.placements = {}; // object with placmement data and callbacks for each placmement id
    this.initCallbacks = [];
    this.dataReceived = false;

    // @TODO use System.import instead, once systemjs is globally available
    window.require([`${window.location.protocol}//media.richrelevance.com/rrserver/js/1.2/p13n.js`], () => {
      logger.log('initialize');
      logger.log('got richrelevance serviceconfig: ', this.config);

      const RR = window.RR;
      this.RR = RR;

      // init r3_common object
      if (!this._initCommon()) {
        return;
      }

      // not sure why we need to set this here. the normal usage according to the recommendation guide is to
      // do a rr_flush_onload() which does not work here unfortunately
      window.rr_onload_called = true;

      // add richrelevance async callback (fires when reco call is complete)
      RR.jsonCallback = () => {
        let n;
        logger.log('callback triggered ', RR.data.JSON.placements);
        this.dataReceived = true;
        for (let i = 0; i < this.initCallbacks.length; i++) {
          const cb = this.initCallbacks[i];
          cb(RR.data.JSON.placements);
        }
        this.initCallbacks.length = 0;
        // notify handlers for all placements in the current response
        logger.log('notifying placement callbacks');
        RR.data.JSON.placements.map((placementData) => {
          (n = placementData.placement_name,
          logger.log(`looking for existing handlers ${n}`),
          this.placements[n] ?
            (this.placements[n].data = placementData,
            logger.log('entry found, firing callback(s)'),
            this.placements[n].callbacks.map((cb) =>
              cb(n, placementData)))
          :
            (logger.log(`storing new data for placement name ${n}`),
            this.placements[n] = { data: placementData, callbacks: [] }));
        });
      };

      // collect placement ids from current page

      this._scanNodeForPlaceholders($('html'));
      // create RR tracking objects depending on current page type
      logger.log('page.type is ', this.data.page.type);
      switch (this.data.page.type) {
        case 'homepage':
          new window.r3_home();
          break;
        case 'myaccount':
        case 'myaccount-overview':
        case 'myaccount-orders':
          new window.r3_personal();
          break;
        case 'service':
        case 'myaccount-logout':
          new window.r3_generic();
          break;
        case 'error':
          new window.r3_error();
          break;
        case 'search':
          // search? needs keywords and up to 15 item ids
          window.R3_SEARCH = new window.r3_search();
          window.R3_SEARCH.setTerms(this.data.search.keywords);
          if (this.data.search.ids !== undefined) {
            const iterable = (this.data.search.ids.split(',')).slice(0, 15);
            for (let i = 0; i < iterable.length; i++) {
              const id = iterable[i];
              window.R3_SEARCH.addItemId(id);
            }
          } else {
            logger.log('search.ids not present in DAL');
          }
          break;
        case 'category':
          // category? needs id/name
          window.R3_CATEGORY = new window.r3_category();
          window.R3_CATEGORY.setId(this.data.category.id);
          window.R3_CATEGORY.setName(this.data.category.name);
          break;
        case 'productdetail':
          // productdetail? needs EAN and category hint in global object
          window.R3_ITEM = new window.r3_item();
          window.R3_ITEM.setId(this.data.product.productId + '');  // HACK: we need a string to stop RR from throwing errors
          window.R3_ITEM.setName(this.data.product.name);
          break;
          // window.R3_COMMON.addCategoryHintId @data.product.category # see https://jira.gkh-setu.de/browse/BSNA-384
        case 'brand':
          // brand page? needs brand name
          window.R3_COMMON.setPageBrand(this.data.brand.name);
          new window.r3_brand();
          break;
        case 'checkout-cart':
          // shopping cart? needs product ids
          window.R3_CART = new window.r3_cart();
          if (this.data.cart.products !== undefined) {
            for (let j = 0; j < this.data.cart.products.length; j++) {
              const p = this.data.cart.products[j];
              window.R3_CART.addItemId(p.productId);
            }
          }
          break;
        case 'checkout-confirmation':
          // checkout complete? pass products
          window.R3_PURCHASED = new window.r3_purchased();
          window.R3_PURCHASED.setOrderNumber(this.data.order.id);
          if (this.data.order.testOrder !== true && this.data.order.products !== undefined) {
            for (let k = 0; k < this.data.order.products.length; k++) {
              const p = this.data.order.products[k];
              window.R3_PURCHASED.addItemIdPriceQuantity(p.productId, p.priceData.totalBeforeDiscount, p.quantity);
            }
          }
          break;
        default:
          // no match? don't track anything yet
          logger.log('unmatched page.type: ', this.data.page.type);
          return;
      }

      // call RR
      window.rr_flush_onload();
      window.r3();
    });
  }

  /**
   * Init r3common tracking object based on current service config.
   */
  _initCommon() {
    if (window.r3_common === undefined) {
      logger.error('Richrelevance is not available. Aborting initialization');
      return false;
    }
    // find the right server
    let baseUrl;
    if (window.location.href.indexOf('galeria-kaufhof.de') > -1) {
      baseUrl = `${window.location.protocol}//recs.richrelevance.com/rrserver/`;
    } else {
      baseUrl = this.config && this.config.baseUrl ? this.config.baseUrl : `${window.location.protocol}//integration.richrelevance.com/rrserver/`;
    }
    logger.log('RR base url is: ', baseUrl);
    // create global rr object
    window.R3_COMMON = new window.r3_common();
    window.R3_COMMON.setApiKey(this.config.apiKey);
    window.R3_COMMON.setBaseUrl(baseUrl);
    window.R3_COMMON.setClickthruServer(window.location.protocol + '//' + window.location.host);
    window.R3_COMMON.setSessionId(__guard__(this.data.identity, x1 => x1.bid));
    window.R3_COMMON.setUserId(__guard__(this.data.user, x2 => x2.id) || __guard__(this.data.identity, x3 => x3.bid));
    if (__guard__(this.config, x4 => x4.forceDevMode) === true) {
      logger.log('Forcing RR dev mode');
      window.R3_COMMON.forceDevMode();
    }
    return true;
  }

  /**
   * Event handling callback, processes asynchronous events sent by the DAL.
   *
   * @method handleEvent
   * @param  {String}  name  name/type of the event
   * @param  {Object}  data  additional data passed to this event
   */
  handleEvent(name, data) {
    logger.log(`event ${name} caught`, data);
    if (name === 'addtocart') {
      // re-scan cart layer for placeholders
      this._initCommon();
      if (data.layer) { this._scanNodeForPlaceholders(data.layer); }
      // handle async event in RR
      window.R3_ADDTOCART = new r3_addtocart();
      // pass real product data to RR
      window.R3_ADDTOCART.addItemIdToCart(data.product.productId);
      r3();
    }
  }

  /**
   * @deprecated
   */
  addInitCallback(callback) {
    if (this.dataReceived) {
      return callback(this.RR.data.JSON.placements);
    }
    return this.initCallbacks.push(callback);
  }

  /**
   * Add a callback to be notified when data for the given placement name
   * becomes available. If the data is already available, the callback is
   * immediately fired.
   *
   * Callback arguments are "placementName" and "placementData" (which
   * then contains three properties: placement_name, recs and strat_message).
   *
   * Callback example:
   *
   * myResponseCallback = function (placementName, placementData) {
   *   console.log(placementData.strat_message);
   *   for (var i=0; i<placementData.recs.length; ++i) {
   *     console.log(placementData.recs[i].name);
   *   }
   * }
   *
   * @method addResponseCallback
   * @param  placementName {String}  placement name to listen for
   * @param  callback      {Function}  callback function to be fired (gets placement's name and data passed as arguments)
   */
  addResponseCallback(placementName, callback) {
    const d = this.placements ? this.placements[placementName] : null;
    logger.log('placements:');
    logger.log(this.placements);
    if (d) {
      if (d.data) {
        logger.log('data found, immediately firing callback');
        return callback(placementName, d.data);
      }
      logger.log('placement entry exists, adding callback');
      return d.callbacks.push(callback);
    } else {
      logger.log('creating new placement entry, adding callback');
      this.placements[placementName] = { callbacks: [callback] };
    }
  }

  /**
   * Scan a given DOM node for gk_recommendation placeholders and add r3common
   * placement types.
   *
   * @method _scanNodeForPlaceholder
   * @private
   * @param  $el {jQuery}  DOM node to be scanned
   */
  _scanNodeForPlaceholders($el) {
    return $('meta[name=gk\\:recommendation]', $el).each(function () {
      logger.log('found RR placement type: ', $(this).attr('content'));
      return window.R3_COMMON.addPlacementType($(this).attr('content'));
    });
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
