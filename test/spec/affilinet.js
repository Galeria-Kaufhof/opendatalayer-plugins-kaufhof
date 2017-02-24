import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import mockModule from 'systemjs-mock-module';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import jsdom from 'jsdom';
import './../systemjs.config';

describe('opendatalayer-plugins-kaufhof/affilinet', () => {
  let [Service, odlApi, odlDataMock, odlConfigMock, odlMock, loggerSpy] = [];

  beforeEach((done) => {
    // spies
    odlMock = {
      window: jsdom.jsdom('<html><body></body></html>').defaultView,
      Logger: () => loggerSpy,
      helpers: { addScript: sinon.spy(), addImage: sinon.spy() },
    };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
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
    mockModule(System, 'opendatalayer', odlMock);
    // clear module first
    System.delete(System.normalizeSync('./src/plugins/affilinet'));
    System.import('./src/plugins/affilinet').then((m) => {
      Service = m.default;
      done();
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
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`//partners.webmasterplan.com/registersale.asp?site=${odlConfigMock.site}`));
  });

  it('should add the products info', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    odlDataMock.order.products.map((p) => {
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`ArticleNb%3D${p.ean}%26`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`ProductName%3D${escape(p.name)}%26`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`Category%3D${escape(encodeURIComponent(p.abteilungNummer))}%26`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`Quantity%3D${escape(p.quantity)}%26`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`SinglePrice%3D${escape(parseFloat(p.priceData.net).toFixed(2))}%26`));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match('Brand%3D%26'));
      sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match('%0D%0A'));
    });
  });

  it('should add the order info', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&price=${odlDataMock.order.priceData.net}`));
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&order=${odlDataMock.order.id}`));
    sinon.assert.calledWith(odlMock.helpers.addImage, sinon.match(`&vcode=${odlDataMock.order.couponCode}`));
  });
});
