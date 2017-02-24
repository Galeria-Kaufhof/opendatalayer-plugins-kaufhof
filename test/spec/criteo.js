import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('opendatalayer-plugins-kaufhof/criteo', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // mock data
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = { accountId: 1234 };
    // register mocks
    mocks = initMocks();
    mocks.odl.window.criteo_q = [];
    mocks.odl.window.criteo_q.push = sinon.spy();
    // load module
    return setupModule('./src/plugins/criteo').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('Init', () => {
    it('should add the criteo pixel to the DOM', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      const s = mocks.odl.window.document.getElementsByTagName('script')[0];
      assert.equal(s.src, '//static.criteo.net/js/ld/ld.js');
      assert.equal(s.async, true);
      assert.equal(s.tagName.toLowerCase(), 'script');
    });

    it('should create the global criteo tracking object as Array', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      assert.isDefined(mocks.odl.window.criteo_q);
      assert.isArray(mocks.odl.window.criteo_q);
    });

    it('should set the criteo accountId to the value supplied via config', () => {
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'setAccount', account: 1234 });
    });

    /* @INFO: we disable these until we have a way to dynamically react to values during runtime
    it("should send a 'm' when the site type in config is set to 'm'", () => {
      odlConfigMock.siteType = 'm';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'setSiteType', type: 'm' });
    });

    it("should send a 't' when the site type in config is set to 't'", () => {
      odlConfigMock.siteType = 't';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'setSiteType', type: 't' });
    });

    return it("should send a 'd' when the site type in config is set to 't'", () => {
      odlConfigMock.siteType = 'd';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'setSiteType', type: 'd' });
    });
    */
  });

  return describe('Report', () => {
    it("should track a 'viewHome' event when pageType is 'homepage", () => {
      odlDataMock.page.type = 'homepage';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'viewHome' });
    });

    it("should track a 'viewList' event and pass item data from search.eans when pageType is 'search", () => {
      odlDataMock.page.type = 'search';
      odlDataMock.search = { aonrs: ['123', '456', '789'] };
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'viewList', item: odlDataMock.search.aonrs });
    });

    it("should track a 'viewList' event and pass item data from search.eans when pageType is 'category", () => {
      odlDataMock.page.type = 'category';
      odlDataMock.category = { aonrs: ['123', '456', '789'] };
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'viewList', item: odlDataMock.category.aonrs });
    });

    it("should track a 'viewItem' event and pass data from product.ean when pageType is 'productdetail", () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.product = odlDataTypes.getODLCartProductDataStub();
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.criteo_q.push, { event: 'viewItem', item: odlDataMock.product.aonr });
    });

    return describe('checkout:', () => {
      let [p1, p2, p3] = [];

      beforeEach(() => {
        // create product stubs
        p1 = odlDataTypes.getODLCartProductDataStub(123);
        p2 = odlDataTypes.getODLCartProductDataStub(456);
        p3 = odlDataTypes.getODLCartProductDataStub(789);
      });

      it("should track a 'viewCart' event and pass data from cart.prodcuts when pageType is 'checkout-cart", () => {
        odlDataMock.page.type = 'checkout-cart';
        odlDataMock.cart = odlDataTypes.getODLCartDataStub([p1, p2, p3]);
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.criteo_q.push, {
          event: 'viewBasket',
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });

      it("should track a 'trackTransaction' event and pass data from order.prodcuts when pageType is 'checkout-confirmation", () => {
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.criteo_q.push, {
          event: 'trackTransaction',
          id: odlDataMock.order.id,
          deduplication: 0,
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });

      it("should track a 'trackTransaction' event and pass user_segment=1 if paybackPoints are defined", () => {
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
        odlDataMock.order.paybackPoints = 123;
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.criteo_q.push, {
          event: 'trackTransaction',
          id: odlDataMock.order.id,
          deduplication: 0,
          user_segment: '1',
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });

      return it('should assign a transaction to criteo if the econda emos_jckamp cookie contains campaign=criteo', () => {
        mocks.odl.cookie.get.returns('&campaign=criteo/bla/blubb');
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        sinon.assert.calledWith(mocks.odl.window.criteo_q.push, {
          event: 'trackTransaction',
          id: odlDataMock.order.id,
          deduplication: 1,
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });
    });
  });
});
