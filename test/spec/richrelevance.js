import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import System from 'systemjs';
import './../../../../systemjs.config';
import mockModule from './../../_mockModule';
import * as dalDataTypes from './../../../mocks/dalDataTypes';

describe('ba/lib/dal/richrelevance', () => {
  let [Service, dalApi, dalDataMock, loggerSpy, windowSpy] = [];

  beforeEach((done) => {
    // create spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    windowSpy = { require: sinon.stub().callsArg(1), location: { protocol: 'https:' } };
    // register mocks
    mockModule('jquery', {});
    mockModule('gk/globals/window', windowSpy);
    mockModule('gk/lib/logger', () => loggerSpy);
    // mockModule('ba/vendor/richrelevance', {});
    //mockModule('https://media.richrelevance.com/rrserver/js/1.2/p13n.js', {});
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/richrelevance'));
    System.import('ba/lib/dal/richrelevance').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
  });

  it('should handle a not available RR', () => {
    // this test succeeds if there is no error
    new Service(dalApi, dalDataMock, {});
  });

  it('should lazy-load the global RR script using window.require', () => {
    new Service(dalApi, dalDataMock, {});
    sinon.assert.calledWith(windowSpy.require, ['https://media.richrelevance.com/rrserver/js/1.2/p13n.js']);
  });
});

