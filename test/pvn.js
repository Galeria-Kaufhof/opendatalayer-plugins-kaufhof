import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/bt/pvn', () => {
  let [Service, dalApi, dalDataMock, dalConfigMock, jqApi, loggerSpy, pixelHelperSpy, p1, p2, p3] = [];

  beforeEach((done) => {
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)];
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3]);
    dalConfigMock = { currency: 'MY$' };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    pixelHelperSpy = { addScript: sinon.spy() };
    jqApi = { post: sinon.spy() };
    // register mocks
    mockModule('jquery', jqApi);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/bt/pvn'));
    System.import('ba/lib/dal/bt/pvn').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("should add the pixel for pageType 'checkout-confirmation' and pass the relevant order data", () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperSpy.addScript, `https://partnerprogramm.galeria-kaufhof.de/trck/etrack/?campaign_id=1&trigger_id=1&token=${dalDataMock.order.id}&descr=&currency=${dalConfigMock.currency}&turnover=${dalDataMock.order.priceData.net}&vc=${dalDataMock.order.couponCode}&t=js`);
  });

  it('should pass the products information', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(jqApi.post, 'https://partnerprogramm.galeria-kaufhof.de/basket_tracking.php', sinon.match({
      basket: [{
        bestid: dalDataMock.order.id,
        productid: p1.ean,
        productname: p1.name,
        amount: p1.quantity,
        price: p1.priceData.net,
        category: p1.abteilungNummer,
      },
      {
        bestid: dalDataMock.order.id,
        productid: p2.ean,
        productname: p2.name,
        amount: p2.quantity,
        price: p2.priceData.net,
        category: p2.abteilungNummer,
      },
      {
        bestid: dalDataMock.order.id,
        productid: p3.ean,
        productname: p3.name,
        amount: p3.quantity,
        price: p3.priceData.net,
        category: p3.abteilungNummer,
      }],
    }));
  });
});
