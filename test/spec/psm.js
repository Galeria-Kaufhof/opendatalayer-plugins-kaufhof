import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('psm', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock, p1, p2, p3, A3320Api] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    odlConfigMock = { advertiserId: 123 };
    // register mocks and overrides
    A3320Api = { trackEvent: sinon.spy() };
    mocks = initMocks({ './src/lib/A3320_tracking': A3320Api });
    // load module
    return setupModule('./src/plugins/psm').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should add the pixel for pageType "checkout-confirmation" and pass the relevant data', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(A3320Api.trackEvent, sinon.match({
      billing_advid: odlConfigMock.advertiserId,
      billing_orderid: odlDataMock.order.id,
      billing_sum: odlDataMock.order.priceData.net,
    }));
  });

  it('should NOT add the pixel for any other pageType', () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(A3320Api.trackEvent);
  });

  it('should provide the expected products to trackEvent', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(A3320Api.trackEvent, sinon.match({
      ec_Event: [
        ['buy', p1.ean, p1.name, p1.priceData.net, mocks.odl.window.encodeURIComponent(p1.category), p1.quantity, 'NULL', 'NULL', 'NULL'],
        ['buy', p2.ean, p2.name, p2.priceData.net, mocks.odl.window.encodeURIComponent(p2.category), p2.quantity, 'NULL', 'NULL', 'NULL'],
        ['buy', p3.ean, p3.name, p3.priceData.net, mocks.odl.window.encodeURIComponent(p3.category), p3.quantity, 'NULL', 'NULL', 'NULL'],
      ],
    }));
  });
});
