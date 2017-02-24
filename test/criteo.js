import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/criteo', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, Service, mqMock, cookieSpy, loggerSpy, lastAddedElement] = [];

  // check whether an event with teh given name and given additional data
  // exists in global criteo event queue
  const assertCriteoEventData = (name, value) => {
    for (let i = 0; i < window.criteo_q.length; i++) {
      const item = window.criteo_q[i];
      if (item.event === name) {
        // clone event
        const expectation = JSON.parse(JSON.stringify(value));
        expectation.event = name;
        assert.deepEqual(item, expectation);
        return;
      }
    }
    assert.isTrue(false, `assertCriteoEventData: ${name} not equals ${JSON.stringify(value)}`);
  };

  beforeEach((done) => {
    window = {
      document: {
        createElement(type) {
          return { src: '', tagName: type };
        },
        getElementsByTagName() {
          return [{
            parentNode: {
              insertBefore(element, parent) {
                return lastAddedElement = element;
              },
            },
            appendChild() {},
          }];
        },
      },
    };
    mqMock = { currentRange: '' };
    cookieSpy = { get: sinon.stub() };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // mock data
    dalApi = {};
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock = { accountId: 1234 };
    // register mocks
    mockModule('gk/vendor/cookie', cookieSpy);
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/mediaQuery', mqMock);
    mockModule('gk/lib/logger', () => loggerSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/criteo'));
    System.import('ba/lib/dal/aff/criteo').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  describe('Init', () => {
    it('should add the criteo pixel to the DOM', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.equal(lastAddedElement.src, '//static.criteo.net/js/ld/ld.js');
      assert.equal(lastAddedElement.async, true);
      return assert.equal(lastAddedElement.tagName, 'script');
    });

    it('should create the global criteo tracking object as Array', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      assert.isDefined(window.criteo_q);
      return assert.isArray(window.criteo_q);
    });

    it('should set the criteo accountId to the value supplied via config', () => {
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('setAccount', { account: dalConfigMock.accountId });
    });

    it("should send an 'm' when the breakpoint is 'up_to_M'", () => {
      mqMock.currentRange = 'up_to_M';
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('setSiteType', { type: 'm' });
    });

    it("should send a 't' when the breakpoint is 'M_to_L'", () => {
      mqMock.currentRange = 'M_to_L';
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('setSiteType', { type: 't' });
    });

    return it("should send a 'd' when the breakpoint is 'L_and_up'", () => {
      mqMock.currentRange = 'L_and_up';
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('setSiteType', { type: 'd' });
    });
  });

  return describe('Report', () => {
    it("should track a 'viewHome' event when pageType is 'homepage", () => {
      dalDataMock.page.type = 'homepage';
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('viewHome', {});
    });

    it("should track a 'viewList' event and pass item data from search.eans when pageType is 'search", () => {
      dalDataMock.page.type = 'search';
      dalDataMock.search =
        { aonrs: ['123', '456', '789'] };
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('viewList', { item: dalDataMock.search.aonrs });
    });

    it("should track a 'viewList' event and pass item data from search.eans when pageType is 'category", () => {
      dalDataMock.page.type = 'category';
      dalDataMock.category =
        { aonrs: ['123', '456', '789'] };
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('viewList', { item: dalDataMock.category.aonrs });
    });

    it("should track a 'viewItem' event and pass data from product.ean when pageType is 'productdetail", () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.product = dalDataTypes.getDALCartProductDataStub();
      new Service(dalApi, dalDataMock, dalConfigMock);
      return assertCriteoEventData('viewItem', { item: dalDataMock.product.aonr });
    });

    return describe('checkout:', () => {
      let [p1, p2, p3] = [];

      beforeEach(() => {
        // create product stubs
        p1 = dalDataTypes.getDALCartProductDataStub(123);
        p2 = dalDataTypes.getDALCartProductDataStub(456);
        return p3 = dalDataTypes.getDALCartProductDataStub(789);
      });

      it("should track a 'viewCart' event and pass data from cart.prodcuts when pageType is 'checkout-cart", () => {
        dalDataMock.page.type = 'checkout-cart';
        dalDataMock.cart = dalDataTypes.getDALCartDataStub([p1, p2, p3]);
        new Service(dalApi, dalDataMock, dalConfigMock);
        return assertCriteoEventData('viewBasket', {
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });

      it("should track a 'trackTransaction' event and pass data from order.prodcuts when pageType is 'checkout-confirmation", () => {
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
        new Service(dalApi, dalDataMock, dalConfigMock);
        return assertCriteoEventData('trackTransaction', {
          id: dalDataMock.order.id,
          deduplication: 0,
          item: [
            { id: p1.aonr, price: p1.priceData.total, quantity: p1.quantity },
            { id: p2.aonr, price: p2.priceData.total, quantity: p2.quantity },
            { id: p3.aonr, price: p3.priceData.total, quantity: p3.quantity },
          ],
        });
      });

      it("should track a 'trackTransaction' event and pass user_segment=1 if paybackPoints are defined", () => {
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
        dalDataMock.order.paybackPoints = 123;
        new Service(dalApi, dalDataMock, dalConfigMock);
        return assertCriteoEventData('trackTransaction', {
          id: dalDataMock.order.id,
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
        cookieSpy.get.returns('&campaign=criteo/bla/blubb');
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
        new Service(dalApi, dalDataMock, dalConfigMock);
        return assertCriteoEventData('trackTransaction', {
          id: dalDataMock.order.id,
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
