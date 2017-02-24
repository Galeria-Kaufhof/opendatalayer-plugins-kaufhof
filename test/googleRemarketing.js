import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/googleRemarketing', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, Service, loggerSpy] = [];

  beforeEach((done) => {
    window = {
      location: { protocol: 'https:' },
      require: sinon.stub().callsArg(1),
      google_trackConversion: sinon.stub(),
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock = {
      conversionId: 12345,
      conversionLabel: 'blablubb',
    };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    // mockModule('https://www.googleadservices.com/pagead/conversion_async.js', {});
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/googleRemarketing'));
    System.import('ba/lib/dal/aff/googleRemarketing').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should lazy-load the global googleadservices script', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.require, ['https://www.googleadservices.com/pagead/conversion_async.js']);
  });

  it('should execute the global tracking function', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.called(window.google_trackConversion);
  });

  it('should define the static globals', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.google_trackConversion, sinon.match({
      google_conversion_id: dalConfigMock.conversionId,
      google_conversion_label: dalConfigMock.conversionLabel,
      google_remarketing_only: true,
      google_conversion_format: 3,
    }));
  });

  describe('google_custom_params:', () => {
    it("should set the correct custom params for the pageType 'homepage'", () => {
      dalDataMock.page.type = 'homepage';
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({ ecomm_pagetype: 'home' }),
      }));
    });

    it("should set the correct custom params for the pageType 'category'", () => {
      dalDataMock.page.type = 'category';
      dalDataMock.category =
        { id: '/unit/test/foo' };
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({
          ecomm_pagetype: 'category',
          ecomm_category: '/unit/test/foo',
        }),
      }));
    });

    it("should set the correct custom params for the pageType 'product'", () => {
      dalDataMock.page.type = 'productdetail';
      dalDataMock.product = dalDataTypes.getDALProductDataStub();
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({
          ecomm_pagetype: 'product',
          ecomm_category: dalDataMock.product.category,
          ecomm_prodid: dalDataMock.product.ean,
          ecomm_prodname: dalDataMock.product.name,
          ecomm_totalvalue: dalDataMock.product.priceData.total,
        }),
      }));
    });

    it("should set the correct custom params for the pageType 'checkout-cart'", () => {
      const p1 = dalDataTypes.getDALProductDataStub(123);
      const p2 = dalDataTypes.getDALProductDataStub(456);
      dalDataMock.page.type = 'checkout-cart';
      dalDataMock.cart = dalDataTypes.getDALCartDataStub([p1, p2]);
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({
          ecomm_pagetype: 'cart',
          ecomm_category: [p1.category, p2.category],
          ecomm_prodid: [p1.ean, p2.ean],
          ecomm_prodname: [p1.name, p2.name],
          ecomm_totalvalue: [p1.priceData.total, p2.priceData.total],
        }),
      }));
    });

    describe('checkout-confirmation:', () => {
      let [purchaseExpectation] = [];

      beforeEach(() => {
        const p1 = dalDataTypes.getDALProductDataStub(123);
        const p2 = dalDataTypes.getDALProductDataStub(456);
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2]);
        purchaseExpectation = {
          ecomm_pagetype: 'purchase',
          ecomm_category: [p1.category, p2.category],
          ecomm_prodid: [p1.ean, p2.ean],
          ecomm_prodname: [p1.name, p2.name],
          ecomm_totalvalue: [p1.priceData.total, p2.priceData.total],
        };
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (no payback, no login)", () => {
        dalDataMock.order.customer.loginstatus = 'newGuest';
        dalDataMock.order.paybackPoints = 0;
        new Service(dalApi, dalDataMock, dalConfigMock);
        purchaseExpectation.membertype = '0';
        purchaseExpectation.payback = '0';
        sinon.assert.calledWith(window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (no payback, with login)", () => {
        dalDataMock.order.customer.loginstatus = 'registeredCustomer';
        dalDataMock.order.paybackPoints = 0;
        new Service(dalApi, dalDataMock, dalConfigMock);
        purchaseExpectation.membertype = '1';
        purchaseExpectation.payback = '0';
        sinon.assert.calledWith(window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (payback, without login)", () => {
        dalDataMock.order.customer.loginstatus = 'newGuest';
        dalDataMock.order.paybackPoints = 277;
        new Service(dalApi, dalDataMock, dalConfigMock);
        purchaseExpectation.membertype = '0';
        purchaseExpectation.payback = '1';
        sinon.assert.calledWith(window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (payback, with login)", () => {
        dalDataMock.order.customer.loginstatus = 'guestBlargDunnoOrRegisteredCustomer';
        dalDataMock.order.paybackPoints = 277;
        new Service(dalApi, dalDataMock, dalConfigMock);
        purchaseExpectation.membertype = '1';
        purchaseExpectation.payback = '1';
        return sinon.assert.calledWith(window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });
    });
  });
});
