import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('opendatalayer-plugins-kaufhof/affilinet', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // mocks
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([
      odlDataTypes.getODLProductDataStub(123),
      odlDataTypes.getODLProductDataStub(456),
      odlDataTypes.getODLProductDataStub(789),
    ]);
    odlConfigMock = { shopId: 1234 };
    // register mocks
    mocks = initMocks();
    // load module
    return setupModule('./src/plugins/billiger').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it("should add the pixel for pageType 'checkout-confirmation'", () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.called(mocks.odl.helpers.addImage);
  });

  it('should NOT add the pixel for any other pageType', () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(mocks.odl.helpers.addImage);
  });

  it('should add the correct URL and partner ID', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`//billiger.de/sale?shop_id=${odlConfigMock.shopId}`));
  });

  it('should add the products info', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    odlDataMock.order.products.map((p, i) => {
      const num = i + 1;
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&aid_${num}=${p.ean}`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&name_${num}=${encodeURIComponent(p.name)}`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&cnt_${num}=${p.quantity}`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&val_${num}=${p.priceData.net}`));
    });
  });

  it('should add the order info', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&oid=${odlDataMock.order.id}`));
  });
});
