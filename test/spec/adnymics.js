import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import mockModule from 'systemjs-mock-module';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import jsdom from 'jsdom';
import './../systemjs.config';

describe('opendatalayer-plugins-kaufhof/adnymics', () => {
  let [Service, odlMock, loggerSpy, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // spies
    odlMock = {
      window: jsdom.jsdom('<html><body></body></html>').defaultView,
      Logger: () => loggerSpy,
      helpers: { addScript: sinon.spy() }
    };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    odlMock.window._paq = [];
    odlMock.window._paq.push = sinon.spy();
    // mock data
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlDataMock.identity = { bid: 'abcdefg' };
    odlConfigMock = { siteId: '99' };
    // register mocks
    mockModule(System, 'opendatalayer', odlMock);
    // clear module first
    System.delete(System.normalizeSync('./src/plugins/adnymics'));
    return System.import('./src/plugins/adnymics').then(m => {
      Service = m.default;
    }).catch(err => console.error(err));
  });

  describe('all pages', () => {
    beforeEach(() => new Service(odlMock, odlDataMock, odlConfigMock));

    it('should create a global tracking object', () => {
      assert.isArray(odlMock.window._paq);
    });

    it('should add the bid as identity info', () => {
      sinon.assert.calledWith(odlMock.window._paq.push, ['setCustomVariable', 1, 'identity', 'abcdefg', 'page']);
    });

    it('should add the adnymics script to the DOM', () => {
      sinon.assert.calledWith(odlMock.helpers.addScript, '//s1.adnymics.com/piwik.js');
    });

    it('should set the trackerUrl as _paq event', () => {
      sinon.assert.calledWith(odlMock.window._paq.push, ['setTrackerUrl', '//s1.adnymics.com/piwik.php']);
    });

    it('should set the siteId as _paq event', () => {
      sinon.assert.calledWith(odlMock.window._paq.push, ['setSiteId', odlConfigMock.siteId]);
    });

    it('should track a page view as _paq event', () => {
      sinon.assert.calledWith(odlMock.window._paq.push, ['trackPageView']);
    });

    it('should enable link tracking as _paq event', () => {
      sinon.assert.calledWith(odlMock.window._paq.push, ['enableLinkTracking']);
    });
  });

  describe('productdetail', () => {

    it("should pass the product information as 'setCustomVariable' event", () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.product = { ean: '12345678' };
      new Service(odlMock, odlDataMock, odlConfigMock);
      return sinon.assert.calledWith(odlMock.window._paq.push, ['setCustomVariable', 2, 'productId', '12345678', 'page']);
    })
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
      new Service(odlMock, odlDataMock, odlConfigMock);
      sinon.assert.neverCalledWith(odlMock.window._paq.push, ['enableLinkTracking']);
    });

    it("should pass the order products as a series of 'addEcommerceItem' events", () => {
      new Service(odlMock, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(odlMock.window._paq.push, ['addEcommerceItem', p1.ean, p1.name, p1.abteilungName, p1.priceData.total, p1.quantity]);
      sinon.assert.calledWith(odlMock.window._paq.push, ['addEcommerceItem', p2.ean, p2.name, p2.abteilungName, p2.priceData.total, p2.quantity]);
    });

    it("should pass the order information as 'trackEcommerceOrder' event", () => {
      const o = odlDataMock.order;
      new Service(odlMock, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(odlMock.window._paq.push, ['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, true]);
    });

    it('should pass false for couponCode if none is set', () => {
      const o = odlDataMock.order;
      odlDataMock.order.couponCode = null;
      new Service(odlMock, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(odlMock.window._paq.push, ['trackEcommerceOrder', o.id, o.priceData.net, 0, o.priceData.VAT, o.shipping, false]);
    });
  });
});
