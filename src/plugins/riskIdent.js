import { window, Logger, helpers } from 'opendatalayer';

const logger = new Logger('riskIdent');

/**
 * Device Ident ODL plugin.
 */
export default class RiskIdent {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type !== 'checkout-confirmation') {
      return;
    }

    // setup DI values
    const diSite = config.diSite;
    const token = data.order.id;
    window.di = {
      t: token,
      v: diSite,
      l: 'Checkout',
    };

    helpers.addScript(`//www.jsctool.com/${diSite}/di.js`);
    helpers.addHTML('BODY', `<object type="application/x-shockwave-flash" data="//www.jsctool.com/${diSite}/c.swf" width="0" height="0"><param name="movie" value="//www.jsctool.com/${diSite}/c.swf" /><param name="flashvars" value="t=${token}&v=${diSite}"/></object>`);
    helpers.addHTML('BODY', `<link rel="stylesheet" type="text/css" media="jsctool" href="//media1.galeria-kaufhof.de/di.css?t=${token}&sd=1&v=${diSite}&l=Checkout">`);
  }
}
