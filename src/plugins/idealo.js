import Logger from 'gk/lib/logger';

const logger = new Logger('ba/lib/dal/bt/idealo');

/**
 * Idealo DAL plugin, simply displays idealo notice on checkout-confirmation page
 *
 * @module   ba.lib.dal.bt.idealo
 * @class    Idealo
 * @implements  IDALService
 */
export default class Idealo {

  constructor(dal, data) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      const noticeEl = document.querySelector('#or-page__confirmation__idealo');
      if (noticeEl) {
        noticeEl.style.display = 'block';
      }
    }
  }
}
