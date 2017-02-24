'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('criteo');

/**
 * Criteo ODL plugin, integrating criteo pixel
 */

var Criteo = function () {
  function Criteo(odl, data, config) {
    babelHelpers.classCallCheck(this, Criteo);

    // append script to DOM
    var el = _opendatalayer.window.document.createElement('script');
    el.src = '//static.criteo.net/js/ld/ld.js';
    el.async = true;
    var head = _opendatalayer.window.document.getElementsByTagName('HEAD')[0];
    head.appendChild(el);
    // create core tracking object and track basics
    _opendatalayer.window.criteo_q = _opendatalayer.window.criteo_q || [];
    this.event('setAccount', { account: config.accountId });
    this.event('setSiteType', { type: config.siteType });
    // track event depending on type
    switch (data.page.type) {
      case 'homepage':
        this.event('viewHome');
        break;
      case 'search':
        this.event('viewList', { item: data.search.aonrs });
        break;
      case 'category':
        this.event('viewList', { item: data.category.aonrs });
        break;
      case 'productdetail':
        this.event('viewItem', { item: data.product.aonr });
        break;
      case 'checkout-cart':
        this.event('viewBasket', { item: this.getProductItems(data.cart) });
        break;
      case 'checkout-confirmation':
        {
          var emosJckamp = _opendatalayer.cookie.get('emos_jckamp');
          var evData = {
            id: data.order.id,
            deduplication: emosJckamp && emosJckamp.match(/campaign=criteo/) ? 1 : 0,
            item: this.getProductItems(data.order)
          };
          if (data.order.paybackPoints > 0) {
            evData.user_segment = '1';
          }
          this.event('trackTransaction', evData);
          break;
        }
      default:
    }
  }

  // get product items from a ODLCartData object the way criteo needs it


  babelHelpers.createClass(Criteo, [{
    key: 'getProductItems',
    value: function getProductItems(data) {
      var items = [];
      for (var i = 0; i < data.products.length; i += 1) {
        var p = data.products[i];
        items.push({ id: p.aonr, price: p.priceData.total, quantity: p.quantity });
      }
      return items;
    }

    // send an event to criteo

  }, {
    key: 'event',
    value: function event(name) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var eventObj = { event: name };
      for (var d in data) {
        var v = data[d];
        eventObj[d] = v;
      }
      logger.log('pushing event', eventObj);
      return _opendatalayer.window.criteo_q.push(eventObj);
    }
  }]);
  return Criteo;
}();

exports.default = Criteo;