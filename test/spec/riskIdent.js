import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('ba/lib/odl/aff/riskIdent', () => {
  let [mocks, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    // mocks
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = { diSite: 'blaBlubb' };
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window._trboq = { push: sinon.spy() };
    // load module
    return setupModule('./src/plugins/riskIdent').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it("should do nothing if the pageType isnt 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'something';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isUndefined(mocks.odl.window.di);
  });

  it("should define the global di if pageType is 'checkout-confirmation'", () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.di, {
      t: odlDataMock.order.id,
      v: odlConfigMock.diSite,
      l: 'Checkout',
    });
  });

  it('should add the DI script', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addScript, `//www.jsctool.com/${odlConfigMock.diSite}/di.js`);
  });

  it('should add the DI SWF', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match('flashvars'));
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match(odlConfigMock.diSite));
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match(odlDataMock.order.id.toString()));
  });

  return it('should add the DI CSS', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match('stylesheet'));
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match('jsctool'));
    sinon.assert.calledWith(mocks.odl.helpers.addHTML, 'BODY', sinon.match(odlConfigMock.diSite));
  });
});
