'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var _econda = require('../lib/econda');

var _econda2 = babelHelpers.interopRequireDefault(_econda);

// TODO: fix mediaQuery dep
// import mediaQuery from 'gk/lib/mediaQuery';

var logger = new _opendatalayer.Logger('ba/lib/odl/econda');

/**
 * econda ODL plugin
 *
 * Includes econda tracking library and passes data to econda depending on
 * current pagetype and available info.
 */

var Econda = function () {

  /**
   * Fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @method constructor
   * @param  {ODL}         odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function Econda(odl, data, config) {
    var _this = this;

    babelHelpers.classCallCheck(this, Econda);

    this.odl = odl;
    this.data = data;
    this.config = config;
    logger.log('initialize');

    // strip locale code from page name (see https://jira.gkh-setu.de/browse/BSNA-954)
    this.data.page.name = this.data.page.name.replace(/^\/[a-z]{2}\-[a-zA-Z]{2}\//, '/');

    // get language id from document
    var html = _opendatalayer.window.document.querySelector('html[lang]');
    this.languageId = html ? html.getAttribute('lang').substr(0, 2) : 'de';

    // for delaying icampv events (queue, timeout handle, timeout interval)
    this.delayed = [];
    this.tDelayed = null;
    this.delayTime = 250;

    // @XXX: we need to use this ugly construct because clientID retrieval in the app works asynchronously
    if (_opendatalayer.window.gkh && _opendatalayer.window.gkh.ios) {
      _opendatalayer.window.gkh.ios.sessionIdentifier(function (err, dict) {
        if (err) {
          logger.error('error while getting visitorId and sesssionId from app: ' + err);
        } else {
          logger.log('received native session from econda:', dict.econda);
          _this.initEconda(data, config, dict.econda.visitorId, dict.econda.sessionId);
        }
      });
    } else {
      this.initEconda(data, config);
    }
  }

  /**
   * Initialize econda tracking (required as function because of async lookup in app case)
   */


  babelHelpers.createClass(Econda, [{
    key: 'initEconda',
    value: function initEconda(data, config) {
      var visitorId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var sessionId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var pageName = this.mapPageName(this.data.page.name);

      // special case: pass path segement of URL after 404 error with redirect to homepage
      if (this.data.page.type === 'homepage' && pageName === this.mapPageName('Fehlerseite')) {
        pageName += _opendatalayer.window.location.pathname;
      }

      // init tracking object
      var o = {
        pagetype: this.data.page.type,
        content: pageName,
        pageId: _opendatalayer.window.location.protocol + '//' + _opendatalayer.window.location.host + _opendatalayer.window.location.pathname
      };

      // collect econda data depending on current page type
      switch (this.data.page.type) {
        case 'category':
          // override display name with actual catgeory id (strip slashes)
          o.content = this.data.category.id.replace(/^\/|\/+$/gm, '');
          break;
        case 'search':
          o.search = [this.data.search.query, this.data.search.totalHits];
          break;
        // when "category"
        case 'productdetail':
          {
            // init product data
            var p = this.data.product;
            if (p) {
              o.ec_Event = [['view', p.ean, p.name, p.priceData.total || p.price, p.abteilungNummer ? p.abteilungNummer : p.category, p.quantity, p.aonr, p.color, p.size]];
            }
            break;
          }
        // for the  entire checkout we have to pass the orderProcess attribute to econda
        case 'checkout-cart':
          o.orderProcess = '1_basket';
          break;
        case 'checkout-login':
          o.orderProcess = '2_login';
          break;
        case 'checkout-registerFull':
          o.orderProcess = '3_customerDataNewCustomer';
          break;
        case 'checkout-registerGuest':
          o.orderProcess = '3_customerDataGuest';
          break;
        case 'checkout-delivery':
          o.orderProcess = '4_deliveryData';
          break;
        case 'checkout-payment':
          o.orderProcess = '4_paymentData';
          break;
        // TODO: pass available payment methods via content label
        case 'checkout-lastCheck':
          o.orderProcess = '5_lastCheck';
          break;
        case 'checkout-confirmation':
          o.orderProcess = '6_orderConfirmation';
          if (this.data.order) {
            var ordr = this.data.order;
            var cus = ordr.customer;
            var storeNr = cus.shippingAddress.storeNumber;
            var isStoreDelivery = storeNr ? '1' : '0';
            o.billing = [ordr.id, cus.kundennummer, cus.billingAddress.zip + '/' + cus.billingAddress.town + (ordr.testOrder === true ? '/Testuser' : ''), ordr.priceData.total, cus.loginstatus, ordr.couponCode || '', ordr.priceData.discount, ordr.paybackPoints > 0 ? '1' : '0', ordr.shipping, ordr.paymentMethod, cus.salutation, cus.birthYear, cus.kundentyp, isStoreDelivery + '/' + cus.shippingAddress.zip + '/' + cus.shippingAddress.town + (storeNr ? '/' + storeNr : ''), ordr.campaignData ? ordr.campaignData.couponCampaignNo : ''];
            o.ec_Event = [];
            for (var i = 0; i < ordr.products.length; i += 1) {
              var _p = ordr.products[i];
              o.ec_Event.push(['buy', _p.ean, _p.name, _p.priceData.totalBeforeDiscount, _p.abteilungNummer, _p.quantity, _p.aonr, _p.color, _p.size]);
            }
          } else {
            logger.error('order information missing');
          }
          break;
        default:
          break;
      }

      // set marker for customer WLAN (see https://jira.gkh-setu.de/browse/BSNA-912)
      var m3cStoreId = _opendatalayer.window.location.search.match(/(\?|&)store=([0-9]{3})/);
      if (m3cStoreId) {
        o.marker = 'storeWLAN/' + m3cStoreId[2];
      }

      // collect other non page-specific info
      if (this.data.paging && this.data.paging.actPage) {
        o.paging = this.data.paging.actPage;
      }
      if (this.data.login && this.data.login.status) {
        o.login = [[this.data.user ? this.data.user.id : '0', this.data.login.status]];
      }
      if (this.data.registration && this.data.registration.status) {
        o.register = [[this.data.user ? this.data.user.id : '0' || '0', this.data.registration.status]];
      }

      // set global properties (required for async event tracking)
      _opendatalayer.window.emosGlobalProperties = {
        siteid: this.mapSiteID(this.data.site.id),
        content: this.mapPageName(this.data.page.name)
      };

      // pass custom dimensions
      o.breakpointc = mediaQuery.currentRange; // https://jira.gkh-setu.de/browse/BSNA-1069
      o.status = this.data.user && this.data.user.id ? 'loggedIn' : 'notLoggedIn'; // https://jira.gkh-setu.de/browse/BSNA-1068

      // app case: see https://jira.gkh-setu.de/browse/BSNA-797 for details
      if (visitorId && sessionId) {
        this.setCookie('emos_jcsid', sessionId + ':1:xyz:' + new _opendatalayer.window.Date().getTime() + ';path=/;domain=.galeria-kaufhof.de');
        this.setCookie('emos_jcvid', visitorId + ':1:' + sessionId + ':' + new _opendatalayer.window.Date().getTime() + ':0:true:1;path=/;domain=.galeria-kaufhof.de;max-age=63072000');
        // cookie.set('emos_jcsid', `${sessionId}:1:xyz:${new window.Date().getTime()}`, { path: '/', domain: '.galeria-kaufhof.de' });
        // cookie.set('emos_jcvid', `${visitorId}:1:${sessionId}:${new window.Date().getTime()}:0:true:1`, { path: '/', domain: '.galeria-kaufhof.de', maxAge: 63072000 /* 60*60*24*365*2 */ });
      }

      // call econda and pass prepared tracking object (passes default data in any case)
      // pass "true" to indicate that this is the main PI request
      this.sendEcondaEvent(o, true);
    }

    /**
     * Event handling callback, processes asynchronous events sent by the ODL.
     *
     * @method handleEvent
     * @param  {String}  name  name/type of the event
     * @param  {Object}  data  additional data passed to this event
     */

  }, {
    key: 'handleEvent',
    value: function handleEvent(name, data) {
      var _this2 = this;

      logger.log('event \'' + name + '\' caught ', data);
      switch (name) {
        case 'addtocart':
          {
            var p = data.product;
            if (p) {
              return this.sendEcondaEvent({
                content: this.mapPageName(this.data.page.name.replace(/^Produkt\//, 'ZumWarenkorb/')),
                pageType: this.data.page.type,
                pageId: this.data.page.id,
                ec_Event: [['c_add', p.ean, p.name, p.priceData.total, p.abteilungNummer, p.quantity, p.aonr, p.color, p.size]]
              }, true);
            }
            logger.error('missing product info in addtocart event');
            break;
          }
        case 'teaser-click':
          this.sendEcondaEvent({ icampc: [[data]] });
          break;
        case 'teaser-view':
          {
            // XXX: for "icampv" events we use a delay feature to avoid causing an enormous
            // request overload on pages with many teasers
            if (this.delayed.length > 0) {
              // clear current timeout if queue is not empty
              clearTimeout(this.tDelayed);
            }
            this.delayed.push(data);
            // set new timeout
            this.tDelayed = setTimeout(function () {
              // send event and clear list
              _this2.sendEcondaEvent({ icampv: _this2.delayed.map(function (o) {
                  return [o];
                }) });
              _this2.delayed.length = 0;
            }, this.delayTime);
            break;
          }
        case 'login-success':
          this.sendEcondaEvent({ login: [[this.data.user ? this.data.user.id : '0', data.status || 0]] });
          break;
        case 'login-error':
          this.sendEcondaEvent({ login: [[this.data.user ? this.data.user.id : '0', data.status || 1]] });
          break;
        case 'registration-success':
          this.sendEcondaEvent({ register: [[this.data.user ? this.data.user.id : '0', data.status || 0]] });
          break;
        case 'registration-error':
          this.sendEcondaEvent({ register: [[this.data.user ? this.data.user.id : '0', data.status || 1]] });
          break;
        // workaround: see BSNA-395
        // when "product-changevariant" then @sendEcondaMarker("EVAL/Product/ChangeVariant")
        // when "product-mainimage-changed" then @sendEcondaMarker("EVAL/Product/ChangeImage/#{data.position}")
        case 'product-storeavailability-layer':
          this.sendEcondaEvent({ eventset: ['shopavailability/nozip'] });
          break;
        case 'product-storeavailability-zipcode':
          this.sendEcondaEvent({ eventset: ['shopavailability/zip/' + data.zip] });
          break;
        // new preferred way of passing generic event data to "eventset"
        case 'user-action':
          this.sendEcondaEvent({ eventset: [data] });
          break;
        case 'econda-marker':
          this.sendEcondaMarker(data);
          break;
        // @TEMP: see #BSNA-626
        case 'catalogue-pdf':
          this.sendEcondaEvent({ eventset: ['catalogue/' + data.id + '/pdf'] });
          break;
        case 'catalogue-productlist':
          this.sendEcondaEvent({ eventset: ['catalogue/' + data.id + '/productlist'] });
          break;
        default:
          break;
      }
      return false;
    }

    /**
     * Shortcut to set marker in econda (see: https://support.econda.de/display/INDE/Ziele)
     */

  }, {
    key: 'sendEcondaTarget',
    value: function sendEcondaTarget(name, value) {
      var group = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var rule = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'a';

      this.sendEcondaEvent({ Target: [group, name, value, rule] });
    }

    /**
     * Shortcut to set marker in econda (see: https://support.econda.de/display/INDE/Marker)
     */

  }, {
    key: 'sendEcondaMarker',
    value: function sendEcondaMarker(name) {
      this.sendEcondaEvent({ marker: name });
    }

    /**
     * Helper method to dispatch an emosPropertiesEvent
     *
     * @method sendEcondaEvent
     * @private
     * @param {Object}  data            data to pass to econda, defaults are siteid/countryid
     * @param {Boolean} isPageRequest   set to true to track this event as a new page request
     */

  }, {
    key: 'sendEcondaEvent',
    value: function sendEcondaEvent() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var isPageRequest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      // set default values that can be extended by data
      data.siteid = this.mapSiteID(this.data.site.id);
      data.countryid = this.config.countryId || 'de';
      data.langid = this.languageId;
      if (!isPageRequest) {
        data.type = 'event';
      }
      // pass it to econda and set global ref in window (for testing)
      logger.log('sending emosPropertiesEvent ', data);
      _opendatalayer.window.emosPropertiesEvent(data);
      _opendatalayer.window.globalEcondaObject = data;
    }

    /**
     * Map site ID according to given pattern (see https://jira.gkh-setu.de/browse/BSNA-586)
     */

  }, {
    key: 'mapSiteID',
    value: function mapSiteID(id) {
      var isApp = _opendatalayer.window._gk && _opendatalayer.window._gk.isAppContext;
      if (id === 'Shop' || id === 'jump_live') {
        return isApp ? 'iOS App' : 'Shop';
      } else {
        return isApp ? 'iOS Dev' : 'Dev';
      }
    }
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
        'Startseite': 'Homepage',
        'Fehlerseite': 'Error',
        'Suchergebnis': 'SearchResult',
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

    /**
     * Sets a cookie in document.cookie, used to enable function-wrapping in test
     */

  }, {
    key: 'setCookie',
    value: function setCookie(name, value) {
      logger.log('setCookie: setting cookie "' + name + '":', value);
      _opendatalayer.window.document.cookie = name + '=' + value + ';';
    }
  }]);
  return Econda;
}();

exports.default = Econda;