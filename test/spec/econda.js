/* eslint-disable no-underscore-dangle, no-new, max-len */

import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import mockModule from './../../_mockModule';
import * as dalDataTypes from './../../../mocks/dalDataTypes';

describe('ba/lib/dal/econda', () => {
  let [Service, windowMock, mediaQueryMock, loggerSpy, cookieSpy, dalApi, dalDataMock, dalConfigMock] = [];

  beforeEach((done) => {
    // create mocks
    windowMock = {
      document: {
        querySelector: function querySelector() {
          return { getAttribute: () => 'de' };
        },
      },
      location: {
        protocol: 'http:',
        host: 'localhost',
        pathname: '/econdaService',
        search: '',
      },
      emosPropertiesEvent: sinon.spy(),
      Date() {
        return {
          getTime() {
            return 1234567890;
          },
        };
      },
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('homepage');
    dalConfigMock = {};
    mediaQueryMock = { currentRange: 'L_to_XXL' };
    // create spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    cookieSpy = { set: sinon.spy(), get: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', windowMock);
    mockModule('ba/vendor/econda', {});
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('gk/vendor/cookie', cookieSpy);
    mockModule('gk/lib/mediaQuery', mediaQueryMock);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/econda'));
    System.import('ba/lib/dal/econda').then((m) => {
      Service = m.default;
      done();
    }).catch((err) => { console.error(err); });
  });

  const callService = () => new Service(dalApi, dalDataMock, dalConfigMock);

  describe('startup', () => {
    it('should set the site id and pageName in the emosGlobalProperties, should pass "Shop" when site.id is "jump_live"', () => {
      dalDataMock.site.id = 'jump_live';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        siteid: 'Shop',
        content: dalDataMock.page.name,
      }));
    });

    it('should remove locale codes from DALPageData.name', () => {
      dalDataMock.page.name = '/fo-BA/some/path/to/foo/';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ content: '/some/path/to/foo/' }));
    });

    it('should not modify DALPageData.name if no locale code is found', () => {
      dalDataMock.page.name = '/some/path/to/foo/';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ content: '/some/path/to/foo/' }));
    });

    it('should pass the complete URL path after a 404 redirect (pageType=homepage,pageName=Fehlerseite)', () => {
      dalDataMock.page.name = 'Fehlerseite';
      dalDataMock.page.type = 'homepage';
      windowMock.location.pathname = '/path/to/previous/page';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ content: 'Fehlerseite/path/to/previous/page' }));
    });

    it('should pass the complete URL path after a 404 redirect (pageType=homepage,pageName=Error)when mapPageNamesToEnglish is active', () => {
      dalDataMock.page.name = 'Error';
      dalDataMock.page.type = 'homepage';
      dalConfigMock.mapPagenamesToEnglish = true;
      windowMock.location.pathname = '/path/to/previous/page';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ content: 'Error/path/to/previous/page' }));
    });

    it('should set the siteid, countryid, langid and pageName when calling sendEcondaEvent', () => {
      dalDataMock.site.id = 'jump_test';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        siteid: 'Dev',
        countryid: 'de',
        langid: 'de',
        content: dalDataMock.page.name,
      }));
    });

    it('should accept overriding the countryid via config', () => {
      dalConfigMock.countryId = 'foo';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ countryid: 'foo' }));
    });

    describe('app context', () => {
      it('should recognize when running in app context and use the supplied visitor and session id from the app bridge in that case', () => {
        dalDataMock.site.id = 'jump_live';
        const data = { econda: { sessionId: '123someSessionId', visitorId: '123someVisitorId' } };
        windowMock._gk = { isAppContext: true };
        windowMock.gkh = { ios: { sessionIdentifier: callback => callback(null, data) } };
        callService();
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ siteid: 'iOS App' }));
        delete windowMock.gkh;
      });

      it('should properly write the econda cookies (to combine native and webview sessions) when running in app context', () => {
        dalDataMock.site.id = 'jump_live';
        const s = callService();
        sinon.spy(s, 'setCookie');
        // we call initEconda manually here, otherwise our setCookie-wrap does not work
        s.initEconda(dalDataMock, dalConfigMock, '123someVisitorId', '123someSessionId');
        sinon.assert.calledWith(s.setCookie, 'emos_jcsid', '123someSessionId:1:xyz:1234567890;path=/;domain=.galeria-kaufhof.de');
        sinon.assert.calledWith(s.setCookie, 'emos_jcvid', '123someVisitorId:1:123someSessionId:1234567890:0:true:1;path=/;domain=.galeria-kaufhof.de;max-age=63072000');
        sinon.restore(s.setCookie);
        delete windowMock.gkh;
      });

      it('should handle errors during clientId lookup when running in app context', () => {
        windowMock.gkh = { ios: { sessionIdentifier: callback => callback('someerror') } };
        callService();
        sinon.assert.calledWith(loggerSpy.error, sinon.match('someerror'));
        delete windowMock.gkh;
      });

      it('should set the siteid to "iOS App" when running inside iOS app context (Live)', () => {
        windowMock._gk = { isAppContext: true };
        dalDataMock.site.id = 'jump_live';
        callService();
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ siteid: 'iOS App' }));
      });

      it('should set the siteid to "iOS Dev" when running inside iOS app context (Dev)', () => {
        windowMock._gk = { isAppContext: true };
        dalDataMock.site.id = 'jump_test';
        callService();
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ siteid: 'iOS Dev' }));
      });
    });

    describe('store WLAN', () => {
      it('should send a marker when a ?store=xxx parameter is in the URL', () => {
        windowMock.location.search = '?store=123';
        callService();
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ marker: 'storeWLAN/123' }));
      });

      it('should send a marker when a &store=xxx parameter is in the URL', () => {
        windowMock.location.search = '?foo=bar&store=123';
        callService();
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ marker: 'storeWLAN/123' }));
      });
    });
  });

  describe('login/register', () => {
    it('should track a login event without a user if login status is set and user is null', () => {
      dalDataMock.login = { status: 'status' };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ login: [['0', 'status']] }));
    });

    it('should track a login event with a user if login status and user id are set', () => {
      dalDataMock.login = { status: 'status' };
      dalDataMock.user = { id: 'meinuser123' };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ login: [['meinuser123', 'status']] }));
    });

    it('should track a register event without a user if registration status is set and user is null', () => {
      dalDataMock.registration = { status: 'status' };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ register: [['0', 'status']] }));
    });

    it('should track a register event with a user if registration status and user id are set', () => {
      dalDataMock.registration = { status: 'status' };
      dalDataMock.user = { id: 'meinuser123' };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ register: [['meinuser123', 'status']] }));
    });
  });

  describe('custom dimensions', () => {
    it('should track the correct breakpoint class using the [breakpointc] dimension', () => {
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        breakpointc: mediaQueryMock.currentRange,
      }));
    });

    it('should track the login status for not logged in users using the [status] dimension', () => {
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ status: 'notLoggedIn' }));
    });

    it('should track the login status for logged in users using the [status] dimension', () => {
      dalDataMock.user = { id: 'meinuser123' };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ status: 'loggedIn' }));
    });
  });

  describe('pagetype specifics', () => {
    it('should at least track pageType/pageId/content when page.type is homepage', () => {
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: dalDataMock.page.type,
        content: dalDataMock.page.name,
      }));
    });

    it('should track search[query,totalHits] when page.type is search', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('search', 'Suche');
      dalDataMock.search = dalDataTypes.getDALSearchDataStub();
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: dalDataMock.page.type,
        content: dalDataMock.page.name,
        search: [
          dalDataMock.search.query,
          dalDataMock.search.totalHits,
        ],
      }));
    });

    it('should track category and trim slashes when page.type is category', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('category', 'Herren Hemden');
      dalDataMock.search = dalDataTypes.getDALSearchDataStub();
      dalDataMock.category = dalDataTypes.getDALCategoryDataStub();
      dalDataMock.category.id = '/some/category/id/';
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: dalDataMock.page.type,
        content: 'some/category/id',
      }));
    });

    it('should track product details when page.type is productdetail', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('productdetail', 'Produkt/1234567890');
      const p = dalDataMock.product = dalDataTypes.getDALProductDataStub(123);
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: dalDataMock.page.type,
        content: dalDataMock.page.name,
        ec_Event: [[
          'view',
          p.ean,
          p.name,
          p.priceData.total,
          p.abteilungNummer,
          p.quantity,
          p.aonr,
          p.color,
          p.size,
        ]],
      }));
    });
  });

  describe('order steps', () => {
    it('should track the order process step 1_Warenkorb for page.type checkout-cart', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-cart', 'Warenkorb');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-cart',
        content: 'Warenkorb',
        orderProcess: '1_basket',
      }));
    });

    it('should track the order process step 2_Anmeldung for page.type checkout-login', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-login', 'Anmeldung');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-login',
        content: 'Anmeldung',
        orderProcess: '2_login',
      }));
    });

    it('should track the order process step 3_Registrierung for page.type checkout-registerFull', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-registerFull', 'Registrierung');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-registerFull',
        content: 'Registrierung',
        orderProcess: '3_customerDataNewCustomer',
      }));
    });

    it('should track the order process step 3_Gastbestellung for page.type checkout-delivery', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-registerGuest', 'Gastbestellung');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-registerGuest',
        content: 'Gastbestellung',
        orderProcess: '3_customerDataGuest',
      }));
    });

    it('should track the order process step 4_Adresseingabe for page.type checkout-delivery', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-delivery', 'Adresseingabe');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-delivery',
        content: 'Adresseingabe',
        orderProcess: '4_deliveryData',
      }));
    });

    it('should track the order process step 4_Zahlungsarten for page.type checkout-payment', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-payment', 'Zahlungsarten');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-payment',
        content: 'Zahlungsarten',
        orderProcess: '4_paymentData',
      }));
    });

    it('should track the order process step 5_Bestellübersicht for page.type checkout-lastCheck', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-lastCheck', 'Bestellübersicht');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-lastCheck',
        content: 'Bestellübersicht',
        orderProcess: '5_lastCheck',
      }));
    });

    it('should track the order process step 6_Bestellbestaetigung for page.type checkout-confirmation', () => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation', 'Bestellbestätigung');
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-confirmation',
        content: 'Bestellbestätigung',
        orderProcess: '6_orderConfirmation',
      }));
    });
  });

  describe('checkout confirmation page', () => {
    let [p1, p2] = [];

    beforeEach(() => {
      dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation', 'Bestellbestätigung');
      p1 = dalDataTypes.getDALProductDataStub(123);
      p2 = dalDataTypes.getDALProductDataStub(456);
      dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2]);
    });

    it('should track the order informations', () => {
      const o = dalDataMock.order;
      const c = o.customer;
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        billing: [
          o.id,
          c.kundennummer,
          `${c.billingAddress.zip}/${c.billingAddress.town}`,
          o.priceData.total,
          c.loginstatus,
          o.couponCode,
          o.priceData.discount,
          o.paybackPoints > 0 ? '1' : '0',
          o.shipping,
          o.paymentMethod,
          c.salutation,
          c.birthYear,
          c.kundentyp,
          `0/${c.shippingAddress.zip}/${c.shippingAddress.town}`,
          o.campaignData.couponCampaignNo,
        ],
      }));
    });

    it("should suffix the billing address with '/Testuser' in case of test orders", () => {
      dalDataMock.order.testOrder = true;
      callService();
      assert.equal(
        windowMock.emosPropertiesEvent.args[0][0].billing[2],
        `${dalDataMock.order.customer.billingAddress.zip}/${dalDataMock.order.customer.billingAddress.town}/Testuser`
      );
    });

    it('should track product informations', () => {
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        ec_Event: [
          [
            'buy',
            p1.ean,
            p1.name,
            p1.priceData.totalBeforeDiscount,
            p1.abteilungNummer,
            p1.quantity,
            p1.aonr,
            p1.color,
            p1.size,
          ],
          [
            'buy',
            p2.ean,
            p2.name,
            p2.priceData.totalBeforeDiscount,
            p2.abteilungNummer,
            p2.quantity,
            p2.aonr,
            p2.color,
            p2.size,
          ],
        ],
      }));
    });

    describe('payment methods', () => {
      it('properly hands over any provided payment method', () => {
        dalDataMock.order.paymentMethod = 'bitcoin';
        callService();
        assert.equal(windowMock.emosPropertiesEvent.args[0][0].billing[9], 'bitcoin');
      });
    });
  });

  describe('paging', () => {
    beforeEach(() => {
      dalDataMock.page = {
        type: 'home',
        name: 'Homepage',
      };
    });

    it('should not provide the paging if not set in the data', () => {
      callService();
      sinon.assert.neverCalledWith(windowMock.emosPropertiesEvent, sinon.match.has('paging'));
    });

    it('should provide the paging if set in the data', () => {
      dalDataMock.paging = { actPage: 2 };
      callService();
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ paging: 2 }));
    });
  });

  describe('event handling', () => {
    let es = null;
    const fakeData = { foo: 'bar' };

    beforeEach(() => {
      es = new Service(dalApi, dalDataMock, dalConfigMock);
    });

    it('should send data to econda when "sendEcondaEvent"" is called', () => {
      es.sendEcondaEvent({ key: 'value' });
      sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
        type: 'event',
        key: 'value',
      }));
    });

    it('should not flag the data as "type:event" when "sendEcondaEvent" is called with "true" as second argument', () => {
      es.sendEcondaEvent({ key: 'value' }, true);
      sinon.assert.neverCalledWith(windowMock.emosPropertiesEvent, sinon.match({ type: 'event' }));
    });

    describe('events', () => {
      it('should handle special event "addtocart" and track the products information', () => {
        const product = dalDataTypes.getDALProductDataStub(234);
        es.handleEvent('addtocart', { product });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          ec_Event: [[
            'c_add',
            product.ean,
            product.name,
            product.priceData.total,
            product.abteilungNummer,
            product.quantity,
            product.aonr,
            product.color,
            product.size,
          ]],
        }));
      });

      it('should track special event "addtocart" as new page impression', () => {
        dalDataMock = dalDataTypes.getDALGlobalDataStub('productdetail', 'Produkt/123123123');
        dalDataMock.page.id = 'url-zu-meiner-seite';
        dalDataMock.product = dalDataTypes.getDALProductDataStub(234);
        const _service = new Service(dalApi, dalDataMock, dalConfigMock);
        _service.handleEvent('addtocart', { product: dalDataMock.product });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          content: 'ZumWarenkorb/123123123',
          pageType: 'productdetail',
          pageId: 'url-zu-meiner-seite',
        }));
      });

      it('should track icampc data for special event teaser-click', () => {
        es.handleEvent('teaser-click', fakeData);
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ icampc: [[fakeData]] }));
      });

      it('should track icampv data for special event teaser-view', (done) => {
        es.handleEvent('teaser-view', fakeData);
        setTimeout(() => {
          sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ icampv: [[fakeData]] }));
          done();
        }, es.delayTime);
      });

      it('should track three consecutive calls for special event teaser-view within the same (delayed) request', (done) => {
        es.handleEvent('teaser-view', 'foo1');
        es.handleEvent('teaser-view', 'foo2');
        es.handleEvent('teaser-view', 'foo3');
        setTimeout(() => {
          sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ icampv: [['foo1'], ['foo2'], ['foo3']] }));
          done();
        }, es.delayTime);
      });

      it('should track login for special event login-success', () => {
        es.handleEvent('login-success', { status: 0 });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ login: [['0', 0]] }));
      });

      it('should track login for special event login-error', () => {
        es.handleEvent('login-error', { status: 111 });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ login: [['0', 111]] }));
      });

      it('should track login for special event registration-success', () => {
        es.handleEvent('registration-success', { status: 0 });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ register: [['0', 0]] }));
      });

      it('should track login for special event registration-error', () => {
        es.handleEvent('registration-error', { status: 123 });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({ register: [['0', 123]] }));
      });

      it('should track eventset for special event product-storeavailability-layer', () => {
        es.handleEvent('product-storeavailability-layer');
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          eventset: ['shopavailability/nozip'],
        }));
      });

      it('should track eventset for special event product-storeavailability-zipcode', () => {
        es.handleEvent('product-storeavailability-zipcode', { zip: 12345 });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          eventset: ['shopavailability/zip/12345'],
        }));
      });

      it('should track eventset for special event catalogue-pdf', () => {
        es.handleEvent('catalogue-pdf', { id: 'mycatalogueid-123' });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          eventset: ['catalogue/mycatalogueid-123/pdf'],
        }));
      });

      it('should track eventset for special event catalogue-productlist', () => {
        es.handleEvent('catalogue-productlist', { id: 'mycatalogueid-123' });
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          eventset: ['catalogue/mycatalogueid-123/productlist'],
        }));
      });

      it('should track eventset for generic user-action event', () => {
        es.handleEvent('user-action', 'userdata_as_string');
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          eventset: ['userdata_as_string'],
        }));
      });

      it('should send marker when sendEcondaMarker is called', () => {
        es.sendEcondaMarker('mein/toller/marker');
        sinon.assert.calledWith(windowMock.emosPropertiesEvent, sinon.match({
          marker: 'mein/toller/marker',
        }));
      });
    });
  });

  describe('multi-tenant hacks', () => {
    let es = null;

    beforeEach(() => {
      dalConfigMock.mapPagenamesToEnglish = true;
      es = new Service(dalApi, dalDataMock, dalConfigMock);
    });

    it('should apply the expected mappings when calling mapPageName', () => {
      assert.equal(es.mapPageName('Startseite'), 'Homepage');
      assert.equal(es.mapPageName('Suchergebnis'), 'SearchResult');
      assert.equal(es.mapPageName('Fehlerseite'), 'Error');
      assert.equal(es.mapPageName('Bestellprozess/Warenkorb'), 'Checkout/Basket');
      assert.equal(es.mapPageName('Bestellprozess/Login'), 'Checkout/Login');
      assert.equal(es.mapPageName('Bestellprozess/Gastbestellung'), 'Checkout/CustomerDataGuest');
      assert.equal(es.mapPageName('Bestellprozess/Registrierung'), 'Checkout/CustomerDataNewCustomer');
      assert.equal(es.mapPageName('Bestellprozess/Lieferung'), 'Checkout/DeliveryData');
      assert.equal(es.mapPageName('Bestellprozess/Zahlungsart'), 'Checkout/PaymentData');
      assert.equal(es.mapPageName('Bestellprozess/Pruefen'), 'Checkout/LastCheck');
      assert.equal(es.mapPageName('Bestellprozess/Bestaetigung'), 'Checkout/OrderConfirmation');
      assert.equal(es.mapPageName('Produkt/1234567890'), 'Product/1234567890');
      assert.equal(es.mapPageName('ZumWarenkorb/1234567890'), 'AddToCart/1234567890');
    });

    it('should return the provided value if no mapping is found', () => {
      assert.equal(es.mapPageName('someshizzle/foo'), 'someshizzle/foo');
    });
  });
});
