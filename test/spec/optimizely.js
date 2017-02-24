import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import mockModule from './../../_mockModule';
import * as dalDataTypes from './../../../mocks/dalDataTypes';

describe('ba/lib/dal/optimizely', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, Service] = [];

  beforeEach((done) => {
    // mock data
    window = {
      location: { protocol: 'https:' },
      require: sinon.stub().callsArg(1),
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = {};
    // register mocks
    // mockModule('https://cdn.optimizely.com/js/216755552.js', {});
    mockModule('gk/globals/window', window);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/optimizely'));
    System.import('ba/lib/dal/optimizely').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should execute only on checkout-confirmation page', () => {
    dalDataMock.page.type = 'test';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isUndefined(window.optimizely);
  });

  it('should lazy-load the global optimizely script using window.require', () => {
    dalDataMock.page.type = 'checkout-confirmation';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.require, ['https://cdn.optimizely.com/js/216755552.js']);
  });

  it('should populate the optimizely global on checkout-confirmation page', () => {
    dalDataMock.page.type = 'checkout-confirmation';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isDefined(window.optimizely);
  });

  return it('should pass the conversion value as cents on checkout-confirmation page', () => {
    dalDataMock.page.type = 'checkout-confirmation';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.optimizely[0], ['trackEvent', 'purchase', {
      revenue: dalDataMock.order.priceData.total * 100,
    }]);
  });
});
