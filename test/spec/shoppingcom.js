/* eslint-disable no-underscore-dangle */
import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('shoppingcom', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock, p1, p2, p3] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)];
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3]);
    odlConfigMock = { merchantId: '12345foo' };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window._roi = { push: sinon.spy() };
    // getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    // load module
    return setupModule('./src/plugins/shoppingcom').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  describe('checkout-confirmation', () => {
    beforeEach(() => new Plugin(odlApi, odlDataMock, odlConfigMock));

    it('should define a window._roi global', () => {
      assert.isDefined(mocks.odl.window._roi);
    });

    it('should push a merchantId to _roi', () => {
      sinon.assert.calledWith(mocks.odl.window._roi.push, ['_setMerchantId', odlConfigMock.merchantId]);
    });

    it('should push the total order revenue to _roi', () => {
      sinon.assert.calledWith(mocks.odl.window._roi.push, ['_setOrderAmount', odlDataMock.order.priceData.total]);
    });

    it('should push the products details to _roi', () => {
      odlDataMock.order.products.forEach((p) => {
        sinon.assert.calledWith(mocks.odl.window._roi.push, ['_addItem',
          p.aonr, p.name, '', p.category, p.priceData.total, p.quantity]);
      });
    });

    it('should track a transaction event', () => {
      sinon.assert.calledWith(mocks.odl.window._roi.push, ['_trackTrans']);
    });

    it('should append the shopping.com script to the DOM', () => {
      sinon.assert.calledWith(mocks.odl.helpers.addScript, sinon.match('//stat.dealtime.com/ROI/ROI2.js'));
    });
  });
});
