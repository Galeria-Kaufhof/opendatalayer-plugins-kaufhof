import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import System from 'systemjs';
import mockModule from 'systemjs-mock-module';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import jsdom from 'jsdom';
import './../systemjs.config';

describe('opendatalayer-plugins-kaufhof/adwordsConversion', () => {
  let [odlMock, Service, loggerSpy, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    // spies
    odlMock = {
      window: jsdom.jsdom('<html><body></body></html>').defaultView,
      Logger: () => loggerSpy,
      helpers: { addScript: sinon.spy() },
    };
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    odlMock.window.require = sinon.stub().callsArg(1);
    odlMock.window.google_trackConversion = sinon.stub();
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
    mockModule(System, 'opendatalayer', odlMock);
    // clear module first
    System.delete(System.normalizeSync('./src/plugins/adwordsConversion'));
    return System.import('./src/plugins/adwordsConversion').then((m) => {
      Service = m.default;
    }).catch(err => console.error(err));
  });

  it('should lazy-load the global googleadservices script', () => {
    jsdom.changeURL(odlMock.window, 'https://example.com/someurl.foo'); // force https protocol!
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.window.require, ['https://www.googleadservices.com/pagead/conversion_async.js']);
  });

  it('should define the static globals', () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.window.google_trackConversion, sinon.match({
      google_conversion_id: odlConfigMock.conversionId,
      google_conversion_label: odlConfigMock.conversionLabel,
      google_remarketing_only: false,
      google_conversion_format: 3,
      google_conversion_currency: odlConfigMock.conversionCurrency,
    }));
  });

  it("should track the correct conversion value if the pageType is 'checkout-confirmation'", () => {
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.calledWith(odlMock.window.google_trackConversion, sinon.match({ google_conversion_value: odlDataMock.order.priceData.total }));
  });

  it("should not track anything if the pageType isnt 'checkout-confirmation'", () => {
    odlDataMock.page.type = 'someotherpage';
    new Service(odlApi, odlDataMock, odlConfigMock);
    sinon.assert.notCalled(odlMock.window.google_trackConversion);
  });
});
