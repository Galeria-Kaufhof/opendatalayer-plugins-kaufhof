import { Logger } from 'opendatalayer';

const logger = new Logger('idealo');

/**
 * Idealo ODL plugin, simply displays idealo notice on checkout-confirmation page.
 */
export default class Idealo {

  constructor(odl, data) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      const noticeEl = document.querySelector('#or-page__confirmation__idealo');
      if (noticeEl) {
        noticeEl.style.display = 'block';
      }
    }
  }
}
