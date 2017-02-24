import { window, Logger } from 'opendatalayer';

const logger = new Logger('adwordsConversion');

/**
 * Google Adwords Conversion pixel ODL plugin
 */
export default class AdwordsConversion {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      window.require([`${window.location.protocol}//www.googleadservices.com/pagead/conversion_async.js`], () => {
        // async tracking
        window.google_trackConversion({
          google_conversion_id: config.conversionId,
          google_conversion_label: config.conversionLabel,
          google_conversion_format: 3,
          google_conversion_currency: config.conversionCurrency,
          google_conversion_value: data.order.priceData.total,
          google_remarketing_only: false,
        });
      });
    }
  }
}
