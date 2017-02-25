import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('optimizely', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    // mock data
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = {};
    // register mocks
    // mockModule('https://cdn.optimizely.com/js/216755552.js', {});
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window.require = sinon.stub().callsArg(1);
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    // load module
    return setupModule('./src/plugins/optimizely').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should execute only on checkout-confirmation page', () => {
    odlDataMock.page.type = 'test';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isUndefined(mocks.odl.window.optimizely);
  });

  it('should lazy-load the global optimizely script using window.require', () => {
    odlDataMock.page.type = 'checkout-confirmation';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.require, ['https://cdn.optimizely.com/js/216755552.js']);
  });

  it('should populate the optimizely global on checkout-confirmation page', () => {
    odlDataMock.page.type = 'checkout-confirmation';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isDefined(mocks.odl.window.optimizely);
  });

  return it('should pass the conversion value as cents on checkout-confirmation page', () => {
    odlDataMock.page.type = 'checkout-confirmation';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.optimizely[0], ['trackEvent', 'purchase', {
      revenue: odlDataMock.order.priceData.total * 100,
    }]);
  });
});
