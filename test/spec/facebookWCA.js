import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('ba/lib/odl/aff/facebookWCA', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // mock data
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = {
      pixelId: '1234567890',
      currency: 'MY$',
    };
    // spies
    mocks = initMocks();
    mocks.odl.window._fbq = { push: sinon.spy() };
    // load module
    return setupModule('./src/plugins/facebookWCA').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should append the facebook pixel to the DOM', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isDefined(mocks.odl.window._fbq);
    assert.isTrue(mocks.odl.window._fbq.loaded);
  });
    // TODO: pixel is in the DOM?
    // ...

  it('should pass the correct account to FB', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._fbq.push, ['addPixelId', odlConfigMock.pixelId]);
  });

  it('should set the FB pixel as initialized', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._fbq.push, ['track', 'PixelInitialized', {}]);
  });

  it("should not send any product data when the pagetype isnt in ['productdetail','checkout-complete']", () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.logger.log, sinon.match('not sending any product data'));
  });

  it("should pass the product id when the pagetype is 'productdetail'", () => {
    odlDataMock.page.type = 'productdetail';
    odlDataMock.product = odlDataTypes.getODLProductDataStub();
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._fbq.push, ['track', 'ViewContent', {
      content_type: 'product',
      content_ids: [odlDataMock.product.ean],
    }]);
  });

  it("should pass all products' EANs and the total price when the pagetype is 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'checkout-confirmation';
    const [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._fbq.push, ['track', 'Purchase', {
      content_type: 'product',
      content_ids: [p1.ean, p2.ean, p3.ean],
      currency: odlConfigMock.currency,
      value: odlDataMock.order.priceData.total,
    }]);
  });

  it("should pass the product's EAN when an event 'addtocart' is broadcasted", () => {
    const p = odlDataTypes.getODLProductDataStub();
    const fb = new Plugin(odlApi, odlDataMock, odlConfigMock);
    fb.handleEvent('addtocart', { product: p });
    sinon.assert.calledWith(mocks.odl.window._fbq.push, ['track', 'AddToCart', {
      content_type: 'product',
      content_ids: [p.ean],
    }]);
  });
});
