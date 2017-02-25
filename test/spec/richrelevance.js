import { describe, it, beforeEach, afterEach } from 'mocha';
// import { assert } from 'chai';
import * as sinon from 'sinon';
import * as odlDataTypes from 'opendatalayer-datatype-mocks';
import { setupModule, getPluginConstructor, initMocks, getJSDOM } from './../_testHelper';

describe('richrelevance', () => {
  let [mocks, Plugin, odlApi, odlDataMock] = [];

  beforeEach(() => {
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window.require = sinon.stub().callsArg(1);
    getJSDOM().changeURL(mocks.odl.window, 'https://example.com/foo');
    // load module
    return setupModule('./src/plugins/richrelevance').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  it('should handle a not available RR', () => {
    // this test succeeds if there is no error
    new Plugin(odlApi, odlDataMock, {});
  });

  it('should lazy-load the global RR script using window.require', () => {
    new Plugin(odlApi, odlDataMock, {});
    sinon.assert.calledWith(mocks.odl.window.require, ['https://media.richrelevance.com/rrserver/js/1.2/p13n.js']);
  });
});

describe('ba/lib/odl/richrelevance', () => {
  let [mocks, Plugin, odlApi, odlDataMock, r3CommonMock, r3SearchMock, r3CategoryMock, r3ItemMock, r3CartMock, r3PurchasedMock] = [];
  beforeEach(() => {
    // mock r3* APIs
    const r3CommonApi = {
      setApiKey() {},
      setBaseUrl() {},
      setClickthruServer() {},
      setSessionId() {},
      setUserId() {},
      forceDevMode() {},
      addPlacementType() {},
      addCategoryHintId() {},
      setPageBrand() {},
    };
    const r3SearchApi = {
      setTerms() {},
      addItemId() {},
    };
    const r3CategoryApi = {
      setId() {},
      setName() {},
    };
    const r3ItemApi = {
      setId() {},
      setName() {},
    };
    const r3CartApi = { addItemId() {} };
    const r3PurchasedApi = {
      setOrderNumber() {},
      addItemIdPriceQuantity() {},
    };
    r3CommonMock = sinon.mock(r3CommonApi);
    r3SearchMock = sinon.mock(r3SearchApi);
    r3CategoryMock = sinon.mock(r3CategoryApi);
    r3ItemMock = sinon.mock(r3ItemApi);
    r3CartMock = sinon.mock(r3CartApi);
    r3PurchasedMock = sinon.mock(r3PurchasedApi);
    const RrApi = {
      jsonCallback(callback) {
        return callback();
      },
    };
    odlApi = {};
    odlDataMock = odlDataTypes.getODLGlobalDataStub();
    // register mocks and overrides
    mocks = initMocks();
    mocks.odl.window.r3_common = () => r3CommonMock.object;
    mocks.odl.window.r3_search = () => r3SearchMock.object;
    mocks.odl.window.r3_category = () => r3CategoryMock.object;
    mocks.odl.window.r3_item = () => r3ItemMock.object;
    mocks.odl.window.r3_cart = () => r3CartMock.object;
    mocks.odl.window.r3_purchased = () => r3PurchasedMock.object;
    mocks.odl.window.r3_personal = sinon.spy();
    mocks.odl.window.r3_home = sinon.spy();
    mocks.odl.window.r3_brand = sinon.spy();
    mocks.odl.window.r3_error = sinon.spy();
    mocks.odl.window.r3_generic = sinon.spy();
    mocks.odl.window.rr_flush_onload = sinon.spy();
    mocks.odl.window.r3 = sinon.spy();
    mocks.odl.window.RR = () => RrApi;
    mocks.odl.window.require = sinon.stub().callsArg(1);
    // load module
    getJSDOM().changeURL(mocks.odl.window, 'http://localhost/richrelevancePlugin');
    return setupModule('./src/plugins/richrelevance').then(() => {
      Plugin = getPluginConstructor();
    });
  });

  afterEach(() => {
    r3CommonMock.verify();
    r3CommonMock.restore();
    r3SearchMock.verify();
    r3SearchMock.restore();
    r3CategoryMock.verify();
    r3CategoryMock.restore();
    r3ItemMock.verify();
    r3ItemMock.restore();
    r3CartMock.verify();
    r3CartMock.restore();
    r3PurchasedMock.verify();
    r3PurchasedMock.restore();
  });

  const callRichRelevance = () => {
    new Plugin(odlApi, odlDataMock, {});
  };

  it('should add placement when at least once metatag is present in DOM', () => {
    // create a recommendation meta element in virtual DOM
    const meta = mocks.odl.window.document.createElement('meta');
    const body = mocks.odl.window.document.getElementsByTagName('body')[0];
    meta.setAttribute('name', 'gk:recommendation');
    meta.setAttribute('content', 'my_placement_id.foo');
    body.appendChild(meta);
    // see if it gets called
    r3CommonMock.expects('addPlacementType').withArgs('my_placement_id.foo');
    callRichRelevance();
  });

  describe('should handle different page types and then call RichRelevance', () => {
    afterEach(() => {
      // watch for these calls for every test in this describe
      sinon.assert.called(mocks.odl.window.rr_flush_onload);
      sinon.assert.called(mocks.odl.window.r3);
    });

    it('and track the homepage on type homepage', () => {
      odlDataMock.page.type = 'homepage';
      callRichRelevance();
      sinon.assert.called(mocks.odl.window.r3_home);
    });

    it('should track r3_personal for type myaccount', () => {
      odlDataMock.page.type = 'myaccount';
      callRichRelevance();
      sinon.assert.calledOnce(mocks.odl.window.r3_personal);
    });

    it('should track r3_personal for type myaccount-overview', () => {
      odlDataMock.page.type = 'myaccount-overview';
      callRichRelevance();
      sinon.assert.calledOnce(mocks.odl.window.r3_personal);
    });

    it('should track r3_personal for type myaccount-orders', () => {
      odlDataMock.page.type = 'myaccount-orders';
      callRichRelevance();
      sinon.assert.calledOnce(mocks.odl.window.r3_personal);
    });

    it('should track r3_generic for type myaccount-logout', () => {
      odlDataMock.page.type = 'myaccount-logout';
      callRichRelevance();
      sinon.assert.called(mocks.odl.window.r3_generic);
    });

    it('should track r3_error for type error', () => {
      odlDataMock.page.type = 'error';
      callRichRelevance();
      sinon.assert.called(mocks.odl.window.r3_error);
    });

    describe('and track the search for type search', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'search';
        odlDataMock.search = odlDataTypes.getODLSearchDataStub();
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should set use the terms from ODL to set terms in the search object ', () => {
        r3SearchMock.expects('setTerms').withArgs(odlDataMock.search.keywords);
      });

      it('should add at least 15 of the given IDs from the ODL', () => {
        r3SearchMock.expects('addItemId').atLeast(1).atMost(15);
      });

      it('should react when no IDs are present in the ODL [debug]', () => {
        delete odlDataMock.search.productIds;
        r3SearchMock.expects('addItemId').never();
      });
    });

    describe('and track the category for type category', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'category';
        odlDataMock.category = odlDataTypes.getODLCategoryDataStub();
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should use the category id from the ODL to set the id in the category object', () => {
        r3CategoryMock.expects('setId').withArgs(odlDataMock.category.id);
      });

      it('should use the name from the ODL to set the name in the category object', () => {
        r3CategoryMock.expects('setName').withArgs(odlDataMock.category.name);
      });
    });

    describe('and track the productdetails for type productdetail', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'productdetail';
        odlDataMock.product = odlDataTypes.getODLProductDataStub(123);
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should use the productId/name from the ODL as a string to set the id/name in the Item object', () => {
        // callRichRelevance();
        // sinon.assert.calledWith(r3ItemMock.setId, odlDataMock.product.productId);
        r3ItemMock.expects('setId').withArgs((odlDataMock.product.productId).toString());
        r3ItemMock.expects('setName').withArgs(odlDataMock.product.name);
      });

      /* it('should use the product category from the ODL to set the categoryHintId int the common object', () => {
        r3CommonMock.expects('addCategoryHintId').withArgs(odlDataMock.product.category);
      });*/
    });

    describe('and track the brand for type brand', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'brand';
        odlDataMock.brand = odlDataTypes.getODLBrandDataStub();
      });

      it('should instanciate r3_brand', () => {
        callRichRelevance();
        sinon.assert.calledOnce(mocks.odl.window.r3_brand);
      });

      it('should use the brand from the ODL to set the brand in the common object', () => {
        r3CommonMock.expects('setPageBrand').withArgs(odlDataMock.brand.name);
        callRichRelevance();
      });
    });

    describe('and track products in the cart for type checkout-cart', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'checkout-cart';
        odlDataMock.cart = {};
      });

      it('should add two items when two are present in the odl', () => {
        odlDataMock.cart.products = [
          { productId: 42 },
          { productId: 23 },
        ];
        r3CartMock.expects('addItemId').twice();
        // TODO test that the calls have the correct parameter
        callRichRelevance();
      });
    });

    describe('and track products for type checkout-cart', () => {
      beforeEach(() => {
        odlDataMock.page.type = 'checkout-cart';
        odlDataMock.cart = {
          products: [],
        };
      });

      it('should add three items when three are present in the odl', () => {
        odlDataMock.cart.products = [
          { productId: 42 },
          { productId: 23 },
        ];
        // .twice() is covered with this implementation
        r3CartMock.expects('addItemId').withArgs(23);
        r3CartMock.expects('addItemId').withArgs(42);
        callRichRelevance();
      });

      it('should not add items when products list in the odl is empty', () => {
        odlDataMock.cart.products = [];
        r3CartMock.expects('addItemId').never();
        callRichRelevance();
      });

      it('should not add items when products list in the odl is not available', () => {
        r3CartMock.expects('addItemId').never();
        callRichRelevance();
      });
    });

    describe("should track the orders' products for type checkout-confirmation", () => {
      beforeEach(() => {
        odlDataMock.page.type = 'checkout-confirmation';
        odlDataMock.order = {};
      });

      it('should add two items when two are present in the odl', () => {
        odlDataMock.order.products = [
          {
            productId: 23,
            priceData: {
              totalBeforeDiscount: 11.97,
            },
            quantity: 3,
          },
          {
            productId: 42,
            priceData: {
              totalBeforeDiscount: 2012,
            },
            quantity: 9500,
          },
        ];
        r3PurchasedMock.expects('addItemIdPriceQuantity').withArgs(23, 11.97, 3);
        r3PurchasedMock.expects('addItemIdPriceQuantity').withArgs(42, 2012, 9500);
        callRichRelevance();
      });

      it('should not add items are not available in the odl', () => {
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });

      it('should not add items are when the list in the odl is empty', () => {
        odlDataMock.order.products = [];
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });

      it('should not track test orders', () => {
        odlDataMock.order.testOrder = true;
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });
    });
  });
});
