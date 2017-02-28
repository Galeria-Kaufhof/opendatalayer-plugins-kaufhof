import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('adnymics', () => {
  let [Plugin, mocks, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // mock data
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlDataMock.identity = { bid: 'abcdefg' };
    odlConfigMock = { siteId: '99' };
    // register mocks
    mocks = initMocks();
    mocks.odl.window._paq = [];
    mocks.odl.window._paq.push = sinon.spy();
    // load module
    return setupModule('./src/plugins/adnymics').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('all pages', () => {
    beforeEach(() => new Plugin(mocks.odl, odlDataMock, odlConfigMock));

    it('should create a global tracking object', () => {
      assert.isArray(mocks.odl.window._paq);
    });

    it('should add the bid as identity info', () => {
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['setCustomVariable', 1, 'identity', 'abcdefg', 'page']);
    });

    it('should add the adnymics script to the DOM', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addScript, '//s1.adnymics.com/piwik.js');
    });

    it('should set the trackerUrl as _paq event', () => {
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['setTrackerUrl', '//s1.adnymics.com/piwik.php']);
    });

    it('should set the siteId as _paq event', () => {
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['setSiteId', odlConfigMock.siteId]);
    });

    it('should track a page view as _paq event', () => {
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['trackPageView']);
    });

    it('should enable link tracking as _paq event', () => {
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['enableLinkTracking']);
    });
  });

  describe('productdetail', () => {
    it("should pass the product information as 'setCustomVariable' event", () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.product = { ean: '12345678' };
      new Plugin(mocks.odl, odlDataMock, odlConfigMock);
      return sinon.assert.calledWith(mocks.odl.window._paq.push, ['setCustomVariable', 2, 'productId', '12345678', 'page']);
    });
  });

  describe('checkout-confirmation', () => {
    let [p1, p2] = [];

    beforeEach(() => {
      p1 = odlDataTypes.getODLCartProductDataStub(123);
      p2 = odlDataTypes.getODLCartProductDataStub(456);
      odlDataMock.page.type = 'checkout-confirmation';
      odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2]);
    });

    it('should NOT enable link tracking as _paq event', () => {
      new Plugin(mocks.odl, odlDataMock, odlConfigMock);
      sinon.assert.neverCalledWith(mocks.odl.window._paq.push, ['enableLinkTracking']);
    });

    it("should pass the order products as a series of 'addEcommerceItem' events", () => {
      new Plugin(mocks.odl, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['addEcommerceItem', p1.ean, p1.name, p1.abteilungName, p1.priceData.total, p1.quantity]);
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['addEcommerceItem', p2.ean, p2.name, p2.abteilungName, p2.priceData.total, p2.quantity]);
    });

    it("should pass the order information as 'trackEcommerceOrder' event", () => {
      const o = odlDataMock.order;
      new Plugin(mocks.odl, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, true]);
    });

    it('should pass false for couponCode if none is set', () => {
      const o = odlDataMock.order;
      odlDataMock.order.couponCode = null;
      new Plugin(mocks.odl, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window._paq.push, ['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, false]);
    });
  });
});
