import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('tharuka', () => {
  let [mocks, parentContainer, odlApi, odlDataMock, odlConfigMock, Plugin] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = {
      shopId: 123,
    };
    // register mocks
    mocks = initMocks();
    mocks.odl.window.require = sinon.stub().callsArg(1);
    mocks.odl.window.Date = () => ({ getTime: sinon.stub().returns(1000000) });
    // create fake parent container
    parentContainer = mocks.odl.window.document.createElement('div');
    parentContainer.id = 'or-page__confirmation__tharuka';
    mocks.odl.window.document.querySelector('body').appendChild(parentContainer);
    // load module
    return setupModule('./src/plugins/tharuka').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it("shouldn't do anything for any pageType except 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'homepage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isUndefined(mocks.odl.window.THFilter);
    assert.isUndefined(mocks.odl.window.THPrefill);
  });

  it('should create a global THFilter object in mocks.odl.window with the expected data', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.THFilter, {
      anrede: odlDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau',
      plz: odlDataMock.order.customer.billingAddress.zip,
      land: odlDataMock.order.customer.billingAddress.countryCode,
      gebJahr: odlDataMock.order.customer.birthYear,
      gutscheincode: odlDataMock.order.couponCode || '',
    });
  });

  it('should create a global THPrefill object in mocks.odl.window with the expected data', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.deepEqual(mocks.odl.window.THPrefill, {
      anrede: odlDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau',
      vorname: odlDataMock.order.customer.firstName,
      name: odlDataMock.order.customer.lastName,
      strasse: odlDataMock.order.customer.billingAddress.street,
      hausnummer: odlDataMock.order.customer.billingAddress.houseNr,
      plz: odlDataMock.order.customer.billingAddress.zip,
      ort: odlDataMock.order.customer.billingAddress.town,
      email: odlDataMock.order.customer.email,
      tel: odlDataMock.order.customer.phone,
      gebJahr: odlDataMock.order.customer.birthYear,
      gebTag: odlDataMock.order.customer.birthDate,
    });
  });

  it('should create a div element, set its id to "tharuka" and add it to the correct container', () => {
    // instantiate plugin and see if child was created in parent
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    const tharukaDiv = mocks.odl.window.document.querySelector('#tharuka');
    assert.isObject(tharukaDiv);
    assert.equal(tharukaDiv.tagName.toLowerCase(), 'div');
    assert.equal(tharukaDiv.parentNode, parentContainer);
  });

  it('should require the tharuka script', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.require, [`//tharuka-app.de/api/${odlConfigMock.accountId}/tharuka.js`]);
  });
});
