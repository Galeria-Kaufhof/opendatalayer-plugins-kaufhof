import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('adwordsConversion', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // spies
    // mock data
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub('checkout-confirmation');
    odlDataMock.order = odlDataTypes.getODLOrderDataStub();
    odlConfigMock = {
      conversionId: 123456789,
      conversionLabel: 'bla123Blubb',
      conversionCurrency: 'MY$',
    };
    // register mocks
    mocks = initMocks();
    mocks.odl.window.require = sinon.stub().callsArg(1);
    mocks.odl.window.google_trackConversion = sinon.stub();
    // load module
    return setupModule('./src/plugins/adwordsConversion').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should lazy-load the global googleadservices script', () => {
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/someurl.foo'); // force https protocol!
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.require, ['https://www.googleadservices.com/pagead/conversion_async.js']);
  });

  it('should define the static globals', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({
      google_conversion_id: odlConfigMock.conversionId,
      google_conversion_label: odlConfigMock.conversionLabel,
      google_remarketing_only: false,
      google_conversion_format: 3,
      google_conversion_currency: odlConfigMock.conversionCurrency,
    }));
  });

  it("should track the correct conversion value if the pageType is 'checkout-confirmation'", () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(mocks.odl.window.google_trackConversion, sinon.match({ google_conversion_value: odlDataMock.order.priceData.total }));
  });

  it("should not track anything if the pageType isnt 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'someotherpage';
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(mocks.odl.window.google_trackConversion);
  });
});
