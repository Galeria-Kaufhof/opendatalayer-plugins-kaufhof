/* eslint-disable no-underscore-dangle, no-bitwise, max-len */
import { window, Logger } from 'opendatalayer';
/* eslint-disable no-underscore-dangle, no-bitwise, max-len */
// @TODO import mq from 'gk/lib/mediaQuery';
// @TODO import stacy from './../lib/stacy';

/**
 * stacy ODL plugin
 *
 * Includes stacy logging library and hands over specific data to logging backend.
 *
 * @TODO
 * - connect with trafficbroker and log traffic sources
 * - log breakpoint changes by listening to mq.change
 */
const logger = new Logger('stacy');

// provide ODL data to metrics
let _odlData = {};

// stacy metric for fint-specific KPIs
const FintPageMetric = {
  type: 'page',
  execute() {
    // @TODO: handle breakpoint change events
    // mq.on "change", (breakpoint) ->
    //   stacy.log "BreakPointChange", breakpoint
    const data = {
      // Breakpoint: mq.currentRange,
      PageLocation: window.location.pathname + window.location.search,
      PageType: _odlData.page.type,
      PageName: _odlData.page.name,
      SiteId: _odlData.site.id,
      bid: _odlData.identity.bid,
      // tenantId: config.tenantId,
      Referrer: document.referrer,
    };
    // if we have custom rum events, log them
    for (const name in window._gk.timing.data) {
      const value = window._gk.timing.data[name];
      data[`timing.${name}`] = value;
    }
    return data;
  },
};

export default class Stacy {

  /**
   * Fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.ODL}  odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  constructor(odl, data, config) {
    this._onPostData = this._onPostData.bind(this);
    this.odl = odl;
    this.data = data;
    logger.log('initialize');
    // make ODL data available to metrics
    _odlData = this.data;
    // init stacy
    stacy.init({
      backend: '/fintlog',
      repostErrors: false,
      pushInterval: 5,
      threshold: 10,
      sessionLifetime: 1800,
      metrics: [
        'browser',
        'navigationTiming',
        'screen',
        FintPageMetric,
      ],
      postDataCallback: this._onPostData,
    });
  }

  /**
   * Capture all async events and send them to stacy.
   * @TODO add loglevel argument to ODL
   */
  handleEvent(name, data, domain) {}
    // pass log event to stacy
    // stacy.log(domain + "." + name[0].toUpperCase() + name.substr(1), data)
    // stacy.log(domain + "." + name, data)

  /**
   * Escape 2-byte characters within the given string using unicode (\u) escape sequences. This
   * is required for the very strict JSON parser in logstash to not produce invalid JSON in
   * conjunction with nginx's behavior to encode stuff using \x escape sequendes.
   */
  _unicodeEscape(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const cc = c.charCodeAt(0);
      const hx = cc.toString(16).toUpperCase();
      result += (cc >= 128 || hx.length > 2) && !isNaN(cc) ? `\\u${(`0000${hx}`).slice(-4)}` : c;
    }
    return result;
  }

  /**
   * Custom post handler designed to work with our non-batching backend. It
   * takes the data entries for each group (stacy's log data is grouped by
   * uuid and sub-grouped by time of occurance) and sends them as individual
   * POST requests.
   *
   * @TODO we could perform simple traffic reduction here by only sending
   * data when certain conditions match (e.g. only once per 10 seconds)
   */
  _onPostData(url, data) {
    for (const uuid in data) {
      const completeData = data[uuid];
      for (const timestamp in completeData) {
        // enrich data with additional values (e.g. ms since requestStart)
        const currentData = completeData[timestamp];
        const d = currentData;
        d.eventTime = window._gk && window._gk.timing ? window._gk.timing.now() : 0;  // parseInt(timestamp, 10)
        d.rid = uuid;
        // manually push data to fintlog here
        stacy.post(url, this._unicodeEscape(window.JSON.stringify(d)), stacy.clear);
      }
    }
  }
}
