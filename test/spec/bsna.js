import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('opendatalayer-plugins-kaufhof/bsna', () => {
  let [Plugin, mocks, odlApi, odlDataMock, odlConfigMock, rumbaMock, storageMock] = [];

  beforeEach(() => {
    odlApi = {};
    // create mocks
    // mqMock = { currentRange: 'S_to_XXL' };
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
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlDataMock.identity = { bid: 'somefancybid123' };
    odlConfigMock = { backend: '/bla/blubb' };
    // register mocks
    mocks = initMocks({ './src/lib/rumba': rumbaMock });
    mocks.odl.window.localStorage = storageMock;
    // load module
    return setupModule('./src/plugins/bsna').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('init', () => {
    it('should initialize the rumba lib on construction', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(rumbaMock.init, {
        backend: odlConfigMock.backend,
        repostOnError: false,
        pushInterval: 5,
        sessionLifetime: 1800,
        browserId: 'somefancybid123',
      });
    });

    it('should set an opt-out storage entry if a trackingOptOut parameter is set as first param in URL', () => {
      getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo?trackingOptOut=1');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(storageMock.setItem, 'ba:optout', '1');
    });

    it('should handle the trackingOptOut parameter inside a parameter list', () => {
      getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo?someotherval=no&trackingOptOut=1&something2=yes');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isTrue(storageMock.setItem.called);
      assert.deepEqual(storageMock.setItem.args[0], ['ba:optout', '1']);
    });

    it('should ignore casing of the trackingOptOut parameter', () => {
      getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo?someotherval=no&trackingoptout=1&something2=yes');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isTrue(storageMock.setItem.called);
      assert.deepEqual(storageMock.setItem.args[0], ['ba:optout', '1']);
    });

    it('should NOT initialize the rumba lib on construction when the opt-out storage entry is present', () => {
      storageMock.getItem.withArgs('ba:optout').returns('1');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isFalse(rumbaMock.init.called);
      assert.isFalse(rumbaMock.event.called);
    });
  });

  describe('handleEvent', () => {
    it('should properly handle an "initialize" event for the pagetype "productdetail"', () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.page.name = 'Produkt/1234';
      odlDataMock.product = odlDataTypes.getODLProductDataStub();
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: odlDataMock.product.productId,
          variantId: odlDataMock.product.variantId,
          ean: odlDataMock.product.ean,
          aonr: odlDataMock.product.aonr,
          brand: {
            brandKey: odlDataMock.product.brandData.brandKey,
            name: odlDataMock.product.brandData.name,
            lineKey: odlDataMock.product.brandData.lineKey,
          },
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "productdetail" if product.brandData.lineKey is missing', () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.page.name = 'Produkt/1234';
      odlDataMock.product = odlDataTypes.getODLProductDataStub();
      delete odlDataMock.product.brandData.lineKey;
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: odlDataMock.product.productId,
          variantId: odlDataMock.product.variantId,
          ean: odlDataMock.product.ean,
          aonr: odlDataMock.product.aonr,
          brand: {
            brandKey: odlDataMock.product.brandData.brandKey,
            name: odlDataMock.product.brandData.name,
          },
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "productdetail" if brand data is invalid', () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.page.name = 'Produkt/1234';
      odlDataMock.product = odlDataTypes.getODLProductDataStub();
      delete odlDataMock.product.brandData.lineKey;
      odlDataMock.product.brandData.brandKey = '';
      odlDataMock.product.brandData.name = undefined;
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'productdetail', 'Produkt/1234', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        product: {
          productId: odlDataMock.product.productId,
          variantId: odlDataMock.product.variantId,
          ean: odlDataMock.product.ean,
          aonr: odlDataMock.product.aonr,
        },
      }));
    });

    it('should properly handle an "initialize" event for the pagetype "category" if brand data is attached', () => {
      odlDataMock.page.type = 'category';
      odlDataMock.page.name = 'Markenshop Shizzle Shoes';
      odlDataMock.brand = odlDataTypes.getODLBrandDataStub();
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'category', 'Markenshop Shizzle Shoes', 'S_to_XXL');
      sinon.assert.calledWith(rumbaMock.event, sinon.match({
        brand: {
          brandKey: odlDataMock.brand.brandKey,
          name: odlDataMock.brand.name,
        },
      }));
    });

    it('should properly handle an "initialize" event for any other pagetype', () => {
      odlDataMock.page.type = 'fuzzyfoosomething';
      odlDataMock.page.name = 'Some pretty cool stuff';
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'fuzzyfoosomething', 'Some pretty cool stuff', 'S_to_XXL');
    });

    it('should push all data after receiving and handling an "initialize" event', () => {
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.called(rumbaMock.push);
    });

    it('should properly handle an "initialize" event for the pagetype "checkout-confirmation"', () => {
      odlDataMock.page.type = 'checkout-confirmation';
      odlDataMock.page.name = 'Danke';
      odlDataMock.order = odlDataTypes.getODLOrderDataStub([odlDataTypes.getODLCartProductDataStub(123), odlDataTypes.getODLCartProductDataStub(456)]);
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('initialize', odlDataMock);
      sinon.assert.calledWith(rumbaMock.BAPageLoadEvent.create, 'checkout-confirmation', 'Danke', 'S_to_XXL');
      const expectedPayload = {
        lineItems: odlDataMock.order.products.map((p) => {
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
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('rumba-click', { target: 'someEventTarget' });
      assert.isTrue(rumbaMock.event.called, 'rumba.event should get called');
      assert.isTrue(rumbaMock.ClickEvent.calledWithNew(), 'rumba.ClickEvent should be instantiated');
      assert.deepEqual(rumbaMock.ClickEvent.args[0], ['someEventTarget'], 'rumba.ClickEvent should have the expected args');
    });

    it("should properly handle 'rumba-focus' events and pass data", () => {
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
      s.handleEvent('rumba-focus', { target: 'someEventTarget' });
      assert.isTrue(rumbaMock.event.called, 'rumba.event should get called');
      assert.isTrue(rumbaMock.FocusEvent.calledWithNew(), 'rumba.FocusEvent should be instantiated');
      assert.deepEqual(rumbaMock.FocusEvent.args[0], ['someEventTarget'], 'rumba.FocusEvent should have the expected args');
    });

    it('should NOT handle events when the opt-out cookie is present', () => {
      storageMock.getItem.withArgs('ba:optout').returns('1');
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isFalse(rumbaMock.init.called, 'rumba.init should NOT get called');
      assert.isFalse(rumbaMock.event.called, 'rumba.event should NOT get called');
    });
    */

    it('should properly handle an "addtocart" event', () => {
      const p = odlDataTypes.getODLProductDataStub(123);
      odlDataMock.page.type = 'productdetail';
      odlDataMock.page.name = 'bla/foo';
      const s = new Plugin(odlApi, odlDataMock, odlConfigMock);
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
