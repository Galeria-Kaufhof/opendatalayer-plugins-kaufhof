/* eslint-disable no-underscore-dangle */
import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('ba/lib/odl/trbo', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, gkConfigMock, Plugin] = [];

  beforeEach(() => {
    // mock data
    gkConfigMock = { isAppContext: false, focMode: 0 };
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = { scriptUrl: 'trboscript.foo' };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window._trboq = { push: sinon.spy() };
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    // load module
    return setupModule('./src/plugins/trbo').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should add the pixel to DOM on any page', () => {
    odlDataMock.page.type = 'foo';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addScript, 'trboscript.foo');
  });

  /* @FIXME: add to configuration/rules

  it('should NOT add the pixel to DOM if in appContext', () => {
    gkConfigMock.isAppContext = true;
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(mocks.odl.helpers.addScript);
  });

  it('should NOT add the pixel to DOM if in focMode', () => {
    gkConfigMock.focMode = 1;
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(mocks.odl.helpers.addScript);
  });
  */

  it('should track a pageview on "homepage"', () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'home' }]);
  });

  it('should track a pageview on "search"', () => {
    odlDataMock.page.type = 'search';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'search' }]);
  });

  it('should track a pageview on "category"', () => {
    odlDataMock.page.type = 'category';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'category' }]);
  });

  it('should track a pageview and product data on "productdetail"', () => {
    odlDataMock.page.type = 'productdetail';
    odlDataMock.product = odlDataTypes.getODLProductDataStub();
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'detail' }]);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['productView', {
      products: [
        {
          product_id: odlDataMock.product.aonr,
          name: odlDataMock.product.name,
          price: odlDataMock.product.priceData.total,
        },
      ],
    }]);
  });

  it('should track a pageview and cart data on "checkout-cart"', () => {
    odlDataMock.page.type = 'checkout-cart';
    odlDataMock.cart = odlDataTypes.getODLCartDataStub([
      odlDataTypes.getODLCartProductDataStub(123),
      odlDataTypes.getODLCartProductDataStub(456),
      odlDataTypes.getODLCartProductDataStub(789),
    ]);
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'basket' }]);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['basket', {
      value: odlDataMock.cart.priceData.total,
      products: odlDataMock.cart.products.map((p) => {
        return {
          product_id: p.aonr,
          name: p.name,
          price: p.priceData.total,
          quantity: p.quantity,
        };
      }),
    }]);
  });

  it('should track a pageview and cart data on "checkout-confirmation"', () => {
    odlDataMock.page.type = 'checkout-confirmation';
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([
      odlDataTypes.getODLCartProductDataStub(123),
      odlDataTypes.getODLCartProductDataStub(456),
      odlDataTypes.getODLCartProductDataStub(789),
    ]);
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['page', { type: 'confirmation' }]);
    sinon.assert.calledWith(mocks.odl.window._trboq.push, ['sale', {
      order_id: odlDataMock.order.id,
      value: odlDataMock.order.priceData.total,
      coupon_code: odlDataMock.order.couponCode,
      products: odlDataMock.order.products.map((p) => {
        return {
          product_id: p.aonr,
          name: p.name,
          price: p.priceData.total,
          quantity: p.quantity,
        };
      }),
    }]);
  });
});
