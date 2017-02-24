import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/ladenzeile', () => {
  let [window, Service, dalApi, dalDataMock, dalConfigMock, pixelHelperSpy, loggerSpy, p1, p2, p3] = [];

  beforeEach((done) => {
    window = {};
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    dalConfigMock = {
      trackingId: 'foo-1234',
      currency: 'MY$',
    };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addScript: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/ladenzeile'));
    System.import('ba/lib/dal/bt/ladenzeile').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("should add the pixel for pageType 'checkout-confirmation'", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperSpy.addScript, '//www.ladenzeile.de/controller/visualMetaTrackingJs');
  });

  it('should NOT add the pixel for any other pageType', () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(pixelHelperSpy.addScript);
  });

  it('should add the expected trackingId in window.vmt_pi', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.equal(window.vmt_pi.trackingId, dalConfigMock.trackingId);
  });

  it('should add the expected order value in window.vmt_pi', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.equal(window.vmt_pi.amount, dalDataMock.order.priceData.total);
  });

  it('should set the product SKUs in window.vmt_pi', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.vmt_pi.skus, [p1.ean, p2.ean, p3.ean]);
  });

  it('should set the product prices in window.vmt_pi', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.vmt_pi.prices, [p1.priceData.net, p2.priceData.net, p3.priceData.net]);
  });

  it('should pass expected currency in window.vmt_pi', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.equal(window.vmt_pi.currency, dalConfigMock.currency);
  });
});
