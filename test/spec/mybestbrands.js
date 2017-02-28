// NOTE: mybestbrands got no unit test, due to the completely stupid script block
// they supply to their customers

/*
import { describe, it, beforeEach, afterEach } from 'mocha';
// import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe "mybestbrands", ->
  [injector, window, service, odlApi, odlDataMock, odlConfigMock, p1, p2, p3] = []

  beforeEach (done) ->
    window =
      document:
        location:
          protocol: "https"
    odlApi = {}
    odlDataMock = odlDataTypes.getODLGlobalDataStub("checkout-confirmation")
    [p1, p2, p3] = [odlDataTypes.getODLProductDataStub(123), odlDataTypes.getODLProductDataStub(456), odlDataTypes.getODLProductDataStub(789)]
    odlDataMock.order = odlDataTypes.getODLOrderDataStub([p1, p2, p3])
    odlConfigMock =
      advId: "foo-1234"
      trcDomain: "bla.blubb.test"
      currency: "MY$"
    injector = new Squire()
    injector.mock
      "gk/lib/logger": -> {log:->}
      "gk/globals/window": window
    injector.require ["ba/lib/odl/bt/mybestbrands"], (module) ->
      service = module
      done()

  it "should add the pixel for pageType 'checkout-confirmation'", ->
    new service(odlApi, odlDataMock, odlConfigMock)
    assert.isDefined(window.itsConv)

  it "should NOT add the pixel for any other pageType", ->
    odlDataMock.page.type = "homepage"
    new service(odlApi, odlDataMock, odlConfigMock)
    assert.isUndefined(window.itsConv)

  it "should add the expected global configuration in window.itsConv", ->
    new service(odlApi, odlDataMock, odlConfigMock)
    assert.equal(window.itsConv.advId, odlConfigMock.advId, "itsConv.advId missing")
    assert.equal(window.itsConv.trcDomain, odlConfigMock.trcDomain, "itsConv.trcDomain missing")

  it "should add the expected order information in window.itsConv", ->
    new service(odlApi, odlDataMock, odlConfigMock)
    assert.equal(window.itsConv.convId, odlDataMock.order.id, "itsConv.convId missing")
    assert.equal(window.itsConv.ordValue, odlDataMock.order.priceData.net, "itsConv.ordValue missing")
    assert.equal(window.itsConv.ordCurr, odlConfigMock.currency, "itsConv.ordCurr missing")

  it "should add the expected products in window.itsConv", ->
    new service(odlApi, odlDataMock, odlConfigMock)
    assert.deepEqual(JSON.parse(window.itsConv.basket), [
      {"pid": p1.ean, "prn": p1.name, "pri": p1.priceData.net, "qty": p1.quantity, "trc": "basket"}
      {"pid": p2.ean, "prn": p2.name, "pri": p2.priceData.net, "qty": p2.quantity, "trc": "basket"}
      {"pid": p3.ean, "prn": p3.name, "pri": p3.priceData.net, "qty": p3.quantity, "trc": "basket"}
    ])

*/