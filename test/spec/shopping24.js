import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('shopping24', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock, p1, p2, p3] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    odlConfigMock = { hashId: 'adbjhHV6' };
    // register mocks and overrides
    mocks = initMocks();
    // load module
    return setupModule('./src/plugins/shopping24').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('checkout-confirmation', () => {
    beforeEach(() => new Plugin(odlApi, odlDataMock, odlConfigMock));

    it('should call the correct URL', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match('https://tracking.s24.com/TrackOrder?'));
    });

    it('should pass the correct account id', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`shopId=${odlConfigMock.hashId}`));
    });

    it('should pass the correct net value', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&netRevenue=${odlDataMock.order.priceData.net}`));
    });

    it('should pass an empty string as shipping amount', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&shipping=`));
    });

    it('should pass the correct product AONRs', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&products=${p1.aonr},${p2.aonr},${p3.aonr}`));
    });

    it('should pass the correct number of products', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match('&lineItems=3'));
    });

    it('should pass the correct order id', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&orderNumber=${odlDataMock.order.id}`));
    });
  });
});
