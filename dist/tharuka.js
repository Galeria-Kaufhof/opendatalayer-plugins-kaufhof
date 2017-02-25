'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

var logger = new _opendatalayer.Logger('tharuka');

/**
 * Tharuka ODL plugin
 */
/* eslint-disable no-underscore-dangle */

var Tharuka =

/**
 * Fired when the plugin is loaded by the ODL (during or after DOM load)
 *
 * @method constructor
 * @param  {ODL}     odl     the global ODL instance
 * @param  {Object}  data    the global ODL data object (as returned by ODL.getData)
 * @param  {Object}  config  custom configuration for this service
 */
function Tharuka(odl, data, config) {
  babelHelpers.classCallCheck(this, Tharuka);

  var ordr = data.order;
  var cus = ordr.customer;
  var addr = cus.billingAddress;
  var cusAnrede = cus.salutation === 'MR' ? 'Herr' : 'Frau';

  if (data.page.type !== 'checkout-confirmation') {
    return;
  }

  logger.log('initialize');

  _opendatalayer.window.THFilter = {
    anrede: cusAnrede,
    plz: addr.zip,
    land: addr.countryCode,
    gebJahr: cus.birthYear,
    gutscheincode: ordr.couponCode || ''
  };

  _opendatalayer.window.THPrefill = {
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
  var div = _opendatalayer.window.document.createElement('div');
  div.id = 'tharuka';
  _opendatalayer.window.document.querySelector('#or-page__confirmation__tharuka').appendChild(div);

  // require tharuka script
  // window.require(['//tharuka-app.de/api/684/tharuka.js'], () => logger.log('loaded')
  _opendatalayer.window.require(['//tharuka-app.de/api/' + config.accountId + '/tharuka.js'], function () {
    return logger.log('loaded');
  });
};

exports.default = Tharuka;