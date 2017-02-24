import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import mockModule from 'systemjs-mock-module';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import jsdom from 'jsdom';
import './../systemjs.config';

describe('opendatalayer-plugins-kaufhof/affilinet', () => {
  let [Service, odlApi, odlDataMock, odlConfigMock, odlMock, loggerSpy] = [];

  beforeEach(() => {
    // spies
    odlMock = {
      window: jsdom.jsdom('<html><body></body></html>').defaultView,
      Logger: () => loggerSpy,
      helpers: { addScript: sinon.spy(), addImage: sinon.spy() },
    };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
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
    mockModule(System, 'opendatalayer', odlMock);
    // clear module first
    System.delete(System.normalizeSync('./src/plugins/billiger'));
    return System.import('./src/plugins/billiger').then((m) => {
      Service = m.default;
    }).catch(err => console.error(err));
  });

  it("should add the pixel for pageType 'checkout-confirmation'", () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.called(odlMock.helpers.addImage);
  });

  it('should NOT add the pixel for any other pageType', () => {
    odlDataMock.page.type = 'homepage';
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(odlMock.helpers.addImage);
  });

  it('should add the correct URL and partner ID', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`//billiger.de/sale?shop_id=${odlConfigMock.shopId}`));
  });

  it('should add the products info', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    odlDataMock.order.products.map((p, i) => {
      const num = i + 1;
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&aid_${num}=${p.ean}`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&name_${num}=${encodeURIComponent(p.name)}`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&cnt_${num}=${p.quantity}`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&val_${num}=${p.priceData.net}`));
    });
  });

  it('should add the order info', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&oid=${odlDataMock.order.id}`));
  });
});
