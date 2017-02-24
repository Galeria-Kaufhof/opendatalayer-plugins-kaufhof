import { window } from 'opendatalayer';
// import 'https://cdn.optimizely.com/js/216755552.js';

/**
 * optimizely ODL plugin
 *
 * Includes optimizely lib and hands over conversion data when on checkout-comnfirmation page
 *
 * @module   gk.lib.odl
 * @class    Optimizely
 * @implements  IODLService
 */
export default class Optimizely {

  /**
   * Fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @param  {gk.lib.ODL}  odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(odl, data, config) {
    if (data.page.type === 'checkout-confirmation') {
      // @TODO use System.import once systemjs is globally available
      window.require([`${window.location.protocol}//cdn.optimizely.com/js/216755552.js`], () => {
        window.optimizely = window.optimizely || [];
        window.optimizely.push(['trackEvent', 'purchase', { revenue: data.order.priceData.total * 100 }]);
      });
    }
  }
}
