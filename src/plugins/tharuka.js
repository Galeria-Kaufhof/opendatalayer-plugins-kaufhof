import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';

const logger = new Logger('ba/lib/dal/tharuka');

/**
 * Tharuka DAL plugin
 *
 * @module   gk.lib.dal
 * @class    tharuka
 * @implements  IDALService
 */
export default class Tharuka {

  /**
   * Fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(dal, data, config) {
    const ordr = data.order;
    const cus = ordr.customer;
    const addr = cus.billingAddress;
    const cusAnrede = cus.salutation === 'MR' ? 'Herr' : 'Frau';

    if (data.page.type !== 'checkout-confirmation') {
      return;
    }

    logger.log('initialize');

    window.THFilter = {
      anrede: cusAnrede,
      plz: addr.zip,
      land: addr.countryCode,
      gebJahr: cus.birthYear,
      gutscheincode: ordr.couponCode || '',
    };

    window.THPrefill = {
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
      gebTag: cus.birthDate || '',
    };

    // find tharuka container and insert target div
    const div = window.document.createElement('div');
    div.id = 'tharuka';
    window.document.querySelector('#or-page__confirmation__tharuka').appendChild(div);

    // require tharuka script
    // window.require(['//tharuka-app.de/api/684/tharuka.js'], () => logger.log('loaded')
    window.require([`//tharuka-app.de/api/${config.accountId}/tharuka.js`], () => logger.log('loaded'));
  }
}
