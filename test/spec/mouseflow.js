import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
// import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks } from './../_testHelper';

describe('mouseflow', () => {
  let [mocks, Plugin, odlApi, odlDataMock, odlConfigMock] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    odlConfigMock = { uuid: 'kasjhf-asf-asf-as-fa-sf-asf' };
    // create mocks
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    // register mocks and overrides
    mocks = initMocks();
    // load module
    return setupModule('./src/plugins/mouseflow').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should create a global window._mfq array', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    assert.isArray(mocks.odl.window._mfq);
  });

  it('should create the Mouseflow script element and add it to the DOM', () => {
    new Plugin(odlApi, odlDataMock, odlConfigMock);
    const mfElement = mocks.odl.window.document.getElementsByTagName('script')[0];
    assert.isDefined(mfElement);
    assert.equal(mfElement.tagName.toLowerCase(), 'script');
    assert.equal(mfElement.src, `//cdn.mouseflow.com/projects/${odlConfigMock.uuid}.js`);
  });
});
