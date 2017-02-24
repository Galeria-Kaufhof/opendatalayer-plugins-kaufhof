import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
// import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import * as dalDataTypes from './../../../mocks/dalDataTypes';
import mockModule from './../../_mockModule';
import domMock from './../../../mocks/domMock';

describe('ba/lib/dal/mouseflow', () => {
  let [windowSpy, Service, dalApi, dalDataMock, dalConfigMock] = [];

  beforeEach((done) => {
    windowSpy = domMock;
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub();
    dalConfigMock =
      { uuid: 'kasjhf-asf-asf-as-fa-sf-asf' };
    // create mocks
    dalDataMock = {
      page: { type: 'unittest', name: 'Testpage' },
      site: { id: 'jump_dev' },
      user: { id: null },
    };
    // register mocks
    mockModule('gk/globals/window', windowSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/mouseflow'));
    System.import('ba/lib/dal/mouseflow').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should create a global window._mfq array', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isArray(windowSpy._mfq);
  });

  it('should create the Mouseflow script element and add it to the DOM', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isDefined(domMock.createdEl);
    assert.equal(domMock.createdEl.tagName, 'script');
    assert.equal(domMock.createdEl.src, `//cdn.mouseflow.com/projects/${dalConfigMock.uuid}.js`);
    assert.equal(domMock.appendedEl, domMock.createdEl);
  });
});
