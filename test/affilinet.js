import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/affilinet', () => {
  let [Service, dalApi, dalDataMock, dalConfigMock, pixelHelperSpy, loggerSpy] = [];

  beforeEach((done) => {
    // mock data
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([
      dalDataTypes.getDALProductDataStub(123),
      dalDataTypes.getDALProductDataStub(456),
      dalDataTypes.getDALProductDataStub(789),
    ]);
    dalConfigMock = { site: 1234 };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addImage: sinon.spy() };
    // register mocks
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/affilinet'));
    System.import('ba/lib/dal/bt/affilinet').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("should add the pixel for pageType 'checkout-confirmation'", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.called(pixelHelperSpy.addImage);
  });

  it('should NOT add the pixel for any other pageType', () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.notCalled(pixelHelperSpy.addImage);
  });

  it('should add the correct URL and partner ID', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`//partners.webmasterplan.com/registersale.asp?site=${dalConfigMock.site}`));
  });

  it('should add the products info', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    dalDataMock.order.products.map((p) => {
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`ArticleNb%3D${p.ean}%26`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`ProductName%3D${escape(p.name)}%26`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`Category%3D${escape(encodeURIComponent(p.abteilungNummer))}%26`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`Quantity%3D${escape(p.quantity)}%26`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`SinglePrice%3D${escape(parseFloat(p.priceData.net).toFixed(2))}%26`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match('Brand%3D%26'));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match('%0D%0A'));
    });
  });

  it('should add the order info', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&price=${dalDataMock.order.priceData.net}`));
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&order=${dalDataMock.order.id}`));
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&vcode=${dalDataMock.order.couponCode}`));
  });
});
