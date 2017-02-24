/* eslint-disable no-underscore-dangle */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import mockModule from './../../_mockModule';
import * as dalDataTypes from './../../../mocks/dalDataTypes';

describe('ba/lib/dal/trbo', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, gkConfigMock, pixelHelperMock, Service] = [];

  beforeEach((done) => {
    // mock data
    window = {
      location: { protocol: 'https:' },
      _trboq: { push: sinon.spy() },
    };
    pixelHelperMock = { addScript: sinon.spy() };
    gkConfigMock = { isAppContext: false, focMode: 0 };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = { scriptUrl: 'trboscript.foo' };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/config', gkConfigMock);
    mockModule('ba/lib/pixelHelper', pixelHelperMock);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/trbo'));
    System.import('ba/lib/dal/trbo').then((m) => {
      Service = m.default;
      done();
    }).catch((err) => { console.error(err); });
  });

  it('should add the pixel to DOM on any page', () => {
    dalDataMock.page.type = 'foo';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperMock.addScript, 'trboscript.foo');
  });

  it('should NOT add the pixel to DOM if in appContext', () => {
    gkConfigMock.isAppContext = true;
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(pixelHelperMock.addScript);
  });

  it('should NOT add the pixel to DOM if in focMode', () => {
    gkConfigMock.focMode = 1;
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(pixelHelperMock.addScript);
  });

  it('should track a pageview on "homepage"', () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'home' }]);
  });

  it('should track a pageview on "search"', () => {
    dalDataMock.page.type = 'search';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'search' }]);
  });

  it('should track a pageview on "category"', () => {
    dalDataMock.page.type = 'category';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'category' }]);
  });

  it('should track a pageview and product data on "productdetail"', () => {
    dalDataMock.page.type = 'productdetail';
    dalDataMock.product = dalDataTypes.getDALProductDataStub();
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'detail' }]);
    sinon.assert.calledWith(window._trboq.push, ['productView', {
      products: [
        {
          product_id: dalDataMock.product.aonr,
          name: dalDataMock.product.name,
          price: dalDataMock.product.priceData.total,
        },
      ],
    }]);
  });

  it('should track a pageview and cart data on "checkout-cart"', () => {
    dalDataMock.page.type = 'checkout-cart';
    dalDataMock.cart = dalDataTypes.getDALCartDataStub([
      dalDataTypes.getDALCartProductDataStub(123),
      dalDataTypes.getDALCartProductDataStub(456),
      dalDataTypes.getDALCartProductDataStub(789),
    ]);
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'basket' }]);
    sinon.assert.calledWith(window._trboq.push, ['basket', {
      value: dalDataMock.cart.priceData.total,
      products: dalDataMock.cart.products.map((p) => {
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
    dalDataMock.page.type = 'checkout-confirmation';
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([
      dalDataTypes.getDALCartProductDataStub(123),
      dalDataTypes.getDALCartProductDataStub(456),
      dalDataTypes.getDALCartProductDataStub(789),
    ]);
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window._trboq.push, ['page', { type: 'confirmation' }]);
    sinon.assert.calledWith(window._trboq.push, ['sale', {
      order_id: dalDataMock.order.id,
      value: dalDataMock.order.priceData.total,
      coupon_code: dalDataMock.order.couponCode,
      products: dalDataMock.order.products.map((p) => {
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
