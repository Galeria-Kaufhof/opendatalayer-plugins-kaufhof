'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('idealo');

/**
 * Idealo ODL plugin, simply displays idealo notice on checkout-confirmation page.
 */

var Idealo = function Idealo(odl, data) {
  _classCallCheck(this, Idealo);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var noticeEl = document.querySelector('#or-page__confirmation__idealo');
    if (noticeEl) {
      noticeEl.style.display = 'block';
    }
  }
};

exports.default = Idealo;