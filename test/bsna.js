import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import mockModule from './../../_mockModule';
import * as dalDataTypes from './../../../mocks/dalDataTypes';

describe('ba/lib/dal/bsna', () => {
  let [windowMock, Service, dalApi, dalDataMock, dalConfigMock, loggerSpy, mqMock, rumbaMock, storageMock] = [];

  beforeEach((done) => {
    dalApi = {};
    // create mocks
    windowMock = { location: { href: '?' } };
    loggerSpy = { log: sinon.spy() };
    mqMock = { currentRange: 'S_to_XXL' };
    rumbaMock = {
      init: sinon.spy(),
      event: sinon.spy(),
      push: sinon.spy(),
      BAPageLoadEvent: { create: () => { return {}; } },
      BAProductAddedToCartEvent: { create: lineItem => lineItem },
      BALineItem: { create: (product, quantity) => { return { product, quantity }; } },
      BAProduct: { create: (a, b, c, d, e) => {
        return {
          productId: a,
          variantId: b,
          ean: c,
          aonr: d,
          brand: e,
        };
      },
      },
      BABrand: { create: (a, b, c) => {
        return {
          name: a,
          brandKey: b,
          lineKey: c,
        };
      },
      },
      BAOrder: { create: lineItems => ({ lineItems }) },
    };
    sinon.spy(rumbaMock.BAPageLoadEvent, 'create');
    sinon.spy(rumbaMock.BAProductAddedToCartEvent, 'create');
    sinon.spy(rumbaMock.BAOrder, 'create');
    sinon.spy(rumbaMock.BALineItem, 'create');
    storageMock = {
      setItem: sinon.spy(),
      getItem: sinon.stub(),
    };
    storageMock.getItem.returns('');
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalDataMock.identity = { bid: 'somefancybid123' };
    dalConfigMock = { backend: '/bla/blubb' };
    // register mocks
    mockModule('gk/globals/window', windowMock);
    mockModule('gk/globals/localStorage', storageMock);
    mockModule('gk/lib/mediaQuery', mqMock);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/rumba', rumbaMock);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bsna'));
    System.import('ba/lib/dal/bsna').then((m) => {
      Service = m.default;
      done();
    }).catch((err) => { console.error(err); });
  });

  describe('init', () => {
    it('should initialize the rumba lib on construction', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.deepEqual(rumbaMock.init.args[0][0], {
        backend: dalConfigMock.backend,
        repostOnError: false,
        pushInterval: 5,
        sessionLifetime: 1800,
        browserId: 'somefancybid123',
      });
    });

    it('should set an opt-out storage entry if a trackingOptOut parameter is set as first param in URL', () => {
      windowMock.location.href = '?trackingOptOut=1';
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isTrue(storageMock.setItem.called);
      assert.deepEqual(storageMock.setItem.args[0], ['ba:optout', '1']);
    });

    it('should handle the trackingOptOut parameter inside a parameter list', () => {
      windowMock.location.href = 'someotherval=no&trackingOptOut=1&something2=yes';
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isTrue(storageMock.setItem.called);
      assert.deepEqual(storageMock.setItem.args[0], ['ba:optout', '1']);
    });

    it('should ignore casing of the trackingOptOut parameter', () => {
      windowMock.location.href = 'someotherval=no&trackingoptout=1&something2=yes';
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isTrue(storageMock.setItem.called);
      assert.deepEqual(storageMock.setItem.args[0], ['ba:optout', '1']);
    });

    it('should NOT initialize the rumba lib on construction when the opt-out storage entry is present', () => {
      storageMock.getItem.withArgs('ba:optout').returns('1');
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isFalse(rumbaMock.init.called);
      assert.isFalse(rumbaMock.event.called);
    });
  });

  describe('handleEvent', () => {
    it('should properly handle an "initialize" event for the pagetype "productdetail"', () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.page.name = 'Produkt/1234';
      dalDataMock.product = dalDataTypes.getDALProductDataStub();
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: dalDataMock.product.productId,
          variantId: dalDataMock.product.variantId,
          ean: dalDataMock.product.ean,
          aonr: dalDataMock.product.aonr,
          brand: {
            brandKey: dalDataMock.product.brandData.brandKey,
            name: dalDataMock.product.brandData.name,
            lineKey: dalDataMock.product.brandData.lineKey,
          },
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "productdetail" if product.brandData.lineKey is missing', () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.page.name = 'Produkt/1234';
      dalDataMock.product = dalDataTypes.getDALProductDataStub();
      delete dalDataMock.product.brandData.lineKey;
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: dalDataMock.product.productId,
          variantId: dalDataMock.product.variantId,
          ean: dalDataMock.product.ean,
          aonr: dalDataMock.product.aonr,
          brand: {
            brandKey: dalDataMock.product.brandData.brandKey,
            name: dalDataMock.product.brandData.name,
          },
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "productdetail" if brand data is invalid', () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.page.name = 'Produkt/1234';
      dalDataMock.product = dalDataTypes.getDALProductDataStub();
      delete dalDataMock.product.brandData.lineKey;
      dalDataMock.product.brandData.brandKey = '';
      dalDataMock.product.brandData.name = undefined;
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: dalDataMock.product.productId,
          variantId: dalDataMock.product.variantId,
          ean: dalDataMock.product.ean,
          aonr: dalDataMock.product.aonr,
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "category" if brand data is attached', () => {
      dalDataMock.page.type = 'category';
      dalDataMock.page.name = 'Markenshop Shizzle Shoes';
      dalDataMock.brand = dalDataTypes.getDALBrandDataStub();
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'category', 'Markenshop Shizzle Shoes', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        brand: {
          brandKey: dalDataMock.brand.brandKey,
          name: dalDataMock.brand.name,
        },
      }));
    });

    it('should properly handle an "initialize" event for any other pagetype', () => {
      dalDataMock.page.type = 'fuzzyfoosomething';
      dalDataMock.page.name = 'Some pretty cool stuff';
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'fuzzyfoosomething', 'Some pretty cool stuff', 'S_to_XXL');
    });

    it('should push all data after receiving and handling an "initialize" event', () => {
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.called(rumbaMock.push);
    });

    it('should properly handle an "initialize" event for the pagetype "checkout-confirmation"', () => {
      dalDataMock.page.type = 'checkout-confirmation';
      dalDataMock.page.name = 'Danke';
      dalDataMock.order = dalDataTypes.getDALOrderDataStub([dalDataTypes.getDALCartProductDataStub(123), dalDataTypes.getDALCartProductDataStub(456)]);
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('initialize', dalDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'checkout-confirmation', 'Danke', 'S_to_XXL');
      const expectedPayload = {
        lineItems: dalDataMock.order.products.map((p) => {
          return {
            product: {
              productId: p.productId,
              variantId: p.variantId,
              ean: p.ean,
              aonr: p.aonr,
              brand: {
                name: p.brandData.name,
                brandKey: p.brandData.brandKey,
                lineKey: p.brandData.lineKey,
              },
            },
            quantity: p.quantity,
          };
        }),
      };
      sinon.assert.calledWith(rumbaMock.event, sinon.match({ order: expectedPayload }));
    });

    /*
    it("should properly handle 'rumba-click' events and pass data", () => {
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('rumba-click', { target: 'someEventTarget' });
      assert.isTrue(rumbaMock.event.called, 'rumba.event should get called');
      assert.isTrue(rumbaMock.ClickEvent.calledWithNew(), 'rumba.ClickEvent should be instantiated');
      assert.deepEqual(rumbaMock.ClickEvent.args[0], ['someEventTarget'], 'rumba.ClickEvent should have the expected args');
    });

    it("should properly handle 'rumba-focus' events and pass data", () => {
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('rumba-focus', { target: 'someEventTarget' });
      assert.isTrue(rumbaMock.event.called, 'rumba.event should get called');
      assert.isTrue(rumbaMock.FocusEvent.calledWithNew(), 'rumba.FocusEvent should be instantiated');
      assert.deepEqual(rumbaMock.FocusEvent.args[0], ['someEventTarget'], 'rumba.FocusEvent should have the expected args');
    });

    it('should NOT handle events when the opt-out cookie is present', () => {
      storageMock.getItem.withArgs('ba:optout').returns('1');
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isFalse(rumbaMock.init.called, 'rumba.init should NOT get called');
      assert.isFalse(rumbaMock.event.called, 'rumba.event should NOT get called');
    });
    */

    it('should properly handle an "addtocart" event', () => {
      const p = dalDataTypes.getDALProductDataStub(123);
      dalDataMock.page.type = 'productdetail';
      dalDataMock.page.name = 'bla/foo';
      const s = new Service(dalApi, dalDataMock, dalConfigMock);
      s.handleEvent('addtocart', { product: p, quantity: 3 });
      sinon.assert.calledWith(rumbaMock.BAProductAddedToCartEvent.create, sinon.match({ product: sinon.match({ ean: p.ean }), quantity: 3 }));
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: sinon.match({
          ean: p.ean,
        }),
      }));
    });
  });
});