describe('ba/lib/dal/richrelevance', () => {
  let dalApi, dalDataMock, injector, loggerSpy, r3BrandSpy, r3CartMock, r3CategoryMock, r3CommonMock, r3ErrorSpy, r3GenericSpy, r3HomeMock, r3ItemMock, r3Mock, r3PersonalSpy, r3PurchasedMock, r3SearchMock, rrFlushOnLoadMock, Service, window;
  [injector, Service, window, dalApi, loggerSpy, dalDataMock, r3CommonMock, rrFlushOnLoadMock,
    r3Mock, r3HomeMock, rrFlushOnLoadMock, r3SearchMock, r3CategoryMock, r3ItemMock, r3PersonalSpy, r3BrandSpy, r3CartMock,
    r3PurchasedMock, r3ErrorSpy, r3GenericSpy] = [];
  beforeEach((done) => {
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
    r3HomeMock = sinon.spy();
    r3PersonalSpy = sinon.spy();
    r3BrandSpy = sinon.spy();
    r3ErrorSpy = sinon.spy();
    r3GenericSpy = sinon.spy();
    r3SearchMock = sinon.mock(r3SearchApi);
    r3CategoryMock = sinon.mock(r3CategoryApi);
    rrFlushOnLoadMock = sinon.spy();
    r3Mock = sinon.spy();
    r3ItemMock = sinon.mock(r3ItemApi);
    r3CartMock = sinon.mock(r3CartApi);
    r3PurchasedMock = sinon.mock(r3PurchasedApi);
    const RrApi = {
      jsonCallback(callback) {
        return callback();
      },
    };
    dalDataMock = {
      identity: { bid: '' },
      user: { id: '' },
      page: { type: '' },
      search: {},
    };
    window = {
      location: {
        protocol: 'http:',
        host: 'localhost',
        pathname: '/richrelevanceService',
        href: '',
      },
      r3_common: () => r3CommonMock.object,
      r3_search: () => r3SearchMock.object,
      r3_category: () => r3CategoryMock.object,
      r3_item: () => r3ItemMock.object,
      r3_cart: () => r3CartMock.object,
      r3_purchased: () => r3PurchasedMock.object,
      r3_personal: r3PersonalSpy,
      r3_home: r3HomeMock,
      r3_brand: r3BrandSpy,
      r3_error: r3ErrorSpy,
      r3_generic: r3GenericSpy,
      rr_flush_onload: rrFlushOnLoadMock,
      r3: r3Mock,
      RR: () => RrApi,
      require: sinon.stub().callsArg(1),
    };
    const jqApi = () => ({ each: (callback) => callback(), attr: () => 'content' });
    // create spies
    loggerSpy = { log: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    // register mocks
    mockModule('jquery', jqApi);
    mockModule('gk/globals/window', window);
    mockModule('gk/lib/logger', () => loggerSpy);
    mockModule('ba/vendor/richrelevance', {});
    // clear module first
    System.delete(System.normalizeSync('ba/lib/dal/richrelevance'));
    System.import('ba/lib/dal/richrelevance').then(m => {
      Service = m.default;
      done();
    }).catch(err => { console.error(err); });
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
    new Service(dalApi, dalDataMock, {});
  };

  it('should add placement type when meta is present', () => {
    r3CommonMock.expects('addPlacementType').withArgs('content');
    callRichRelevance();
  });

  describe('should handle different page types and then call RichRelevance', () => {
    afterEach(() => {
      // watch for these calls for every test in this describe
      assert.isTrue(rrFlushOnLoadMock.called, 'flushOnLoad called');
      assert.isTrue(r3Mock.called, 'r3 called');
    });

    it('and track the homepage on type homepage', () => {
      dalDataMock.page.type = 'homepage';
      callRichRelevance();
      assert.isTrue(r3HomeMock.called, 'r3_home called');
    });

    it('should track r3_personal for type myaccount', () => {
      dalDataMock.page.type = 'myaccount';
      callRichRelevance();
      assert.isTrue(r3PersonalSpy.calledOnce);
    });

    it('should track r3_personal for type myaccount-overview', () => {
      dalDataMock.page.type = 'myaccount-overview';
      callRichRelevance();
      assert.isTrue(r3PersonalSpy.calledOnce);
    });

    it('should track r3_personal for type myaccount-orders', () => {
      dalDataMock.page.type = 'myaccount-orders';
      callRichRelevance();
      assert.isTrue(r3PersonalSpy.calledOnce);
    });

    it('should track r3_generic for type myaccount-logout', () => {
      dalDataMock.page.type = 'myaccount-logout';
      callRichRelevance();
      assert.isTrue(r3GenericSpy.called, 'r3_generic called');
    });

    it('should track r3_error for type error', () => {
      dalDataMock.page.type = 'error';
      callRichRelevance();
      assert.isTrue(r3ErrorSpy.called, 'r3_error called');
    });

    describe('and track the search for type search', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'search';
        dalDataMock.search.keywords = 'Master Key Words';
        dalDataMock.search.ids = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16';
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should set use the terms from DAL to set terms in the search object ', () => {
        r3SearchMock.expects('setTerms').withArgs('Master Key Words');
      });

      it('should add at least 15 of the given IDs from the DAL', () => {
        r3SearchMock.expects('addItemId').atLeast(1).atMost(15);
      });

      it('should react when no IDs are present in the DAL [debug]', () => {
        dalDataMock.search.ids = undefined;
        return r3SearchMock.expects('addItemId').never();
      });
    });

    describe('and track the category for type category', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'category';
        dalDataMock.category = {};
        dalDataMock.category.id = 23;
        dalDataMock.category.name = 'Nerdish';
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should use the category id from the DAL to set the id in the category object', () => {
        r3CategoryMock.expects('setId').withArgs(23);
      });

      it('should use the name from the DAL to set the name in the category object', () => {
        r3CategoryMock.expects('setName').withArgs('Nerdish');
      });
    });

    describe('and track the productdetails for type productdetail', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'productdetail';
        dalDataMock.product = {
          productId: 23,
          category: 42,
        };
      });

      afterEach(() => {
        callRichRelevance();
      });

      it('should use the productId from the DAL as a string to set the id in the Item object', () => {
        r3ItemMock.expects('setId').withArgs('23');
      });

      // it "should use the product category from the DAL to set the categoryHintId int the common object", ->
      //  r3CommonMock.expects('addCategoryHintId').withArgs(42)
    });

    describe('and track the brand for type brand', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'brand';
        dalDataMock.brand = { name: 'ACME' };
      });

      it('should instanciate r3_brand', () => {
        callRichRelevance();
        assert.isTrue(r3BrandSpy.calledOnce);
      });

      it('should use the brand from the DAL to set the brand in the common object', () => {
        r3CommonMock.expects('setPageBrand').withArgs('ACME');
        callRichRelevance();
      });
    });

    describe('and track products in the cart for type checkout-cart', () => {
      beforeEach(() => {
        dalDataMock.page.type = 'checkout-cart';
        dalDataMock.cart = {};
      });

      it('should add two items when two are present in the dal', () => {
        dalDataMock.cart.products = [
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
        dalDataMock.page.type = 'checkout-cart';
        dalDataMock.cart = {
          products: [],
        };
      });

      it('should add three items when three are present in the dal', () => {
        dalDataMock.cart.products = [
          { productId: 42 },
          { productId: 23 },
        ];
        // .twice() is covered with this implementation
        r3CartMock.expects('addItemId').withArgs(23);
        r3CartMock.expects('addItemId').withArgs(42);
        callRichRelevance();
      });

      it('should not add items when products list in the dal is empty', () => {
        dalDataMock.cart.products = [];
        r3CartMock.expects('addItemId').never();
        callRichRelevance();
      });

      it('should not add items when products list in the dal is not available', () => {
        r3CartMock.expects('addItemId').never();
        callRichRelevance();
      });
    });

    describe("should track the orders' products for type checkout-confirmation", () => {
      beforeEach(() => {
        dalDataMock.page.type = 'checkout-confirmation';
        dalDataMock.order = {};
      });

      it('should add two items when two are present in the dal', () => {
        dalDataMock.order.products = [
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

      it('should not add items are not available in the dal', () => {
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });

      it('should not add items are when the list in the dal is empty', () => {
        dalDataMock.order.products = [];
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });

      it('should not track test orders', () => {
        dalDataMock.order.testOrder = true;
        r3PurchasedMock.expects('addItemIdPriceQuantity').never();
        callRichRelevance();
      });
    });
  });
});
