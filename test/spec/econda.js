/* eslint-disable no-underscore-dangle, no-new, max-len */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('opendatalayer-plugins-kaufhof/econda', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // create mocks
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('homepage');
    odlConfigMock = {};
    // register mocks and overrides
    mocks = initMocks({ './src/lib/econda': {} });
    mocks.odl.window.emosPropertiesEvent = sinon.spy();
    mocks.odl.window.Date = () => ({ getTime: sinon.stub().returns(1234567890) });
    // load module
    return setupModule('./src/plugins/econda').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  const callPlugin = () => new Plugin(odlApi, odlDataMock, odlConfigMock);

  describe('startup', () => {
    it('should set the site id and pageName in the emosGlobalProperties, should pass "Shop" when site.id is "jump_live"', () => {
      odlDataMock.site.id = 'jump_live';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        siteid: 'Shop',
        content: odlDataMock.page.name,
      }));
    });

    it('should remove locale codes from ODLPageData.name', () => {
      odlDataMock.page.name = '/fo-BA/some/path/to/foo/';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ content: '/some/path/to/foo/' }));
    });

    it('should not modify ODLPageData.name if no locale code is found', () => {
      odlDataMock.page.name = '/some/path/to/foo/';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ content: '/some/path/to/foo/' }));
    });

    it('should pass the complete URL path after a 404 redirect (pageType=homepage,pageName=Fehlerseite)', () => {
      odlDataMock.page.name = 'Fehlerseite';
      odlDataMock.page.type = 'homepage';
      getJSDOM().changeURL(mocks.odl.window, 'https://example.com/path/to/previous/page?foo');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ content: 'Fehlerseite/path/to/previous/page' }));
    });

    it('should pass the complete URL path after a 404 redirect (pageType=homepage,pageName=Error)when mapPageNamesToEnglish is active', () => {
      odlDataMock.page.name = 'Error';
      odlDataMock.page.type = 'homepage';
      odlConfigMock.mapPagenamesToEnglish = true;
      getJSDOM().changeURL(mocks.odl.window, 'https://example.com/path/to/previous/page?foo');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ content: 'Error/path/to/previous/page' }));
    });

    it('should set the siteid, countryid, langid and pageName when calling sendEcondaEvent', () => {
      odlDataMock.site.id = 'jump_test';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        siteid: 'Dev',
        countryid: 'de',
        langid: 'de',
        content: odlDataMock.page.name,
      }));
    });

    it('should accept overriding the countryid via config', () => {
      odlConfigMock.countryId = 'foo';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ countryid: 'foo' }));
    });

    describe('app context', () => {
      it('should recognize when running in app context and use the supplied visitor and session id from the app bridge in that case', () => {
        odlDataMock.site.id = 'jump_live';
        const data = { econda: { sessionId: '123someSessionId', visitorId: '123someVisitorId' } };
        mocks.odl.window._gk = { isAppContext: true };
        mocks.odl.window.gkh = { ios: { sessionIdentifier: callback => callback(null, data) } };
        callPlugin();
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ siteid: 'iOS App' }));
        delete mocks.odl.window.gkh;
      });

      it('should properly write the econda cookies (to combine native and webview sessions) when running in app context', () => {
        odlDataMock.site.id = 'jump_live';
        const s = callPlugin();
        sinon.spy(s, 'setCookie');
        // we call initEconda manually here, otherwise our setCookie-wrap does not work
        s.initEconda(odlDataMock, odlConfigMock, '123someVisitorId', '123someSessionId');
        sinon.assert.calledWith(s.setCookie, 'emos_jcsid', '123someSessionId:1:xyz:1234567890;path=/;domain=.galeria-kaufhof.de');
        sinon.assert.calledWith(s.setCookie, 'emos_jcvid', '123someVisitorId:1:123someSessionId:1234567890:0:true:1;path=/;domain=.galeria-kaufhof.de;max-age=63072000');
        sinon.restore(s.setCookie);
        delete mocks.odl.window.gkh;
      });

      it('should handle errors during clientId lookup when running in app context', () => {
        mocks.odl.window.gkh = { ios: { sessionIdentifier: callback => callback('someerror') } };
        callPlugin();
        sinon.assert.calledWith(mocks.logger.error, sinon.match('someerror'));
        delete mocks.odl.window.gkh;
      });

      it('should set the siteid to "iOS App" when running inside iOS app context (Live)', () => {
        mocks.odl.window._gk = { isAppContext: true };
        odlDataMock.site.id = 'jump_live';
        callPlugin();
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ siteid: 'iOS App' }));
      });

      it('should set the siteid to "iOS Dev" when running inside iOS app context (Dev)', () => {
        mocks.odl.window._gk = { isAppContext: true };
        odlDataMock.site.id = 'jump_test';
        callPlugin();
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ siteid: 'iOS Dev' }));
      });
    });

    describe('store WLAN', () => {
      it('should send a marker when a ?store=xxx parameter is in the URL', () => {
        getJSDOM().changeURL(mocks.odl.window, 'https://example.com/?store=123');
        callPlugin();
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ marker: 'storeWLAN/123' }));
      });

      it('should send a marker when a &store=xxx parameter is in the URL', () => {
        getJSDOM().changeURL(mocks.odl.window, 'https://example.com/?foo=bar&store=123');
        callPlugin();
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ marker: 'storeWLAN/123' }));
      });
    });
  });

  describe('login/register', () => {
    it('should track a login event without a user if login status is set and user is null', () => {
      odlDataMock.login = { status: 'status' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ login: [['0', 'status']] }));
    });

    it('should track a login event with a user if login status and user id are set', () => {
      odlDataMock.login = { status: 'status' };
      odlDataMock.user = { id: 'meinuser123' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ login: [['meinuser123', 'status']] }));
    });

    it('should track a register event without a user if registration status is set and user is null', () => {
      odlDataMock.registration = { status: 'status' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ register: [['0', 'status']] }));
    });

    it('should track a register event with a user if registration status and user id are set', () => {
      odlDataMock.registration = { status: 'status' };
      odlDataMock.user = { id: 'meinuser123' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ register: [['meinuser123', 'status']] }));
    });
  });

  describe('custom dimensions', () => {
    it('should track the correct breakpoint class using the [breakpointc] dimension', () => {
      odlDataMock.kaufhof = { breakpoint: 'S_to_XXL' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        breakpointc: odlDataMock.kaufhof.breakpoint,
      }));
    });

    it('should track the login status for not logged in users using the [status] dimension', () => {
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ status: 'notLoggedIn' }));
    });

    it('should track the login status for logged in users using the [status] dimension', () => {
      odlDataMock.user = { id: 'meinuser123' };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ status: 'loggedIn' }));
    });
  });

  describe('pagetype specifics', () => {
    it('should at least track pageType/pageId/content when page.type is homepage', () => {
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: odlDataMock.page.type,
        content: odlDataMock.page.name,
      }));
    });

    it('should track search[query,totalHits] when page.type is search', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('search', 'Suche');
      odlDataMock.search = odlDataTypes.getODLSearchDataStub();
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: odlDataMock.page.type,
        content: odlDataMock.page.name,
        search: [
          odlDataMock.search.query,
          odlDataMock.search.totalHits,
        ],
      }));
    });

    it('should track category and trim slashes when page.type is category', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('category', 'Herren Hemden');
      odlDataMock.search = odlDataTypes.getODLSearchDataStub();
      odlDataMock.category = odlDataTypes.getODLCategoryDataStub();
      odlDataMock.category.id = '/some/category/id/';
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: odlDataMock.page.type,
        content: 'some/category/id',
      }));
    });

    it('should track product details when page.type is productdetail', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('productdetail', 'Produkt/1234567890');
      const p = odlDataMock.product = odlDataTypes.getODLProductDataStub(123);
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: odlDataMock.page.type,
        content: odlDataMock.page.name,
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
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-cart', 'Warenkorb');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-cart',
        content: 'Warenkorb',
        orderProcess: '1_basket',
      }));
    });

    it('should track the order process step 2_Anmeldung for page.type checkout-login', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-login', 'Anmeldung');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-login',
        content: 'Anmeldung',
        orderProcess: '2_login',
      }));
    });

    it('should track the order process step 3_Registrierung for page.type checkout-registerFull', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-registerFull', 'Registrierung');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-registerFull',
        content: 'Registrierung',
        orderProcess: '3_customerDataNewCustomer',
      }));
    });

    it('should track the order process step 3_Gastbestellung for page.type checkout-delivery', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-registerGuest', 'Gastbestellung');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-registerGuest',
        content: 'Gastbestellung',
        orderProcess: '3_customerDataGuest',
      }));
    });

    it('should track the order process step 4_Adresseingabe for page.type checkout-delivery', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-delivery', 'Adresseingabe');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-delivery',
        content: 'Adresseingabe',
        orderProcess: '4_deliveryData',
      }));
    });

    it('should track the order process step 4_Zahlungsarten for page.type checkout-payment', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-payment', 'Zahlungsarten');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-payment',
        content: 'Zahlungsarten',
        orderProcess: '4_paymentData',
      }));
    });

    it('should track the order process step 5_Bestellübersicht for page.type checkout-lastCheck', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-lastCheck', 'Bestellübersicht');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-lastCheck',
        content: 'Bestellübersicht',
        orderProcess: '5_lastCheck',
      }));
    });

    it('should track the order process step 6_Bestellbestaetigung for page.type checkout-confirmation', () => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation', 'Bestellbestätigung');
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        pagetype: 'checkout-confirmation',
        content: 'Bestellbestätigung',
        orderProcess: '6_orderConfirmation',
      }));
    });
  });

  describe('checkout confirmation page', () => {
    let [p1, p2] = [];

    beforeEach(() => {
      odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation', 'Bestellbestätigung');
      p1 = odlDataTypes.getODLProductDataStub(123);
      p2 = odlDataTypes.getODLProductDataStub(456);
      odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2]);
    });

    it('should track the order informations', () => {
      const o = odlDataMock.order;
      const c = o.customer;
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
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
      odlDataMock.order.testOrder = true;
      callPlugin();
      assert.equal(mocks.odl.window.emosPropertiesEvent.args[0][0].billing[2],
        `${odlDataMock.order.customer.billingAddress.zip}/${odlDataMock.order.customer.billingAddress.town}/Testuser`);
    });

    it('should track product informations', () => {
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
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
        odlDataMock.order.paymentMethod = 'bitcoin';
        callPlugin();
        assert.equal(mocks.odl.window.emosPropertiesEvent.args[0][0].billing[9], 'bitcoin');
      });
    });
  });

  describe('paging', () => {
    beforeEach(() => {
      odlDataMock.page = {
        type: 'home',
        name: 'Homepage',
      };
    });

    it('should not provide the paging if not set in the data', () => {
      callPlugin();
      sinon.assert.neverCalledWith(mocks.odl.window.emosPropertiesEvent, sinon.match.has('paging'));
    });

    it('should provide the paging if set in the data', () => {
      odlDataMock.paging = { actPage: 2 };
      callPlugin();
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ paging: 2 }));
    });
  });

  describe('event handling', () => {
    let es = null;
    const fakeData = { foo: 'bar' };

    beforeEach(() => {
      es = new Plugin(odlApi, odlDataMock, odlConfigMock);
    });

    it('should send data to econda when "sendEcondaEvent"" is called', () => {
      es.sendEcondaEvent({ key: 'value' });
      sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
        type: 'event',
        key: 'value',
      }));
    });

    it('should not flag the data as "type:event" when "sendEcondaEvent" is called with "true" as second argument', () => {
      es.sendEcondaEvent({ key: 'value' }, true);
      sinon.assert.neverCalledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ type: 'event' }));
    });

    describe('events', () => {
      it('should handle special event "addtocart" and track the products information', () => {
        const product = odlDataTypes.getODLProductDataStub(234);
        es.handleEvent('addtocart', { product });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
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
        odlDataMock = odlDataTypes.getODLGlobalDataStub('productdetail', 'Produkt/123123123');
        odlDataMock.page.id = 'url-zu-meiner-seite';
        odlDataMock.product = odlDataTypes.getODLProductDataStub(234);
        const _service = new Plugin(odlApi, odlDataMock, odlConfigMock);
        _service.handleEvent('addtocart', { product: odlDataMock.product });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          content: 'ZumWarenkorb/123123123',
          pageType: 'productdetail',
          pageId: 'url-zu-meiner-seite',
        }));
      });

      it('should track icampc data for special event teaser-click', () => {
        es.handleEvent('teaser-click', fakeData);
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ icampc: [[fakeData]] }));
      });

      it('should track icampv data for special event teaser-view', (done) => {
        es.handleEvent('teaser-view', fakeData);
        setTimeout(() => {
          sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ icampv: [[fakeData]] }));
          done();
        }, es.delayTime);
      });

      it('should track three consecutive calls for special event teaser-view within the same (delayed) request', (done) => {
        es.handleEvent('teaser-view', 'foo1');
        es.handleEvent('teaser-view', 'foo2');
        es.handleEvent('teaser-view', 'foo3');
        setTimeout(() => {
          sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ icampv: [['foo1'], ['foo2'], ['foo3']] }));
          done();
        }, es.delayTime);
      });

      it('should track login for special event login-success', () => {
        es.handleEvent('login-success', { status: 0 });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ login: [['0', 0]] }));
      });

      it('should track login for special event login-error', () => {
        es.handleEvent('login-error', { status: 111 });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ login: [['0', 111]] }));
      });

      it('should track login for special event registration-success', () => {
        es.handleEvent('registration-success', { status: 0 });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ register: [['0', 0]] }));
      });

      it('should track login for special event registration-error', () => {
        es.handleEvent('registration-error', { status: 123 });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({ register: [['0', 123]] }));
      });

      it('should track eventset for special event product-storeavailability-layer', () => {
        es.handleEvent('product-storeavailability-layer');
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          eventset: ['shopavailability/nozip'],
        }));
      });

      it('should track eventset for special event product-storeavailability-zipcode', () => {
        es.handleEvent('product-storeavailability-zipcode', { zip: 12345 });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          eventset: ['shopavailability/zip/12345'],
        }));
      });

      it('should track eventset for special event catalogue-pdf', () => {
        es.handleEvent('catalogue-pdf', { id: 'mycatalogueid-123' });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          eventset: ['catalogue/mycatalogueid-123/pdf'],
        }));
      });

      it('should track eventset for special event catalogue-productlist', () => {
        es.handleEvent('catalogue-productlist', { id: 'mycatalogueid-123' });
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          eventset: ['catalogue/mycatalogueid-123/productlist'],
        }));
      });

      it('should track eventset for generic user-action event', () => {
        es.handleEvent('user-action', 'userdata_as_string');
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          eventset: ['userdata_as_string'],
        }));
      });

      it('should send marker when sendEcondaMarker is called', () => {
        es.sendEcondaMarker('mein/toller/marker');
        sinon.assert.calledWith(mocks.odl.window.emosPropertiesEvent, sinon.match({
          marker: 'mein/toller/marker',
        }));
      });
    });
  });

  describe('multi-tenant hacks', () => {
    let es = null;

    beforeEach(() => {
      odlConfigMock.mapPagenamesToEnglish = true;
      es = new Plugin(odlApi, odlDataMock, odlConfigMock);
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
