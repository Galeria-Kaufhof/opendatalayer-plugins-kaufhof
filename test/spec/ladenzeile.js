import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('ladenzeile', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock, p1, p2, p3] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    odlConfigMock = {
      trackingId: 'foo-1234',
      currency: 'MY$',
    };
    // register mocks and overrides
    mocks = initMocks();
    // load module
    return setupModule('./src/plugins/ladenzeile').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it("should add the pixel for pageType 'checkout-confirmation'", () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addScript, '//www.ladenzeile.de/controller/visualMetaTrackingJs');
  });

  it('should NOT add the pixel for any other pageType', () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(mocks.odl.helpers.addScript);
  });

  it('should add the expected trackingId in window.vmt_pi', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.equal(mocks.odl.window.vmt_pi.trackingId, odlConfigMock.trackingId);
  });

  it('should add the expected order value in window.vmt_pi', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.equal(mocks.odl.window.vmt_pi.amount, odlDataMock.order.priceData.total);
  });

  it('should set the product SKUs in window.vmt_pi', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.vmt_pi.skus, [p1.ean, p2.ean, p3.ean]);
  });

  it('should set the product prices in window.vmt_pi', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.vmt_pi.prices, [p1.priceData.net, p2.priceData.net, p3.priceData.net]);
  });

  it('should pass expected currency in window.vmt_pi', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.equal(mocks.odl.window.vmt_pi.currency, odlConfigMock.currency);
  });
});
