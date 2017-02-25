import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('pvn', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock, jqApi, p1, p2, p3] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    odlConfigMock = { currency: 'MY$' };
    jqApi = { post: sinon.spy() };
    // register mocks and overrides
    mocks = initMocks({ jquery: jqApi });
    // load module
    return setupModule('./src/plugins/pvn').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should add the pixel for pageType "checkout-confirmation" and pass the relevant order data', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addScript, `https://partnerprogramm.galeria-kaufhof.de/trck/etrack/?campaign_id=1&trigger_id=1&token=${odlDataMock.order.id}&descr=&currency=${odlConfigMock.currency}&turnover=${odlDataMock.order.priceData.net}&vc=${odlDataMock.order.couponCode}&t=js`);
  });

  it('should pass the products information', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(jqApi.post, 'https://partnerprogramm.galeria-kaufhof.de/basket_tracking.php', sinon.match({
      basket: [{
        bestid: odlDataMock.order.id,
        productid: p1.ean,
        productname: p1.name,
        amount: p1.quantity,
        price: p1.priceData.net,
        category: p1.abteilungNummer,
      },
      {
        bestid: odlDataMock.order.id,
        productid: p2.ean,
        productname: p2.name,
        amount: p2.quantity,
        price: p2.priceData.net,
        category: p2.abteilungNummer,
      },
      {
        bestid: odlDataMock.order.id,
        productid: p3.ean,
        productname: p3.name,
        amount: p3.quantity,
        price: p3.priceData.net,
        category: p3.abteilungNummer,
      }],
    }));
  });
});
