import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../../systemjs.config';
import mockModule from './../../../_mockModule';
import * as dalDataTypes from './../../../../mocks/dalDataTypes';

describe('ba/lib/dal/aff/tharuka', () => {
  let [elementStub, window, dalApi, dalDataMock, dalConfigMock, Service, loggerSpy] = [];

  beforeEach((done) => {
    elementStub = { appendChild: sinon.spy() };
    window = {
      Date() { return { getTime() { return 1000000; } }; },
      document: {
        querySelector: sinon.stub().returns(elementStub),
        createElement: sinon.stub().returns(elementStub),
      },
      require: sinon.stub().callsArg(1),
    };
    dalApi = {};
    dalDataMock = dalDataTypes.getDALGlobalDataStub('checkout-confirmation');
    dalDataMock.order = dalDataTypes.getDALOrderDataStub();
    dalConfigMock = {
      shopId: 123,
    };
    // spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy() };
    // register mocks
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/aff/tharuka'));
    System.import('ba/lib/dal/aff/tharuka').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it("shouldn't do anything for any pageType except 'checkout-confirmation'", () => {
    dalDataMock.page.type = 'homepage';
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.isUndefined(window.THFilter);
    assert.isUndefined(window.THPrefill);
  });

  it('should create a global THFilter object in window with the expected data', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.THFilter, {
      anrede: dalDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau',
      plz: dalDataMock.order.customer.billingAddress.zip,
      land: dalDataMock.order.customer.billingAddress.countryCode,
      gebJahr: dalDataMock.order.customer.birthYear,
      gutscheincode: dalDataMock.order.couponCode || '',
    });
  });

  it('should create a global THPrefill object in window with the expected data', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    assert.deepEqual(window.THPrefill, {
      anrede: dalDataMock.order.customer.salutation === 'MR' ? 'Herr' : 'Frau',
      vorname: dalDataMock.order.customer.firstName,
      name: dalDataMock.order.customer.lastName,
      strasse: dalDataMock.order.customer.billingAddress.street,
      hausnummer: dalDataMock.order.customer.billingAddress.houseNr,
      plz: dalDataMock.order.customer.billingAddress.zip,
      ort: dalDataMock.order.customer.billingAddress.town,
      email: dalDataMock.order.customer.email,
      tel: dalDataMock.order.customer.phone,
      gebJahr: dalDataMock.order.customer.birthYear,
      gebTag: dalDataMock.order.customer.birthDate,
    });
  });

  it('should create a div element and set its id to "tharuka"', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.document.createElement, 'div');
    assert.equal(elementStub.id, 'tharuka');
  });

  it('should append the tharuka element to the desired container', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.document.querySelector, '#or-page__confirmation__tharuka');
    sinon.assert.calledWith(elementStub.appendChild, elementStub);
  });

  it('should require the tharuka script', () => {
    new Service(dalApi, dalDataMock, dalConfigMock);
    sinon.assert.calledWith(window.require, [`//tharuka-app.de/api/${dalConfigMock.accountId}/tharuka.js`]);
  });
});
