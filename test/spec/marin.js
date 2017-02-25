import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('marin', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = { accountId: 'bla1234' };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window._mTrack = [];
    mocks.odl.window._mTrack.push = sinon.spy();
    // load module
    return setupModule('./src/plugins/marin').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should define the global _mTrack', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isDefined(mocks.odl.window._mTrack);
    return assert.isArray(mocks.odl.window._mTrack);
  });

  it('should append the marin pixel to the DOM', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    return sinon.assert.calledWith(mocks.odl.helpers.addScript, `//tracker.marinsm.com/tracker/async/${odlConfigMock.accountId}.js`);
  });

  it("should add the common 'anonymizeIp' flags for any pagetype", () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    return sinon.assert.calledWith(mocks.odl.window._mTrack.push, ['activateAnonymizeIp']);
  });

  it("should add the common 'trackPage' flags for any pagetype", () => {
    ['homepage', 'category', 'search', 'productdetail', 'checkout-cart'].map((type) => {
      odlDataMock.page.type = type;
      new Plugin(odlApi, odlDataMock, odlConfigMock);
      sinon.assert.calledWith(mocks.odl.window._mTrack.push, ['activateAnonymizeIp']);
    });
  });

  it("should add the 'processOrders' flag for pageType 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'checkout-confirmation';
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    return sinon.assert.calledWith(mocks.odl.window._mTrack.push, ['processOrders']);
  });

  it("should add the 'addTrans' data with convType 'order' for pageType 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'checkout-confirmation';
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    return sinon.assert.calledWith(mocks.odl.window._mTrack.push, ['addTrans', {
      currency: 'EUR',
      items: [{
        convType: 'order',
        price: odlDataMock.order.priceData.total,
        orderId: odlDataMock.order.id,
      }],
    }]);
  });

  return it("should add the 'addTrans' data with convType 'nl_lead' for pageType 'newsletter-confirm'", () => {
    odlDataMock.page.type = 'newsletter-subscribed';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    return sinon.assert.calledWith(mocks.odl.window._mTrack.push, ['addTrans', {
      currency: 'EUR',
      items: [{
        convType: 'nl_lead',
        price: '',
        orderId: '',
      }],
    }]);
  });
});
