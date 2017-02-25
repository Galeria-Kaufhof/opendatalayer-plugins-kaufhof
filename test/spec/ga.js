/* eslint-disable no-underscore-dangle */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('ga', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = {
      gaProdId: 'GA-ID-PROD',
      gaDevId: 'GA-ID-DEV',
      mapPagenamesToEnglish: false,
    };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window.ga = sinon.spy();
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    // this is required for the parentNode lookup in GA's init call to work (GA
    // inserts itself right before the first script tag in the document)
    const s = mocks.odl.window.document.createElement('script');
    mocks.odl.window.document.getElementsByTagName('head')[0].appendChild(s);
    // load module
    return setupModule('./src/plugins/ga').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('init:', () => {
    it('should create a global window.ga function', () => {
      delete mocks.odl.window.ga;
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isFunction(mocks.odl.window.ga);
    });

    it('should create the GA script element and add it to the DOM', () => {
      delete mocks.odl.window.ga;
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      const el = mocks.odl.window.document.getElementsByTagName('script')[0];
      assert.equal(el.tagName.toLowerCase(), 'script');
      assert.equal(el.src, 'https://www.google-analytics.com/analytics.js');
    });

    it('should pass the base parameters (with the production account) for the site.id [jump_live]', () => {
      odlDataMock.site.id = 'jump_live';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'create', odlConfigMock.gaProdId, {
        name: 'galeria',
        cookieDomain: 'auto',
        cookieExpires: 6307200,
        allowLinker: true,
      });
    });

    /* it('should recognize when running in app context and use the supplied clientId from the app bridge in that case', () => {
      odlDataMock.site.id = 'jump_live';
      mocks.odl.window.gkh = { ios: { sessionIdentifier: callback => callback(null, { google: '123someclientid' }) } };
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'create', odlConfigMock.gaProdId, sinon.match({ clientId: '123someclientid' }));
      delete mocks.odl.window.gkh;
    });

    it('should handle errors during clientId lookup when running in app context', () => {
      odlDataMock.site.id = 'jump_live';
      mocks.odl.window.gkh = { ios: { sessionIdentifier: callback => callback('someerror') } };
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(loggerSpy.error, sinon.match('someerror'));
      delete mocks.odl.window.gkh;
    });*/

    it('should pass the base parameters (with dev account) for all other site.ids', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'create', odlConfigMock.gaDevId, {
        name: 'galeria',
        cookieDomain: 'auto',
        cookieExpires: 6307200,
        allowLinker: true,
      });
    });

    it('should activate IP anonymization', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', 'anonymizeIp', true);
    });

    it('should integrate with doubleclick', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'displayfeatures');
    });

    it('should send a pageview event', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.send', 'pageview');
    });
  });

  describe('custom dimensions:', () => {
    it('should send the pagename as [dimension1]', () => {
      odlDataMock.page.name = 'somepage';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { dimension1: 'somepage' });
    });

    it('should send the pagename as [dimension1], but without a product id if pagetype is [productdetail]', () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.page.name = 'someproduct/12345678';
      odlDataMock.product = odlDataTypes.getODLProductDataStub();
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { dimension1: 'someproduct' });
    });

    it('should translate the "Produkt" part of the article detail pagename if [mapPagenamesToEnglish] is set to true in config', () => {
      odlDataMock.page.type = 'foo';
      odlDataMock.page.name = 'Produkt/12345678';
      odlConfigMock.mapPagenamesToEnglish = true;
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { dimension1: 'product/12345678' });
    });

    it('should translate (and lowercase) the pagename if [mapPagenamesToEnglish] is set to true in config', () => {
      odlDataMock.page.type = 'foo';
      odlDataMock.page.name = 'Startseite';
      odlConfigMock.mapPagenamesToEnglish = true;
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { dimension1: 'homepage' });
    });

    it("should send the escaped UserAgent string as 'dimension2'", () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', {
        dimension2: escape(mocks.odl.window.navigator.userAgent),
      });
    });

    it('should automatically lowercase strings that get passed as dimension value', () => {
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.trackDimension('test', 'My String');
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { test: 'my string' });
    });
  });

  describe('campaign:', () => {
    it('should recognize common campaign parameters in the URL and track them', () => {
      getJSDOM().changeURL(mocks.odl.window, 'file:///someurl.foo?emsrc=somemedium&refId=somesource/campid');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', {
        campaignName: 'campid',
        campaignSource: 'somesource',
        campaignMedium: 'somemedium',
      });
    });

    it('should recognize campaign parameters with just a single value in refId in the URL and track them', () => {
      getJSDOM().changeURL(mocks.odl.window, 'file:///someurl.foo?emsrc=somemedium&refId=somesource');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', {
        campaignName: 'somesource',
        campaignSource: 'somesource',
        campaignMedium: 'somemedium',
      });
    });

    it('should recognize newsletter campaign parameters in the URL and track them', () => {
      getJSDOM().changeURL(mocks.odl.window, 'file:///someurl.foo?newsletter=newsletterbla/test2016');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', {
        campaignName: 'test2016',
        campaignSource: 'newsletterbla',
        campaignMedium: 'newsletter',
      });
    });

    it('should properly unescape newsletter campaign parameters in the URL and track them', () => {
      getJSDOM().changeURL(mocks.odl.window, 'file:///someurl.foo?newsletter=newsletterbla%2Ftest2016');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', {
        campaignName: 'test2016',
        campaignSource: 'newsletterbla',
        campaignMedium: 'newsletter',
      });
    });
  });

  describe('ecommerce:', () => {
    // helper to create an expectation (GA format) from a mock (ODLProductData)
    const createExpectationFromProduct = (product, quantity = 1, coupon = '') =>
      ({
        id: product.ean,
        name: product.name,
        category: product.abteilungNummer,
        brand: product.brand,
        variant: product.aonr,
        price: product.priceData.total,
        coupon,
        quantity,
      });

    it('should NOT load the e-commerce plugin for each page', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.neverCalledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
    });

    describe('category:', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'category';
        odlDataMock.category = odlDataTypes.getODLCategoryDataStub();
      });

      it('should override the pageName with the category id', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.set', { dimension1: odlDataMock.category.id });
      });
    });

    describe('productdetail:', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'productdetail';
        odlDataMock.product = odlDataTypes.getODLProductDataStub();
      }); // productsMock[0]

      it('should load the e-commerce plugin for pagetype [productdetail]', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
      });

      it('should add the current product and track a [detail] action', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(odlDataMock.product));
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'detail');
      });

      describe('addtocart:', () =>
        it('should add the given product and track a [add] action when receiving an addtocart event from ODL', () => {
          const p = odlDataTypes.getODLProductDataStub(23456);
          const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
          s.handleEvent('addtocart', { product: p }); // important: we intentionally add another product than on view to simulate multiple variants
          sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(p));
          sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'add');
          sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.send', 'event', 'UX', 'click', 'add to cart');
        }));
    });

    describe('checkout-cart:', () => {
      let [cart] = [];

      beforeEach(() => {
        cart = odlDataTypes.getODLCartDataStub([odlDataTypes.getODLCartProductDataStub(123), odlDataTypes.getODLCartProductDataStub(234)]);
        odlDataMock.page.type = 'checkout-cart';
        odlDataMock.cart = cart;
      });

      it('should load the e-commerce plugin for pagetype [checkout-cart]', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
      });

      it('should add all products from the cart and track the correct [checkout] action', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(cart.products[0]));
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(cart.products[1]));
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'checkout', { 'step': 1 });
      });
    });

    describe('checkout-login:', () => {
      beforeEach(() => odlDataMock.page.type = 'checkout-login');

      it('should load the e-commerce plugin for pagetype [checkout-login]', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
      });

      it('should track the correct [checkout] action', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'checkout', { step: 2 });
      });
    });

    describe('checkout-lastCheck:', () => {
      beforeEach(() => (odlDataMock.page.type = 'checkout-lastCheck'));

      it('should load the e-commerce plugin for pagetype [checkout-lastCheck]', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
      });

      it('should track the correct [checkout] action', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'checkout', { step: 3 });
      });
    });

    describe('checkout-confirmation', () => {
      let [order] = [];

      beforeEach(() => {
        // create individual order for this single test run and add it to ODL data mock
        order = odlDataTypes.getODLOrderDataStub([odlDataTypes.getODLCartProductDataStub(123), odlDataTypes.getODLCartProductDataStub(234)]);
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = order;
      });

      it('should load the e-commerce plugin for pagetype [checkout-confirmation]', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.require', 'ec');
      });

      it('should add all products from the current order and track a [purchase] action', () => {
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(order.products[0]));
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:addProduct', createExpectationFromProduct(order.products[1]));
        sinon.assert.calledWith(mocks.odl.window.ga, 'galeria.ec:setAction', 'purchase', {
          id: order.id,
          affiliation: '',
          revenue: order.priceData.total,
          tax: order.priceData.VAT,
          shipping: order.shipping,
          coupon: order.couponCode,
        });
      });
    });
  });
});