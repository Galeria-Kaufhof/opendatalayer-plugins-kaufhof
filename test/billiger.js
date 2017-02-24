import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/billiger', () => {
  let [Service, dalApi, dalDataMock, dalConfigMock, loggerSpy, pixelHelperSpy] = [];

  beforeEach((done) => {
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([
      dalDataTypes.getDALProductDataStub(123),
      dalDataTypes.getDALProductDataStub(456),
      dalDataTypes.getDALProductDataStub(789),
    ]);
    dalConfigMock = { shopId: 1234 };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addImage: sinon.spy() };
    // register mocks
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/billiger'));
    System.import('ba/lib/dal/bt/billiger').then(m => {
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
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`//billiger.de/sale?shop_id=${dalConfigMock.shopId}`));
  });

  it('should add the products info', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    dalDataMock.order.products.map((p, i) => {
      const num = i + 1;
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&aid_${num}=${p.ean}`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&name_${num}=${encodeURIComponent(p.name)}`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&cnt_${num}=${p.quantity}`));
      sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&val_${num}=${p.priceData.net}`));
    });
  });

  it('should add the order info', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperSpy.addImage, sinon.match(`&oid=${dalDataMock.order.id}`));
  });
});
