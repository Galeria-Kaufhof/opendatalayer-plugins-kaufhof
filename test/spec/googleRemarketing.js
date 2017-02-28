import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('googleRemarketing', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = {
      conversionId: 12345,
      conversionLabel: 'blablubb',
    };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window.require = sinon.stub().callsArg(1);
    mocks.odl.window.google_trackConversion = sinon.stub();
    // load module
    return setupModule('./src/plugins/googleRemarketing').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should lazy-load the global googleadservices script', () => {
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.require, ['https://www.googleadservices.com/pagead/conversion_async.js']);
  });

  it('should execute the global tracking function', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.called(mocks.odl.window.google_trackConversion);
  });

  it('should define the static globals', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
      google_conversion_id: odlConfigMock.conversionId,
      google_conversion_label: odlConfigMock.conversionLabel,
      google_remarketing_only: true,
      google_conversion_format: 3,
    }));
  });

  describe('google_custom_params:', () => {
    it("should set the correct custom params for the pageType 'homepage'", () => {
      odlDataMock.page.type = 'homepage';
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({ ecomm_pagetype: 'home' }),
      }));
    });

    it("should set the correct custom params for the pageType 'category'", () => {
      odlDataMock.page.type = 'category';
      odlDataMock.category =
        { id: '/unit/test/foo' };
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({
          ecomm_pagetype: 'category',
          ecomm_category: '/unit/test/foo',
        }),
      }));
    });

    it("should set the correct custom params for the pageType 'product'", () => {
      odlDataMock.page.type = 'productdetail';
      odlDataMock.product = odlDataTypes.getODLProductDataStub();
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
        google_custom_params: sinon.match({
          ecomm_pagetype: 'product',
          ecomm_category: odlDataMock.product.category,
          ecomm_prodid: odlDataMock.product.ean,
          ecomm_prodname: odlDataMock.product.name,
          ecomm_totalvalue: odlDataMock.product.priceData.total,
        }),
      }));
    });

    it("should set the correct custom params for the pageType 'checkout-cart'", () => {
      const p1 = odlDataTypes.getODLProductDataStub(123);
      const p2 = odlDataTypes.getODLProductDataStub(456);
      odlDataMock.page.type = 'checkout-cart';
      odlDataMock.cart = odlDataTypes.getODLCartDataStub([p1, p2]);
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
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
        const p1 = odlDataTypes.getODLProductDataStub(123);
        const p2 = odlDataTypes.getODLProductDataStub(456);
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2]);
        purchaseExpectation = {
          ecomm_pagetype: 'purchase',
          ecomm_category: [p1.category, p2.category],
          ecomm_prodid: [p1.ean, p2.ean],
          ecomm_prodname: [p1.name, p2.name],
          ecomm_totalvalue: [p1.priceData.total, p2.priceData.total],
        };
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (no payback, no login)", () => {
        odlDataMock.order.customer.loginstatus = 'newGuest';
        odlDataMock.order.paybackPoints = 0;
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        purchaseExpectation.membertype = '0';
        purchaseExpectation.payback = '0';
        sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (no payback, with login)", () => {
        odlDataMock.order.customer.loginstatus = 'registeredCustomer';
        odlDataMock.order.paybackPoints = 0;
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        purchaseExpectation.membertype = '1';
        purchaseExpectation.payback = '0';
        sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (payback, without login)", () => {
        odlDataMock.order.customer.loginstatus = 'newGuest';
        odlDataMock.order.paybackPoints = 277;
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        purchaseExpectation.membertype = '0';
        purchaseExpectation.payback = '1';
        sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });

      it("should set the correct custom params for the pageType 'checkout-confirmation' (payback, with login)", () => {
        odlDataMock.order.customer.loginstatus = 'guestBlargDunnoOrRegisteredCustomer';
        odlDataMock.order.paybackPoints = 277;
        new Plugin(odlApi, odlDataMock, odlConfigMock);
        purchaseExpectation.membertype = '1';
        purchaseExpectation.payback = '1';
        return sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({ google_custom_params: sinon.match(purchaseExpectation) }));
      });
    });
  });
});
