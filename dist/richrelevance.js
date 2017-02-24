'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jquery = require('jquery');

var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

// import '//media.richrelevance.com/rrserver/js/1.0/p13n.js';

var logger = new _logger2.default('ba/lib/dal/richrelevance');

/**
 * richrelevance DAL plugin
 *
 * DAL service plugin for embedding richrelevance into the page. Also responsible for
 * replacing gk:recommendation meta tags with actual recommendation markup.
 *
 * @module gk.lib.dal
 * @class  richrelevance
 */

var Richrelevance = function () {

  /**
   * Init callback, fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function Richrelevance(dal, data, config) {
    var _this = this;

    babelHelpers.classCallCheck(this, Richrelevance);

    this.dal = dal;
    this.data = data;
    this.config = config;
    this.placements = {}; // object with placmement data and callbacks for each placmement id
    this.initCallbacks = [];
    this.dataReceived = false;

    // @TODO use System.import instead, once systemjs is globally available
    _window2.default.require([_window2.default.location.protocol + '//media.richrelevance.com/rrserver/js/1.2/p13n.js'], function () {
      logger.log('initialize');
      logger.log('got richrelevance serviceconfig: ', _this.config);

      var RR = _window2.default.RR;
      _this.RR = RR;

      // init r3_common object
      if (!_this._initCommon()) {
        return;
      }

      // not sure why we need to set this here. the normal usage according to the recommendation guide is to
      // do a rr_flush_onload() which does not work here unfortunately
      _window2.default.rr_onload_called = true;

      // add richrelevance async callback (fires when reco call is complete)
      RR.jsonCallback = function () {
        var n = void 0;
        logger.log('callback triggered ', RR.data.JSON.placements);
        _this.dataReceived = true;
        for (var i = 0; i < _this.initCallbacks.length; i++) {
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

      // collect placement ids from current page

      _this._scanNodeForPlaceholders((0, _jquery2.default)('html'));
      // create RR tracking objects depending on current page type
      logger.log('page.type is ', _this.data.page.type);
      switch (_this.data.page.type) {
        case 'homepage':
          new _window2.default.r3_home();
          break;
        case 'myaccount':
        case 'myaccount-overview':
        case 'myaccount-orders':
          new _window2.default.r3_personal();
          break;
        case 'service':
        case 'myaccount-logout':
          new _window2.default.r3_generic();
          break;
        case 'error':
          new _window2.default.r3_error();
          break;
        case 'search':
          // search? needs keywords and up to 15 item ids
          _window2.default.R3_SEARCH = new _window2.default.r3_search();
          _window2.default.R3_SEARCH.setTerms(_this.data.search.keywords);
          if (_this.data.search.ids !== undefined) {
            var iterable = _this.data.search.ids.split(',').slice(0, 15);
            for (var i = 0; i < iterable.length; i++) {
              var id = iterable[i];
              _window2.default.R3_SEARCH.addItemId(id);
            }
          } else {
            logger.log('search.ids not present in DAL');
          }
          break;
        case 'category':
          // category? needs id/name
          _window2.default.R3_CATEGORY = new _window2.default.r3_category();
          _window2.default.R3_CATEGORY.setId(_this.data.category.id);
          _window2.default.R3_CATEGORY.setName(_this.data.category.name);
          break;
        case 'productdetail':
          // productdetail? needs EAN and category hint in global object
          _window2.default.R3_ITEM = new _window2.default.r3_item();
          _window2.default.R3_ITEM.setId(_this.data.product.productId + ''); // HACK: we need a string to stop RR from throwing errors
          _window2.default.R3_ITEM.setName(_this.data.product.name);
          break;
        // window.R3_COMMON.addCategoryHintId @data.product.category # see https://jira.gkh-setu.de/browse/BSNA-384
        case 'brand':
          // brand page? needs brand name
          _window2.default.R3_COMMON.setPageBrand(_this.data.brand.name);
          new _window2.default.r3_brand();
          break;
        case 'checkout-cart':
          // shopping cart? needs product ids
          _window2.default.R3_CART = new _window2.default.r3_cart();
          if (_this.data.cart.products !== undefined) {
            for (var j = 0; j < _this.data.cart.products.length; j++) {
              var p = _this.data.cart.products[j];
              _window2.default.R3_CART.addItemId(p.productId);
            }
          }
          break;
        case 'checkout-confirmation':
          // checkout complete? pass products
          _window2.default.R3_PURCHASED = new _window2.default.r3_purchased();
          _window2.default.R3_PURCHASED.setOrderNumber(_this.data.order.id);
          if (_this.data.order.testOrder !== true && _this.data.order.products !== undefined) {
            for (var k = 0; k < _this.data.order.products.length; k++) {
              var _p = _this.data.order.products[k];
              _window2.default.R3_PURCHASED.addItemIdPriceQuantity(_p.productId, _p.priceData.totalBeforeDiscount, _p.quantity);
            }
          }
          break;
        default:
          // no match? don't track anything yet
          logger.log('unmatched page.type: ', _this.data.page.type);
          return;
      }

      // call RR
      _window2.default.rr_flush_onload();
      _window2.default.r3();
    });
  }

  /**
   * Init r3common tracking object based on current service config.
   */


  babelHelpers.createClass(Richrelevance, [{
    key: '_initCommon',
    value: function _initCommon() {
      if (_window2.default.r3_common === undefined) {
        logger.error('Richrelevance is not available. Aborting initialization');
        return false;
      }
      // find the right server
      var baseUrl = void 0;
      if (_window2.default.location.href.indexOf('galeria-kaufhof.de') > -1) {
        baseUrl = _window2.default.location.protocol + '//recs.richrelevance.com/rrserver/';
      } else {
        baseUrl = this.config && this.config.baseUrl ? this.config.baseUrl : _window2.default.location.protocol + '//integration.richrelevance.com/rrserver/';
      }
      logger.log('RR base url is: ', baseUrl);
      // create global rr object
      _window2.default.R3_COMMON = new _window2.default.r3_common();
      _window2.default.R3_COMMON.setApiKey(this.config.apiKey);
      _window2.default.R3_COMMON.setBaseUrl(baseUrl);
      _window2.default.R3_COMMON.setClickthruServer(_window2.default.location.protocol + '//' + _window2.default.location.host);
      _window2.default.R3_COMMON.setSessionId(__guard__(this.data.identity, function (x1) {
        return x1.bid;
      }));
      _window2.default.R3_COMMON.setUserId(__guard__(this.data.user, function (x2) {
        return x2.id;
      }) || __guard__(this.data.identity, function (x3) {
        return x3.bid;
      }));
      if (__guard__(this.config, function (x4) {
        return x4.forceDevMode;
      }) === true) {
        logger.log('Forcing RR dev mode');
        _window2.default.R3_COMMON.forceDevMode();
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
        _window2.default.R3_ADDTOCART = new r3_addtocart();
        // pass real product data to RR
        _window2.default.R3_ADDTOCART.addItemIdToCart(data.product.productId);
        r3();
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
     *
     * @method addResponseCallback
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
     *
     * @method _scanNodeForPlaceholder
     * @private
     * @param  $el {jQuery}  DOM node to be scanned
     */

  }, {
    key: '_scanNodeForPlaceholders',
    value: function _scanNodeForPlaceholders($el) {
      return (0, _jquery2.default)('meta[name=gk\\:recommendation]', $el).each(function () {
        logger.log('found RR placement type: ', (0, _jquery2.default)(this).attr('content'));
        return _window2.default.R3_COMMON.addPlacementType((0, _jquery2.default)(this).attr('content'));
      });
    }
  }]);
  return Richrelevance;
}();

exports.default = Richrelevance;


function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}