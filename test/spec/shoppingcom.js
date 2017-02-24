/* eslint-disable no-underscore-dangle */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/shoppingcom', () => {
  let [Service, dalApi, dalDataMock, dalConfigMock, windowSpy, loggerSpy, pixelHelperSpy, p1, p2, p3] = [];

  beforeEach(() => {
    windowSpy = { _roi: { push: sinon.spy() } };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    dalConfigMock = { merchantId: '12345foo' };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addScript: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', windowSpy);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/shoppingcom'));
    return System.import('ba/lib/dal/bt/shoppingcom').then((m) => {
      Service = m.default;
    }).catch((err) => { console.error(err); });
  });

  describe('checkout-confirmation', () => {
    beforeEach(() => new Service(dalApi, dalDataMock, dalConfigMock));

    it('should define a window._roi global', () => {
      assert.isDefined(windowSpy._roi);
    });

    it('should push a merchantId to _roi', () => {
      sinon.assert.calledWith(windowSpy._roi.push, ['_setMerchantId', dalConfigMock.merchantId]);
    });

    it('should push the total order revenue to _roi', () => {
      sinon.assert.calledWith(windowSpy._roi.push, ['_setOrderAmount', dalDataMock.order.priceData.total]);
    });

    it('should push the products details to _roi', () => {
      dalDataMock.order.products.forEach((p) => {
        sinon.assert.calledWith(windowSpy._roi.push, ['_addItem',
          p.aonr, p.name, '', p.category, p.priceData.total, p.quantity]);
      });
    });

    it('should track a transaction event', () => {
      sinon.assert.calledWith(windowSpy._roi.push, ['_trackTrans']);
    });

    it('should append the shopping.com script to the DOM', () => {
      sinon.assert.calledWith(pixelHelperSpy.addScript, sinon.match('//stat.dealtime.com/ROI/ROI2.js'));
    });
  });
});
