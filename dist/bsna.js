'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _mediaQuery = require('gk/lib/mediaQuery');

var _mediaQuery2 = babelHelpers.interopRequireDefault(_mediaQuery);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _localStorage = require('gk/globals/localStorage');

var _localStorage2 = babelHelpers.interopRequireDefault(_localStorage);

var _rumba = require('./../rumba');

var _rumba2 = babelHelpers.interopRequireDefault(_rumba);

var logger = new _logger2.default('ba/lib/dal/bsna');

/**
 * bsna DAL plugin
 *
 * Includes rumba logging library and hands over specific data to our logging backend.
 * Interface and transport data is compliant with JUMPRFC018,
 * see http://gitlab.gkh-setu.de/specs/jumprfc-018-analytics/blob/master/jumprfc-018-analytics.md
 */

var BSNA = function () {

  /**
   * Fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @param  {ba.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function BSNA(dal, data, config) {
    babelHelpers.classCallCheck(this, BSNA);

    logger.log('initialize');
    this.optedOut = _localStorage2.default.getItem('ba:optout') === '1';
    if (!this.optedOut) {
      logger.log('starting bsna tracking');
      // init rumba
      _rumba2.default.init({
        backend: config.backend || '/bsna/rumba/v1',
        repostOnError: false,
        pushInterval: 5,
        sessionLifetime: 1800,
        // pass bid as option
        browserId: data.identity.bid
      });
      // handle opt-out requests for rumba
      if (_window2.default.location.href.match(/(\?|&)trackingoptout=1/i)) {
        _localStorage2.default.setItem('ba:optout', '1');
      }
    } else {
      logger.log('bsna tracking opt-out is active');
    }
  }

  /**
   * Capture all async events and send them to rumba.
   * @TODO add loglevel argument to DAL
   */


  babelHelpers.createClass(BSNA, [{
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      var _this = this;

      if (this.optedOut) {
        return;
      }
      logger.log('event \'' + name + '\' caught');
      switch (name) {
        case 'initialize':
          {
            var navigationData = data.navigation ? data.navigation : { entries: [] };
            var pageLoad = _rumba2.default.BAPageLoadEvent.create(data.page.type, data.page.name, _mediaQuery2.default.currentRange, navigationData);
            switch (data.page.type) {
              case 'productdetail':
                {
                  pageLoad.product = this.rumbaProductFromDALProductData(data.product);
                  break;
                }
              case 'checkout-confirmation':
                {
                  var lineItems = data.order.products.map(function (p) {
                    return _rumba2.default.BALineItem.create(_this.rumbaProductFromDALProductData(p), p.quantity);
                  });
                  pageLoad.order = _rumba2.default.BAOrder.create(lineItems);
                  break;
                }
              case 'category':
                {
                  if (data.brand) {
                    pageLoad.brand = this.rumbaBrandFromDALBrandData(data.brand);
                  }
                  break;
                }
              default:
                break;
            }
            _rumba2.default.event(pageLoad);
            // immediately push data
            _rumba2.default.push();
            break;
          }
        case 'addtocart':
          {
            var e = _rumba2.default.BAProductAddedToCartEvent.create(_rumba2.default.BALineItem.create(this.rumbaProductFromDALProductData(data.product), data.quantity));
            _rumba2.default.event(e);
            _rumba2.default.push();
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
        default:
          {
            return;
          }
      }
    }

    /**
     * Create a JUMPRFC018-compliant product payload object from a DALProductData object.
     * @param  {DALProductData}  product  product data to convert
     */

  }, {
    key: 'rumbaProductFromDALProductData',
    value: function rumbaProductFromDALProductData(product) {
      return _rumba2.default.BAProduct.create(product.productId, product.variantId, product.ean, product.aonr, this.rumbaBrandFromDALBrandData(product.brandData));
    }

    /**
     * Create a JUMPRFC018-compliant brand payload object from a DALBrandData object.
     * @param  {DALBrandData}  brand  brand data to convert
     */

  }, {
    key: 'rumbaBrandFromDALBrandData',
    value: function rumbaBrandFromDALBrandData(brand) {
      return _rumba2.default.BABrand.create(brand.name, brand.brandKey, brand.lineKey);
    }
  }]);
  return BSNA;
}();

exports.default = BSNA;