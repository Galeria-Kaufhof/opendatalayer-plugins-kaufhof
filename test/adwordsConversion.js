import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/adwordsConversion', () => {
  let [window, Service, loggerSpy, dalApi, dalDataMock, dalConfigMock] = [];

  beforeEach((done) => {
    // spies
    window = {
      location: { protocol: 'https:' },
      require: sinon.stub().callsArg(1),
      google_trackConversion: sinon.stub(),
    };
    loggerSpy = {
      log: sinon.spy(),
      warn: sinon.spy(),
    };
    // mock data
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = {
      conversionId: 123456789,
      conversionLabel: 'bla123Blubb',
      conversionCurrency: 'MY$',
    };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/adwordsConversion'));
    System.import('ba/lib/dal/aff/adwordsConversion').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should lazy-load the global googleadservices script', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.require, ['https://www.googleadservices.com/pagead/conversion_async.js']);
  });

  it('should define the static globals', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.google_trackConversion, sinon.match({
      google_conversion_id: dalConfigMock.conversionId,
      google_conversion_label: dalConfigMock.conversionLabel,
      google_remarketing_only: false,
      google_conversion_format: 3,
      google_conversion_currency: dalConfigMock.conversionCurrency,
    }));
  });

  it("should track the correct conversion value if the pageType is 'checkout-confirmation'", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.google_trackConversion, sinon.match({ google_conversion_value: dalDataMock.order.priceData.total }));
  });

  it("should not track anything if the pageType isnt 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'someotherpage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(window.google_trackConversion);
  });
});
