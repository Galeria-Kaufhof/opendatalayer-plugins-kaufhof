'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var _rumba = require('./../lib/rumba');

var _rumba2 = babelHelpers.interopRequireDefault(_rumba);

var logger = new _opendatalayer.Logger('bsna');

/**
 * bsna ODL plugin
 *
 * Includes rumba logging library and hands over specific data to our logging backend.
 * Interface and transport data is compliant with JUMPRFC018,
 * see http://gitlab.gkh-setu.de/specs/jumprfc-018-analytics/blob/master/jumprfc-018-analytics.md
 */

// import mediaQuery from 'gk/lib/mediaQuery';

var BSNA = function () {

  /**
   * Fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @param  {ba.lib.ODL}  odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function BSNA(odl, data, config) {
    babelHelpers.classCallCheck(this, BSNA);

    logger.log('initialize');
    this.optedOut = _opendatalayer.window.localStorage.getItem('ba:optout') === '1';
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
      if (_opendatalayer.window.location.href.match(/(\?|&)trackingoptout=1/i)) {
        _opendatalayer.window.localStorage.setItem('ba:optout', '1');
      }
    } else {
      logger.log('bsna tracking opt-out is active');
    }
  }

  /**
   * Capture all async events and send them to rumba.
   * @TODO add loglevel argument to ODL
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
            var pageLoad = _rumba2.default.BAPageLoadEvent.create(data.page.type, data.page.name, 'FIXME:mediaQuery', navigationData);
            switch (data.page.type) {
              case 'productdetail':
                {
                  pageLoad.product = this.rumbaProductFromODLProductData(data.product);
                  break;
                }
              case 'checkout-confirmation':
                {
                  var lineItems = data.order.products.map(function (p) {
                    return _rumba2.default.BALineItem.create(_this.rumbaProductFromODLProductData(p), p.quantity);
                  });
                  pageLoad.order = _rumba2.default.BAOrder.create(lineItems);
                  break;
                }
              case 'category':
                {
                  if (data.brand) {
                    pageLoad.brand = this.rumbaBrandFromODLBrandData(data.brand);
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
            var e = _rumba2.default.BAProductAddedToCartEvent.create(_rumba2.default.BALineItem.create(this.rumbaProductFromODLProductData(data.product), data.quantity));
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
     * Create a JUMPRFC018-compliant product payload object from a ODLProductData object.
     * @param  {ODLProductData}  product  product data to convert
     */

  }, {
    key: 'rumbaProductFromODLProductData',
    value: function rumbaProductFromODLProductData(product) {
      return _rumba2.default.BAProduct.create(product.productId, product.variantId, product.ean, product.aonr, this.rumbaBrandFromODLBrandData(product.brandData));
    }

    /**
     * Create a JUMPRFC018-compliant brand payload object from a ODLBrandData object.
     * @param  {ODLBrandData}  brand  brand data to convert
     */

  }, {
    key: 'rumbaBrandFromODLBrandData',
    value: function rumbaBrandFromODLBrandData(brand) {
      return _rumba2.default.BABrand.create(brand.name, brand.brandKey, brand.lineKey);
    }
  }]);
  return BSNA;
}();

exports.default = BSNA;