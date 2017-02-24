import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/riskIdent', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, Service, loggerSpy, pixelHelperApi] = [];

  beforeEach((done) => {
    // mocks
    window = {};
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = { diSite: 'blaBlubb' };
    // spies
    pixelHelperApi = { addScript: sinon.stub(), addHTML: sinon.spy() };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperApi);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/riskIdent'));
    System.import('ba/lib/dal/aff/riskIdent').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("should do nothing if the pageType isnt 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'something';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isUndefined(window.di);
  });

  it("should define the global di if pageType is 'checkout-confirmation'", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.di, {
      t: dalDataMock.order.id,
      v: dalConfigMock.diSite,
      l: 'Checkout',
    });
  });

  it('should add the DI script', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperApi.addScript, `//www.jsctool.com/${dalConfigMock.diSite}/di.js`);
  });

  it('should add the DI SWF', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match('flashvars'));
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match(dalConfigMock.diSite));
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match(dalDataMock.order.id.toString()));
  });

  return it('should add the DI CSS', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match('stylesheet'));
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match('jsctool'));
    sinon.assert.calledWith(pixelHelperApi.addHTML, 'BODY', sinon.match(dalConfigMock.diSite));
  });
});
