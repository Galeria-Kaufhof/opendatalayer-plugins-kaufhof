import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('sovendus', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = {
      shopId: 123,
      currency: 'MY$',
    };
    // register mocks
    mocks = initMocks();
    mocks.odl.window.Date = () => ({ getTime: sinon.stub().returns(1000000) });
    // load module
    return setupModule('./src/plugins/sovendus').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it("shouldn't do anything for any pageType except 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isUndefined(mocks.odl.window._gconData);
  });

  it('should create a global _gconData in mocks.odl.window', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isArray(mocks.odl.window._gconData);
  });

  it('should add the container element to the correct parent', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, sinon.match('page__confirmation__sovendus'), sinon.match('gutscheinconnection-container1'));
  });

  it('should push all required base data to the global _gconData object', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window._gconData, [
      ['_shopId', odlConfigMock.shopId],
      ['_bannerId', odlConfigMock.bannerId],
      ['_sessionId', ''],
      ['_timestamp', 1000],
      ['_customerSalutation', odlDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau'],
      ['_customerFirstName', odlDataMock.order.customer.firstName],
      ['_customerLastName', odlDataMock.order.customer.lastName],
      ['_customerEmail', odlDataMock.order.customer.email],
      ['_orderId', odlDataMock.order.id],
      ['_orderValue', odlDataMock.order.priceData.net],
      ['_orderCurrency', odlConfigMock.currency],
      ['_usedCouponCode', ''],
      ['_checksum', ''],
      ['_htmlElementId', 'gutscheinconnection-container1'],
    ]);
  });

  it('should set the correct salutation for women', () => {
    odlDataMock.order.customer.salutation = 'MRS';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.include(JSON.stringify(mocks.odl.window._gconData), JSON.stringify(['_customerSalutation', 'Frau']));
  });

  it('should set a coupon code', () => {
    odlDataMock.order.couponCode = 'BLARG';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.include(JSON.stringify(mocks.odl.window._gconData), JSON.stringify(['_usedCouponCode', 'BLARG']));
  });

  it('should add the script to the DOM', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addScript, '//api.gutscheinconnection.de/js/client.js');
  });
});
