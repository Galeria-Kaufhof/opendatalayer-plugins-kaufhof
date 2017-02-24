/* eslint-disable no-new */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import * as dalDataTypes from './../../../mocks/dalDataTypes';
import mockModule from './../../_mockModule';
import domMock from './../../../mocks/domMockES6';

describe('ba/lib/dal/ga2', () => {
  let [windowSpy, loggerSpy, Service, dalApi, dalDataMock, dalConfigMock] = [];

  beforeEach((done) => {
    windowSpy = domMock;
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    windowSpy.ga = sinon.spy(); // custom 'ga' mock to ease tests
    loggerSpy = { log: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock = {
      gaProdId: 'GA-ID-PROD',
      gaDevId: 'GA-ID-DEV',
      mapPagenamesToEnglish: false,
    };
    // register mocks
    mockModule('gk/globals/window', windowSpy);
    mockModule('gk/lib/logger', () => loggerSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/ga2'));
    System.import('ba/lib/dal/ga2').then((m) => {
      Service = m.default;
      done();
    }).catch((err) => { console.error(err); });
  });

  describe('init:', () => {
    /* it('should create a global window.ga function', () => {
      delete windowSpy.ga;
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isFunction(windowSpy.ga);
    });

    it('should create the GA script element and add it to the DOM', () => {
      delete windowSpy.ga;
      new Service(dalApi, dalDataMock, dalConfigMock);
      const el = windowSpy.getElementsByTagName('HEAD')[0];
      assert.isDefined(head.childNodes[0]);
      assert.equal(el.tagName, 'script');
      assert.equal(el.src, '//www.google-analytics.com/analytics.js');
    });*/

    it('should pass the base parameters (with the production account) for the site.id [jump_live]', () => {
      dalDataMock.site.id = 'jump_live';
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'create', dalConfigMock.gaProdId, {
        name: 'galeria',
        cookieDomain: 'auto',
        cookieExpires: 6307200,
        allowLinker: true,
      });
    });

    /* it('should recognize when running in app context and use the supplied clientId from the app bridge in that case', () => {
      dalDataMock.site.id = 'jump_live';
      windowSpy.gkh = { ios: { sessionIdentifier: callback => callback(null, { google: '123someclientid' }) } };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'create', dalConfigMock.gaProdId, sinon.match({ clientId: '123someclientid' }));
      delete windowSpy.gkh;
    });

    it('should handle errors during clientId lookup when running in app context', () => {
      dalDataMock.site.id = 'jump_live';
      windowSpy.gkh = { ios: { sessionIdentifier: callback => callback('someerror') } };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(loggerSpy.error, sinon.match('someerror'));
      delete windowSpy.gkh;
    });*/

    it('should pass the base parameters (with dev account) for all other site.ids', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'create', dalConfigMock.gaDevId, {
        name: 'galeria',
        cookieDomain: 'auto',
        cookieExpires: 6307200,
        allowLinker: true,
      });
    });

    it('should activate IP anonymization', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', 'anonymizeIp', true);
    });

    it('should integrate with doubleclick', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'displayfeatures');
    });

    it('should send a pageview event', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.send', 'pageview');
    });
  });

  describe('custom dimensions:', () => {
    it('should send the pagename as [dimension1]', () => {
      dalDataMock.page.name = 'somepage';
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { dimension1: 'somepage' });
    });

    it('should send the pagename as [dimension1], but without a product id if pagetype is [productdetail]', () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.page.name = 'someproduct/12345678';
      dalDataMock.product = dalDataTypes.getDALProductDataStub();
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { dimension1: 'someproduct' });
    });

    it('should translate the "Produkt" part of the article detail pagename if [mapPagenamesToEnglish] is set to true in config', () => {
      dalDataMock.page.type = 'foo';
      dalDataMock.page.name = 'Produkt/12345678';
      dalConfigMock.mapPagenamesToEnglish = true;
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { dimension1: 'product/12345678' });
    });

    it('should translate (and lowercase) the pagename if [mapPagenamesToEnglish] is set to true in config', () => {
      dalDataMock.page.type = 'foo';
      dalDataMock.page.name = 'Startseite';
      dalConfigMock.mapPagenamesToEnglish = true;
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { dimension1: 'homepage' });
    });

    it("should send the escaped UserAgent string as 'dimension2'", () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', {
        dimension2: escape(windowSpy.navigator.userAgent),
      });
    });

    it('should automatically lowercase strings that get passed as dimension value', () => {
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.trackDimension('test', 'My String');
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { test: 'my string' });
    });
  });

  describe('campaign:', () => {
    it('should recognize common campaign parameters in the URL and track them', () => {
      windowSpy.location = { search: '?emsrc=somemedium&refId=somesource/campid' };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', {
        campaignName: 'campid',
        campaignSource: 'somesource',
        campaignMedium: 'somemedium',
      });
    });

    it('should recognize campaign parameters with just a single value in refId in the URL and track them', () => {
      windowSpy.location = { search: '?emsrc=somemedium&refId=somesource' };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', {
        campaignName: 'somesource',
        campaignSource: 'somesource',
        campaignMedium: 'somemedium',
      });
    });

    it('should recognize newsletter campaign parameters in the URL and track them', () => {
      windowSpy.location = { search: '?newsletter=newsletterbla/test2016' };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', {
        campaignName: 'test2016',
        campaignSource: 'newsletterbla',
        campaignMedium: 'newsletter',
      });
    });

    it('should properly unescape newsletter campaign parameters in the URL and track them', () => {
      windowSpy.location = { search: '?newsletter=newsletterbla%2Ftest2016' };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(windowSpy.ga, 'galeria.set', {
        campaignName: 'test2016',
        campaignSource: 'newsletterbla',
        campaignMedium: 'newsletter',
      });
    });
  });

  describe('ecommerce:', () => {
    // helper to create an expectation (GA format) from a mock (DALProductData)
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
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.neverCalledWith(windowSpy.ga, 'galeria.require', 'ec');
    });

    describe('category:', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'category';
        dalDataMock.category = dalDataTypes.getDALCategoryDataStub();
      });

      it('should override the pageName with the category id', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.set', { dimension1: dalDataMock.category.id });
      });
    });

    describe('productdetail:', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'productdetail';
        dalDataMock.product = dalDataTypes.getDALProductDataStub();
      }); // productsMock[0]

      it('should load the e-commerce plugin for pagetype [productdetail]', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'ec');
      });

      it('should add the current product and track a [detail] action', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(dalDataMock.product));
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'detail');
      });

      describe('addtocart:', () =>
        it('should add the given product and track a [add] action when receiving an addtocart event from DAL', () => {
          const p = dalDataTypes.getDALProductDataStub(23456);
          const s = new Service(dalApi, dalDataMock, dalConfigMock);
          s.handleEvent('addtocart', { product: p }); // important: we intentionally add another product than on view to simulate multiple variants
          sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(p));
          sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'add');
          sinon.assert.calledWith(windowSpy.ga, 'galeria.send', 'event', 'UX', 'click', 'add to cart');
        }));
    });

    describe('checkout-cart:', () => {
      let [cart] = [];

      beforeEach(() => {
        cart = dalDataTypes.getDALCartDataStub([dalDataTypes.getDALCartProductDataStub(123), dalDataTypes.getDALCartProductDataStub(234)]);
        dalDataMock.page.type = 'checkout-cart';
        dalDataMock.cart = cart;
      });

      it('should load the e-commerce plugin for pagetype [checkout-cart]', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'ec');
      });

      it('should add all products from the cart and track the correct [checkout] action', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(cart.products[0]));
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(cart.products[1]));
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'checkout', { 'step': 1 });
      });
    });

    describe('checkout-login:', () => {
      beforeEach(() => dalDataMock.page.type = 'checkout-login');

      it('should load the e-commerce plugin for pagetype [checkout-login]', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'ec');
      });

      it('should track the correct [checkout] action', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'checkout', { step: 2 });
      });
    });

    describe('checkout-lastCheck:', () => {
      beforeEach(() => (dalDataMock.page.type = 'checkout-lastCheck'));

      it('should load the e-commerce plugin for pagetype [checkout-lastCheck]', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'ec');
      });

      it('should track the correct [checkout] action', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'checkout', { step: 3 });
      });
    });

    describe('checkout-confirmation', () => {
      let [order] = [];

      beforeEach(() => {
        // create individual order for this single test run and add it to DAL data mock
        order = dalDataTypes.getDALOrderDataStub([dalDataTypes.getDALCartProductDataStub(123), dalDataTypes.getDALCartProductDataStub(234)]);
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = order;
      });

      it('should load the e-commerce plugin for pagetype [checkout-confirmation]', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.require', 'ec');
      });

      it('should add all products from the current order and track a [purchase] action', () => {
        new Service(dalApi, dalDataMock, dalConfigMock);
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(order.products[0]));
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:addProduct', createExpectationFromProduct(order.products[1]));
        sinon.assert.calledWith(windowSpy.ga, 'galeria.ec:setAction', 'purchase', {
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
