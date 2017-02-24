import window from 'gk/globals/window';
// import 'https://cdn.optimizely.com/js/216755552.js';

/**
 * optimizely DAL plugin
 *
 * Includes optimizely lib and hands over conversion data when on checkout-comnfirmation page
 *
 * @module   gk.lib.dal
 * @class    Optimizely
 * @implements  IDALService
 */
export default class Optimizely {

  /**
   * Fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @param  {gk.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(dal, data, config) {
    if (data.page.type === 'checkout-confirmation') {
      // @TODO use System.import once systemjs is globally available
      window.require([`${window.location.protocol}//cdn.optimizely.com/js/216755552.js`], () => {
        window.optimizely = window.optimizely || [];
        window.optimizely.push(['trackEvent', 'purchase', { revenue: data.order.priceData.total * 100 }]);
      });
    }
  }
}
