import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';

const logger = new Logger('ba/lib/dal/mouseflow');

export default class Mouseflow {
  constructor(dal, data, config) {
    logger.log('initialize');

    // setup MF globals (TODO use @config)
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
