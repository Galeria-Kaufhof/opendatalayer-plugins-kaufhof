'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var logger = new _logger2.default('ba/lib/dal/tharuka');

/**
 * Tharuka DAL plugin
 *
 * @module   gk.lib.dal
 * @class    tharuka
 * @implements  IDALService
 */

var Tharuka =

/**
 * Fired when the plugin is loaded by the DAL (during or after DOM load)
 *
 * @method constructor
 * @param  {gk.lib.DAL}  dal     the global DAL instance
 * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
 * @param  {Object}      config  custom configuration for this service
 */
function Tharuka(dal, data, config) {
  babelHelpers.classCallCheck(this, Tharuka);

  var ordr = data.order;
  var cus = ordr.customer;
  var addr = cus.billingAddress;
  var cusAnrede = cus.salutation === 'MR' ? 'Herr' : 'Frau';

  if (data.page.type !== 'checkout-confirmation') {
    return;
  }

  logger.log('initialize');

  _window2.default.THFilter = {
    anrede: cusAnrede,
    plz: addr.zip,
    land: addr.countryCode,
    gebJahr: cus.birthYear,
    gutscheincode: ordr.couponCode || ''
  };

  _window2.default.THPrefill = {
    anrede: cusAnrede,
    vorname: cus.firstName || '',
    name: cus.lastName || '',
    strasse: addr.street || '',
    hausnummer: addr.houseNr || '',
    plz: addr.zip || '',
    ort: addr.town || '',
    email: cus.email || '',
    tel: cus.phone || '',
    gebJahr: cus.birthYear || '',
    gebTag: cus.birthDate || ''
  };

  // find tharuka container and insert target div
  var div = _window2.default.document.createElement('div');
  div.id = 'tharuka';
  _window2.default.document.querySelector('#or-page__confirmation__tharuka').appendChild(div);

  // require tharuka script
  // window.require(['//tharuka-app.de/api/684/tharuka.js'], () => logger.log('loaded')
  _window2.default.require(['//tharuka-app.de/api/' + config.accountId + '/tharuka.js'], function () {
    return logger.log('loaded');
  });
};

exports.default = Tharuka;