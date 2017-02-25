'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

// import $ from 'jquery';
// import '//media.richrelevance.com/rrserver/js/1.0/p13n.js';

var logger = new _opendatalayer.Logger('richrelevance');

/**
 * richrelevance ODL plugin
 *
 * ODL service plugin for embedding richrelevance into the page. Also responsible for
 * replacing gk:recommendation meta tags with actual recommendation markup.
 */
/* eslint-disable new-cap */

var Richrelevance = function () {

  /**
   * Init callback, fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.ODL}  odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function Richrelevance(odl, data, config) {
    var _this = this;

    babelHelpers.classCallCheck(this, Richrelevance);

    this.odl = odl;
    this.data = data;
    this.config = config;
    this.placements = {}; // object with placmement data and callbacks for each placmement id
    this.initCallbacks = [];
    this.dataReceived = false;

    // @TODO use System.import instead, once systemjs is globally available
    _opendatalayer.window.require([_opendatalayer.window.location.protocol + '//media.richrelevance.com/rrserver/js/1.2/p13n.js'], function () {
      logger.log('initialize');
      logger.log('got richrelevance serviceconfig: ', _this.config);

      var RR = _opendatalayer.window.RR;
      _this.RR = RR;

      // init r3_common object
      if (!_this._initCommon()) {
        return;
      }

      // not sure why we need to set this here. the normal usage according to the recommendation guide is to
      // do a rr_flush_onload() which does not work here unfortunately
      _opendatalayer.window.rr_onload_called = true;

      // add richrelevance async callback (fires when reco call is complete)
      RR.jsonCallback = function () {
        var n = void 0;
        logger.log('callback triggered ', RR.data.JSON.placements);
        _this.dataReceived = true;
        for (var i = 0; i < _this.initCallbacks.length; i += 1) {
          var cb = _this.initCallbacks[i];
          cb(RR.data.JSON.placements);
        }
        _this.initCallbacks.length = 0;
        // notify handlers for all placements in the current response
        logger.log('notifying placement callbacks');
        RR.data.JSON.placements.map(function (placementData) {
          n = placementData.placement_name, logger.log('looking for existing handlers ' + n), _this.placements[n] ? (_this.placements[n].data = placementData, logger.log('entry found, firing callback(s)'), _this.placements[n].callbacks.map(function (cb) {
            return cb(n, placementData);
          })) : (logger.log('storing new data for placement name ' + n), _this.placements[n] = { data: placementData, callbacks: [] });
        });
      };

      // collect placement ids from current page (no param means check globally)
      _this._scanNodeForPlaceholders();

      // create RR tracking objects depending on current page type
      logger.log('page.type is ', _this.data.page.type);
      switch (_this.data.page.type) {
        case 'homepage':
          new _opendatalayer.window.r3_home();
          break;
        case 'myaccount':
        case 'myaccount-overview':
        case 'myaccount-orders':
          new _opendatalayer.window.r3_personal();
          break;
        case 'service':
        case 'myaccount-logout':
          new _opendatalayer.window.r3_generic();
          break;
        case 'error':
          new _opendatalayer.window.r3_error();
          break;
        case 'search':
          // search? needs keywords and up to 15 item ids
          _opendatalayer.window.R3_SEARCH = new _opendatalayer.window.r3_search();
          _opendatalayer.window.R3_SEARCH.setTerms(_this.data.search.keywords);
          if (_this.data.search.productIds !== undefined) {
            var iterable = _this.data.search.productIds.slice(0, 15);
            for (var i = 0; i < iterable.length; i += 1) {
              var id = iterable[i];
              _opendatalayer.window.R3_SEARCH.addItemId(id);
            }
          } else {
            logger.log('search.aonrs not present in ODL');
          }
          break;
        case 'category':
          // category? needs id/name
          _opendatalayer.window.R3_CATEGORY = new _opendatalayer.window.r3_category();
          _opendatalayer.window.R3_CATEGORY.setId(_this.data.category.id);
          _opendatalayer.window.R3_CATEGORY.setName(_this.data.category.name);
          break;
        case 'productdetail':
          // productdetail? needs EAN and category hint in global object
          _opendatalayer.window.R3_ITEM = new _opendatalayer.window.r3_item();
          _opendatalayer.window.R3_ITEM.setId(_this.data.product.productId.toString()); // HACK: we need a string to stop RR from throwing errors
          _opendatalayer.window.R3_ITEM.setName(_this.data.product.name);
          break;
        // window.R3_COMMON.addCategoryHintId @data.product.category # see https://jira.gkh-setu.de/browse/BSNA-384
        case 'brand':
          // brand page? needs brand name
          _opendatalayer.window.R3_COMMON.setPageBrand(_this.data.brand.name);
          new _opendatalayer.window.r3_brand();
          break;
        case 'checkout-cart':
          // shopping cart? needs product ids
          _opendatalayer.window.R3_CART = new _opendatalayer.window.r3_cart();
          if (_this.data.cart.products !== undefined) {
            for (var j = 0; j < _this.data.cart.products.length; j += 1) {
              var p = _this.data.cart.products[j];
              _opendatalayer.window.R3_CART.addItemId(p.productId);
            }
          }
          break;
        case 'checkout-confirmation':
          // checkout complete? pass products
          _opendatalayer.window.R3_PURCHASED = new _opendatalayer.window.r3_purchased();
          _opendatalayer.window.R3_PURCHASED.setOrderNumber(_this.data.order.id);
          if (_this.data.order.testOrder !== true && _this.data.order.products !== undefined) {
            for (var k = 0; k < _this.data.order.products.length; k += 1) {
              var _p = _this.data.order.products[k];
              _opendatalayer.window.R3_PURCHASED.addItemIdPriceQuantity(_p.productId, _p.priceData.totalBeforeDiscount, _p.quantity);
            }
          }
          break;
        default:
          // no match? don't track anything yet
          logger.log('unmatched page.type: ', _this.data.page.type);
          return;
      }

      // call RR
      _opendatalayer.window.rr_flush_onload();
      _opendatalayer.window.r3();
    });
  }

  /**
   * Init r3common tracking object based on current service config.
   */


  babelHelpers.createClass(Richrelevance, [{
    key: '_initCommon',
    value: function _initCommon() {
      if (_opendatalayer.window.r3_common === undefined) {
        logger.error('Richrelevance is not available. Aborting initialization');
        return false;
      }
      // find the right server
      var baseUrl = void 0;
      if (_opendatalayer.window.location.href.indexOf('galeria-kaufhof.de') > -1) {
        baseUrl = _opendatalayer.window.location.protocol + '//recs.richrelevance.com/rrserver/';
      } else {
        baseUrl = this.config && this.config.baseUrl ? this.config.baseUrl : _opendatalayer.window.location.protocol + '//integration.richrelevance.com/rrserver/';
      }
      logger.log('RR base url is: ', baseUrl);
      // create global rr object
      _opendatalayer.window.R3_COMMON = new _opendatalayer.window.r3_common();
      _opendatalayer.window.R3_COMMON.setApiKey(this.config.apiKey);
      _opendatalayer.window.R3_COMMON.setBaseUrl(baseUrl);
      _opendatalayer.window.R3_COMMON.setClickthruServer(_opendatalayer.window.location.protocol + '//' + _opendatalayer.window.location.host);
      _opendatalayer.window.R3_COMMON.setSessionId(__guard__(this.data.identity, function (x1) {
        return x1.bid;
      }));
      _opendatalayer.window.R3_COMMON.setUserId(__guard__(this.data.user, function (x2) {
        return x2.id;
      }) || __guard__(this.data.identity, function (x3) {
        return x3.bid;
      }));
      if (__guard__(this.config, function (x4) {
        return x4.forceDevMode;
      }) === true) {
        logger.log('Forcing RR dev mode');
        _opendatalayer.window.R3_COMMON.forceDevMode();
      }
      return true;
    }

    /**
     * Event handling callback, processes asynchronous events sent by the ODL.
     * @param  {String}  name  name/type of the event
     * @param  {Object}  data  additional data passed to this event
     */

  }, {
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      logger.log('event ' + name + ' caught', data);
      if (name === 'addtocart') {
        // re-scan cart layer for placeholders
        this._initCommon();
        if (data.layer) {
          this._scanNodeForPlaceholders(data.layer);
        }
        // handle async event in RR
        _opendatalayer.window.R3_ADDTOCART = new _opendatalayer.window.r3_addtocart();
        // pass real product data to RR
        _opendatalayer.window.R3_ADDTOCART.addItemIdToCart(data.product.productId);
        _opendatalayer.window.r3();
      }
    }

    /**
     * @deprecated
     */

  }, {
    key: 'addInitCallback',
    value: function addInitCallback(callback) {
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
     * @param  placementName {String}  placement name to listen for
     * @param  callback      {Function}  callback function to be fired (gets placement's name and data passed as arguments)
     */

  }, {
    key: 'addResponseCallback',
    value: function addResponseCallback(placementName, callback) {
      var d = this.placements ? this.placements[placementName] : null;
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
     * @param  el {HTMLElement}  DOM node to be scanned
     */

  }, {
    key: '_scanNodeForPlaceholders',
    value: function _scanNodeForPlaceholders(el) {
      var metas = (el || _opendatalayer.window.document.querySelector('html')).querySelectorAll('meta[name=gk\\:recommendation]');
      for (var i = 0; i < metas.length; i += 1) {
        _opendatalayer.window.R3_COMMON.addPlacementType(metas[i].getAttribute('content'));
      }
      /* return $('meta[name=gk\\:recommendation]', $el).each(function () {
        logger.log('found RR placement type: ', $(this).attr('content'));
        return window.R3_COMMON.addPlacementType($(this).attr('content'));
      });*/
    }
  }]);
  return Richrelevance;
}();

exports.default = Richrelevance;


function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}