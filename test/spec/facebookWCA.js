import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/facebookWCA', () => {
  let [injector, window, dalApi, dalDataMock, dalConfigMock, Service, loggerSpy] = [];

  beforeEach((done) => {
    // mock data
    window = {
      document: {
        createElement() { return (() => ({ src: '' })); },
        getElementsByTagName() {
          return [{
            parentNode: {
              insertBefore() {},
            },
          }];
        },
      },
      _fbq: {
        push: sinon.spy(),
      },
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock = {
      pixelId: '1234567890',
      currency: 'MY$',
    };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/facebookWCA'));
    System.import('ba/lib/dal/aff/facebookWCA').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should append the facebook pixel to the DOM', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isDefined(window._fbq);
    assert.isTrue(window._fbq.loaded);
  }
  );
    // TODO: pixel is in the DOM?
    // ...

  it('should pass the correct account to FB', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._fbq.push, ['addPixelId', dalConfigMock.pixelId]);
  }
  );

  it('should set the FB pixel as initialized', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._fbq.push, ['track', 'PixelInitialized', {}]);
  }
  );

  it("should not send any product data when the pagetype isnt in ['productdetail','checkout-complete']", () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(loggerSpy.log, sinon.match('not sending any product data'));
  }
  );

  it("should pass the product id when the pagetype is 'productdetail'", () => {
    dalDataMock.page.type = 'productdetail';
    dalDataMock.product = dalDataTypes.getDALProductDataStub();
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._fbq.push, ['track', 'ViewContent', {
      content_type: 'product',
      content_ids: [dalDataMock.product.ean],
    }]);
  }
  );

  it("should pass all products' EANs and the total price when the pagetype is 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'checkout-confirmation';
    let [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._fbq.push, ['track', 'Purchase', {
      content_type: 'product',
      content_ids: [p1.ean, p2.ean, p3.ean],
      currency: dalConfigMock.currency,
      value: dalDataMock.order.priceData.total,
    }]);
  }
  );

  it("should pass the product's EAN when an event 'addtocart' is broadcasted", () => {
    const p = dalDataTypes.getDALProductDataStub();
    const fb = new Service(dalApi, dalDataMock, dalConfigMock);
    fb.handleEvent('addtocart', { product: p });
    sinon.assert.calledWith(window._fbq.push, ['track', 'AddToCart', {
      content_type: 'product',
      content_ids: [p.ean],
    }]);
  });
});
