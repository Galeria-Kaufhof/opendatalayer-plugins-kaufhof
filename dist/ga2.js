'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var logger = new _logger2.default('ba/lib/dal/ga2');

/**
 * Google Analytics pixel DAL plugin
 *
 * @module   ba.lib.dal.ga2
 * @class    GoogleAnalytics2
 * @implements  IDALService
 */

var GoogleAnalytics2 = function () {
  function GoogleAnalytics2(dal, data, config) {
    babelHelpers.classCallCheck(this, GoogleAnalytics2);

    logger.log('initialize', config);
    this.config = config;

    var document = _window2.default.document;

    // GA snippet (we simply include the official code here)
    if (!_window2.default.ga) {
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function () {
          (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();a = s.createElement(o), m = s.getElementsByTagName(o)[0];a.async = 1;a.src = g;m.parentNode.insertBefore(a, m);
      })(_window2.default, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    }

    // @XXX: we need to use this ugly construct because clientID retrieval in the app works asynchronously
    this.initGA(data, config);
  }

  // Initialize GA tracking


  babelHelpers.createClass(GoogleAnalytics2, [{
    key: 'initGA',
    value: function initGA(data, config) {
      var clientId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var uaId = data.site.id === 'jump_live' ? config.gaProdId : config.gaDevId;
      var gaConfig = {
        name: 'galeria', // individual tracker name to avoid conflicts with existing implementation
        cookieDomain: 'auto', // set cookie domain to highest possible domain
        cookieExpires: 6307200, // 2 years
        allowLinker: true };

      // override the clientId if in App context
      if (clientId) {
        gaConfig.clientId = clientId;
      }

      _window2.default.ga('create', uaId, gaConfig);
      _window2.default.ga('galeria.set', 'anonymizeIp', true);
      _window2.default.ga('galeria.require', 'displayfeatures');

      // load ecommerce plugin for certain pages
      if (data.page.type === 'productdetail' || data.page.type === 'checkout-cart' || data.page.type === 'checkout-login' || data.page.type === 'checkout-lastCheck' || data.page.type === 'checkout-confirmation') {
        _window2.default.ga('galeria.require', 'ec');
      }

      // page-specific actions
      var pageName = this.mapPageName(data.page.name);
      switch (data.page.type) {
        case 'category':
          pageName = data.category.id;
          break;
        case 'productdetail':
          pageName = data.page.name.replace(/\/[0-9]{8,}$/, '');
          // track product view
          this.ecAddProduct(data.product);
          _window2.default.ga('galeria.ec:setAction', 'detail');
          break;
        case 'checkout-cart':
          for (var i = 0; i < data.cart.products.length; i++) {
            this.ecAddProduct(data.cart.products[i]);
          }
          _window2.default.ga('galeria.ec:setAction', 'checkout', { step: 1 });
          break;
        case 'checkout-login':
          _window2.default.ga('galeria.ec:setAction', 'checkout', { step: 2 });
          break;
        case 'checkout-lastCheck':
          _window2.default.ga('galeria.ec:setAction', 'checkout', { step: 3 });
          break;
        case 'checkout-confirmation':
          {
            var o = data.order;
            // track purchase
            for (var j = 0; j < o.products.length; j += 1) {
              var product = o.products[j];
              this.ecAddProduct(product, product.quantity);
            }
            _window2.default.ga('galeria.ec:setAction', 'purchase', {
              id: o.id,
              affiliation: '',
              revenue: o.priceData.total,
              tax: o.priceData.VAT,
              shipping: o.shipping,
              coupon: o.couponCode
            });
            break;
          }
        default:
          break;
      }

      // track custom dimensions
      this.trackDimension('dimension1', pageName);
      this.trackDimension('dimension2', escape(_window2.default.navigator.userAgent), true);

      // handle campaign tracking
      this.trackCampaign();

      // send pageview
      _window2.default.ga('galeria.send', 'pageview');
    }

    // runtime event handling

  }, {
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      if (name === 'addtocart') {
        // see https://jira.gkh-setu.de/browse/BSNA-716 for details
        this.ecAddProduct(data.product);
        _window2.default.ga('galeria.ec:setAction', 'add');
        return _window2.default.ga('galeria.send', 'event', 'UX', 'click', 'add to cart');
      }
      return false;
    }

    // track a custom dimension (lowercases if keepCase isn't set)

  }, {
    key: 'trackDimension',
    value: function trackDimension(name, value) {
      var keepCase = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var d = {};
      d[name] = typeof value === 'string' && keepCase !== true ? value.toLowerCase() : value;
      return _window2.default.ga('galeria.set', d);
    }

    // track a campaign (reads custom flags from URL and sets campaign as needed)

  }, {
    key: 'trackCampaign',
    value: function trackCampaign() {
      // get URL params
      var query = {};
      var q = _window2.default.location.search.substring(1);
      var iterable = q.split('&');
      for (var i = 0; i < iterable.length; i += 1) {
        var chunk = iterable[i];
        var pair = chunk.split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      // read campaign data
      var medium = query.emsrc;
      var campaignData = __guard__(query.refId, function (x) {
        return x.split('/');
      });
      var newsletterData = query.newsletter;
      if (medium && __guard__(campaignData, function (x1) {
        return x1.length;
      }) || __guard__(newsletterData, function (x2) {
        return x2.length;
      }) > 1) {
        // track campaign infos using galeria.set
        var nlCampaign = newsletterData ? newsletterData.split('/', 2) : '';
        return _window2.default.ga('galeria.set', {
          campaignName: __guard__(newsletterData ? nlCampaign[1] : campaignData[1] ? campaignData[1] : campaignData[0], function (x3) {
            return x3.toLowerCase();
          }),
          campaignSource: __guard__(newsletterData ? nlCampaign[0] : campaignData[0], function (x4) {
            return x4.toLowerCase();
          }),
          campaignMedium: __guard__(newsletterData ? 'newsletter' : medium, function (x5) {
            return x5.toLowerCase();
          })
        });
      }
      return true;
    }

    // add a product to the ecommerce tracking (just adds Product, does not send any action)

  }, {
    key: 'ecAddProduct',
    value: function ecAddProduct(product) {
      var quantity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var couponCode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      // see https://jira.gkh-setu.de/browse/BSNA-716 for details
      return _window2.default.ga('galeria.ec:addProduct', {
        id: product.ean,
        name: product.name,
        category: product.abteilungNummer,
        brand: product.brand,
        variant: product.aonr,
        price: product.priceData.total,
        coupon: couponCode,
        quantity: quantity
      });
    }

    // @FIXME: pagename mapping, required until all analytics reports and data are translated to english

  }, {
    key: 'mapPageName',
    value: function mapPageName(name) {
      if (!this.config.mapPagenamesToEnglish) {
        return name;
      }
      // dynamic replacements (changes parts)
      var repl = [[/^ZumWarenkorb\//g, 'AddToCart/'], [/^Produkt\//g, 'Product/']];
      repl.forEach(function (r) {
        return name = name.replace(r[0], r[1]);
      });
      // fixed mappings
      var map = {
        Startseite: 'Homepage',
        Fehlerseite: 'Error',
        Suchergebnis: 'SearchResult',
        'Bestellprozess/Warenkorb': 'Checkout/Basket',
        'Bestellprozess/Login': 'Checkout/Login',
        'Bestellprozess/Gastbestellung': 'Checkout/CustomerDataGuest',
        'Bestellprozess/Registrierung': 'Checkout/CustomerDataNewCustomer',
        'Bestellprozess/Lieferung': 'Checkout/DeliveryData',
        'Bestellprozess/Zahlungsart': 'Checkout/PaymentData',
        'Bestellprozess/Pruefen': 'Checkout/LastCheck',
        'Bestellprozess/Bestaetigung': 'Checkout/OrderConfirmation'
      };
      if (typeof map[name] !== 'undefined') {
        return map[name];
      }
      return name;
    }
  }]);
  return GoogleAnalytics2;
}();

exports.default = GoogleAnalytics2;


function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}