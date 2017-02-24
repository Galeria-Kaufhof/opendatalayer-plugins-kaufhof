'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var logger = new _logger2.default('ba/lib/dal/bt/idealo');

/**
 * Idealo DAL plugin, simply displays idealo notice on checkout-confirmation page
 *
 * @module   ba.lib.dal.bt.idealo
 * @class    Idealo
 * @implements  IDALService
 */

var Idealo = function Idealo(dal, data) {
  babelHelpers.classCallCheck(this, Idealo);

  logger.log('initialize');

  if (data.page.type === 'checkout-confirmation') {
    var noticeEl = document.querySelector('#or-page__confirmation__idealo');
    if (noticeEl) {
      noticeEl.style.display = 'block';
    }
  }
};

exports.default = Idealo;