import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/shopping24', () => {
  let [Service, dalApi, dalDataMock, dalConfigMock, loggerSpy, pixelHelperSpy, p1, p2, p3] = [];

  beforeEach(() => {
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    dalConfigMock = { hashId: 'adbjhHV6' };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addImage: sinon.spy() };
    // register mocks
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/shopping24'));
    return System.import('ba/lib/dal/bt/shopping24').then((m) => {
      Service = m.default;
    }).catch((err) => { console.error(err); });
  });

  describe('checkout-confirmation', () => {
    beforeEach(() => new Service(dalApi, dalDataMock, dalConfigMock));

    it('should call the correct URL', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match('https://tracking.s24.com/TrackOrder?'));
    });

    it('should pass the correct account id', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`shopId=${dalConfigMock.hashId}`));
    });

    it('should pass the correct net value', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&netRevenue=${dalDataMock.order.priceData.net}`));
    });

    it('should pass an empty string as shipping amount', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&shipping=`));
    });

    it('should pass the correct product AONRs', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&products=${p1.aonr},${p2.aonr},${p3.aonr}`));
    });

    it('should pass the correct number of products', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match('&lineItems=3'));
    });

    it('should pass the correct order id', () => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&orderNumber=${dalDataMock.order.id}`));
    });
  });
});
