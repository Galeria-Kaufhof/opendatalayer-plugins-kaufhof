import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('affilinet', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // mock data
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([
      odlDataTypes.getODLProductDataStub(123),
      odlDataTypes.getODLProductDataStub(456),
      odlDataTypes.getODLProductDataStub(789),
    ]);
    odlConfigMock = { site: 1234 };
    // register mocks
    mocks = initMocks();
    // load module
    return setupModule('./src/plugins/affilinet').then(() => {
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
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`//partners.webmasterplan.com/registersale.asp?site=${odlConfigMock.site}`));
  });

  it('should add the products info', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    odlDataMock.order.products.map((p) => {
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`ArticleNb%3D${p.ean}%26`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`ProductName%3D${escape(p.name)}%26`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`Category%3D${escape(encodeURIComponent(p.abteilungNummer))}%26`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`Quantity%3D${escape(p.quantity)}%26`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`SinglePrice%3D${escape(parseFloat(p.priceData.net).toFixed(2))}%26`));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match('Brand%3D%26'));
      sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match('%0D%0A'));
    });
  });

  it('should add the order info', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&price=${odlDataMock.order.priceData.net}`));
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&order=${odlDataMock.order.id}`));
    sinon.assert.calledWith(mocks.odl.helpers.addImage, sinon.match(`&vcode=${odlDataMock.order.couponCode}`));
  });
});
