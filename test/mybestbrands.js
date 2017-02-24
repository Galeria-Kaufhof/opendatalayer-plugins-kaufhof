// NOTE: mybestbrands got no unit test, due to the completely stupid script block
// they supply to their customers

/*
Squire = require("../../../_squire")
chai = require("chai")
sinon = require("sinon")
assert = chai.assert
dalDataTypes = require("../../../../mocks/dalDataTypes")

describe "ba/lib/dal/bt/mybestbrands", ->
  [injector, window, service, dalApi, dalDataMock, dalConfigMock, p1, p2, p3] = []

  beforeEach (done) ->
    window =
      document:
        location:
          protocol: "https"
    dalApi = {}
    dalDataMock = dalDataTypes.getDALGlobalDataStub("checkout-confirmation")
    [p1, p2, p3] = [dalDataTypes.getDALProductDataStub(123), dalDataTypes.getDALProductDataStub(456), dalDataTypes.getDALProductDataStub(789)]
    dalDataMock.order = dalDataTypes.getDALOrderDataStub([p1, p2, p3])
    dalConfigMock =
      advId: "foo-1234"
      trcDomain: "bla.blubb.test"
      currency: "MY$"
    injector = new Squire()
    injector.mock
      "gk/lib/logger": -> {log:->}
      "gk/globals/window": window
    injector.require ["ba/lib/dal/bt/mybestbrands"], (module) ->
      service = module
      done()

  it "should add the pixel for pageType 'checkout-confirmation'", ->
    new service(dalApi, dalDataMock, dalConfigMock)
    assert.isDefined(window.itsConv)

  it "should NOT add the pixel for any other pageType", ->
    dalDataMock.page.type = "homepage"
    new service(dalApi, dalDataMock, dalConfigMock)
    assert.isUndefined(window.itsConv)

  it "should add the expected global configuration in window.itsConv", ->
    new service(dalApi, dalDataMock, dalConfigMock)
    assert.equal(window.itsConv.advId, dalConfigMock.advId, "itsConv.advId missing")
    assert.equal(window.itsConv.trcDomain, dalConfigMock.trcDomain, "itsConv.trcDomain missing")

  it "should add the expected order information in window.itsConv", ->
    new service(dalApi, dalDataMock, dalConfigMock)
    assert.equal(window.itsConv.convId, dalDataMock.order.id, "itsConv.convId missing")
    assert.equal(window.itsConv.ordValue, dalDataMock.order.priceData.net, "itsConv.ordValue missing")
    assert.equal(window.itsConv.ordCurr, dalConfigMock.currency, "itsConv.ordCurr missing")

  it "should add the expected products in window.itsConv", ->
    new service(dalApi, dalDataMock, dalConfigMock)
    assert.deepEqual(JSON.parse(window.itsConv.basket), [
      {"pid": p1.ean, "prn": p1.name, "pri": p1.priceData.net, "qty": p1.quantity, "trc": "basket"}
      {"pid": p2.ean, "prn": p2.name, "pri": p2.priceData.net, "qty": p2.quantity, "trc": "basket"}
      {"pid": p3.ean, "prn": p3.name, "pri": p3.priceData.net, "qty": p3.quantity, "trc": "basket"}
    ])

*/