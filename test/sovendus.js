import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/sovendus', () => {
  let [window, dalApi, dalDataMock, dalConfigMock, pixelHelperApi, Service, loggerSpy] = [];

  beforeEach(function (done) {
    window = {
      Date() {
        return {
          getTime() {
            return 1000000;
          },
        };
      },
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = {
      shopId: 123,
      currency: 'MY$',
    };
    // spies
    pixelHelperApi = { addScript: sinon.stub(), addHTML: sinon.spy() };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/lib/pixelHelper', pixelHelperApi);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/sovendus'));
    System.import('ba/lib/dal/aff/sovendus').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("shouldn't do anything for any pageType except 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isUndefined(window._gconData);
  });

  it('should create a global _gconData in window', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isArray(window._gconData);
  });

  it('should add the container element to the correct parent', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperApi.addHTML, sinon.match('page__confirmation__sovendus'), sinon.match('gutscheinconnection-container1'));
  });

  it('should push all required base data to the global _gconData object', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window._gconData, [
      ['_shopId', dalConfigMock.shopId],
      ['_bannerId', dalConfigMock.bannerId],
      ['_sessionId', ''],
      ['_timestamp', 1000],
      ['_customerSalutation', dalDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau'],
      ['_customerFirstName', dalDataMock.order.customer.firstName],
      ['_customerLastName', dalDataMock.order.customer.lastName],
      ['_customerEmail', dalDataMock.order.customer.email],
      ['_orderId', dalDataMock.order.id],
      ['_orderValue', dalDataMock.order.priceData.net],
      ['_orderCurrency', dalConfigMock.currency],
      ['_usedCouponCode', ''],
      ['_checksum', ''],
      ['_htmlElementId', 'gutscheinconnection-container1'],
    ]);
  }
  );

  it('should set the correct salutation for women', () => {
    dalDataMock.order.customer.salutation = 'MRS';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.include(JSON.stringify(window._gconData), JSON.stringify(['_customerSalutation', 'Frau']));
  }
  );

  it('should set a coupon code', () => {
    dalDataMock.order.couponCode = 'BLARG';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.include(JSON.stringify(window._gconData), JSON.stringify(['_usedCouponCode', 'BLARG']));
  }
  );

  return it('should add the script to the DOM', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(pixelHelperApi.addScript, '//api.gutscheinconnection.de/js/client.js');
  }
  );
}
);
