import { window, Logger } from 'opendatalayer';

const logger = new Logger('mouseflow');

export default class Mouseflow {
  constructor(odl, data, config) {
    logger.log('initialize');

    // setup MF globals
    window.mouseflowDisableKeyLogging = config.mouseflowDisableKeyLogging || true;

    // include Mouseflow
    window._mfq = window._mfq || [];
    const mf = window.document.createElement('script');
    mf.type = 'text/javascript';
    mf.async = true;
    mf.src = `//cdn.mouseflow.com/projects/${config.uuid}.js`;
    window.document.getElementsByTagName('head')[0].appendChild(mf);
  }
}
