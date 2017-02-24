import { window, helpers } from 'opendatalayer';

/**
 * Sovendus ODL plugin
 *
 * @module   ba.lib.odl
 * @class    Sovendus
 * @implements  IODLService
 */
export default class Sovendus {

  constructor(odl, data, config) {
    if (data.page.type === 'checkout-confirmation') {
      // create target element in container on confirmation page
      helpers.addHTML('#or-page__confirmation__sovendus', '<div id="gutscheinconnection-container1" />');

      // configure Sovendus
      const gd = window._gconData || [];
      gd.length = 0;
      gd.push(['_shopId', config.shopId]);
      gd.push(['_bannerId', config.bannerId]);
      gd.push(['_sessionId', '']);
      gd.push(['_timestamp', (new window.Date()).getTime() / 1000]);
      gd.push(['_customerSalutation', data.order.customer.salutation === 'MR' ? 'Herr' : 'Frau']);
      gd.push(['_customerFirstName', data.order.customer.firstName]);
      gd.push(['_customerLastName', data.order.customer.lastName]);
      gd.push(['_customerEmail', data.order.customer.email]);
      gd.push(['_orderId', data.order.id]);
      gd.push(['_orderValue', data.order.priceData.net]);
      gd.push(['_orderCurrency', config.currency]);
      gd.push(['_usedCouponCode', data.order.couponCode || '']);
      gd.push(['_checksum', '']);
      gd.push(['_htmlElementId', 'gutscheinconnection-container1']);
      window._gconData = gd;

      // build/add script include
      helpers.addScript('//api.gutscheinconnection.de/js/client.js');
    }
  }
}
