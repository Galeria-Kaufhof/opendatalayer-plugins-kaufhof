import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/psm', () => {
  let [window, Service, loggerSpy, dalApi, dalDataMock, dalConfigMock, p1, p2, p3, A3320Api] = [];

  beforeEach((done) => {
    window = { encodeURIComponent(s) { return s; } };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    dalConfigMock =
      { advertiserId: 123 };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    A3320Api = { trackEvent: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/vendor/A3320_tracking', A3320Api);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/psm'));
    System.import('ba/lib/dal/bt/psm').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("should add the pixel for pageType 'checkout-confirmation' and pass the relevant data", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(A3320Api.trackEvent, sinon.match({
      billing_advid: dalConfigMock.advertiserId,
      billing_orderid: dalDataMock.order.id,
      billing_sum: dalDataMock.order.priceData.net,
    }));
  });

  it('should NOT add the pixel for any other pageType', () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(A3320Api.trackEvent);
  });

  it('should provide the expected products to trackEvent', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(A3320Api.trackEvent, sinon.match({
      ec_Event: [
        ['buy', p1.ean, p1.name, p1.priceData.net, window.encodeURIComponent(p1.category), p1.quantity, 'NULL', 'NULL', 'NULL'],
        ['buy', p2.ean, p2.name, p2.priceData.net, window.encodeURIComponent(p2.category), p2.quantity, 'NULL', 'NULL', 'NULL'],
        ['buy', p3.ean, p3.name, p3.priceData.net, window.encodeURIComponent(p3.category), p3.quantity, 'NULL', 'NULL', 'NULL'],
      ],
    }));
  });
});
