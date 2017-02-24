import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/marin', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, Service, pixelHelperApi, loggerSpy] = [];

  beforeEach((done) => {
    window = { _mTrack: [] };
    window._mTrack.push = sinon.spy();
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock = { accountId: 'bla1234' };
    pixelHelperApi = { addScript: sinon.stub() };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperApi);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/marin'));
    System.import('ba/lib/dal/aff/marin').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should define the global _mTrack', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isDefined(window._mTrack);
    return assert.isArray(window._mTrack);
  });

  it('should append the marin pixel to the DOM', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    return sinon.assert.calledWith(pixelHelperApi.addScript, `//tracker.marinsm.com/tracker/async/${dalConfigMock.accountId}.js`);
  });

  it("should add the common 'anonymizeIp' flags for any pagetype", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    return sinon.assert.calledWith(window._mTrack.push, ['activateAnonymizeIp']);
  });

  it("should add the common 'trackPage' flags for any pagetype", () => {
    ['homepage', 'category', 'search', 'productdetail', 'checkout-cart'].map((type) => {
      dalDataMock.page.type = type;
      new Service(dalApi, dalDataMock, dalConfigMock);
      sinon.assert.calledWith(window._mTrack.push, ['activateAnonymizeIp']);
    });
  });

  it("should add the 'processOrders' flag for pageType 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'checkout-confirmation';
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    new Service(dalApi, dalDataMock, dalConfigMock);
    return sinon.assert.calledWith(window._mTrack.push, ['processOrders']);
  });

  it("should add the 'addTrans' data with convType 'order' for pageType 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'checkout-confirmation';
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    new Service(dalApi, dalDataMock, dalConfigMock);
    return sinon.assert.calledWith(window._mTrack.push, ['addTrans', {
      currency: 'EUR',
      items: [{
        convType: 'order',
        price: dalDataMock.order.priceData.total,
        orderId: dalDataMock.order.id,
      }],
    }]);
  });

  return it("should add the 'addTrans' data with convType 'nl_lead' for pageType 'newsletter-confirm'", () => {
    dalDataMock.page.type = 'newsletter-subscribed';
    new Service(dalApi, dalDataMock, dalConfigMock);
    return sinon.assert.calledWith(window._mTrack.push, ['addTrans', {
      currency: 'EUR',
      items: [{
        convType: 'nl_lead',
        price: '',
        orderId: '',
      }],
    }]);
  });
});
