'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

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
var logger = new _opendatalayer.Logger('stacy');

// provide ODL data to metrics
/* eslint-disable no-underscore-dangle, no-bitwise, max-len */
var _odlData = {};

// stacy metric for fint-specific KPIs
var FintPageMetric = {
  type: 'page',
  execute: function execute() {
    // @TODO: handle breakpoint change events
    // mq.on "change", (breakpoint) ->
    //   stacy.log "BreakPointChange", breakpoint
    var data = {
      // Breakpoint: mq.currentRange,
      PageLocation: _opendatalayer.window.location.pathname + _opendatalayer.window.location.search,
      PageType: _odlData.page.type,
      PageName: _odlData.page.name,
      SiteId: _odlData.site.id,
      bid: _odlData.identity.bid,
      // tenantId: config.tenantId,
      Referrer: document.referrer
    };
    // if we have custom rum events, log them
    for (var name in _opendatalayer.window._gk.timing.data) {
      var value = _opendatalayer.window._gk.timing.data[name];
      data['timing.' + name] = value;
    }
    return data;
  }
};

var Stacy = function () {

  /**
   * Fired when the plugin is loaded by the ODL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.ODL}  odl     the global ODL instance
   * @param  {Object}      data    the global ODL data object (as returned by ODL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function Stacy(odl, data, config) {
    babelHelpers.classCallCheck(this, Stacy);

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
      metrics: ['browser', 'navigationTiming', 'screen', FintPageMetric],
      postDataCallback: this._onPostData
    });
  }

  /**
   * Capture all async events and send them to stacy.
   * @TODO add loglevel argument to ODL
   */


  babelHelpers.createClass(Stacy, [{
    key: 'handleEvent',
    value: function handleEvent(name, data, domain) {}
    // pass log event to stacy
    // stacy.log(domain + "." + name[0].toUpperCase() + name.substr(1), data)
    // stacy.log(domain + "." + name, data)

    /**
     * Escape 2-byte characters within the given string using unicode (\u) escape sequences. This
     * is required for the very strict JSON parser in logstash to not produce invalid JSON in
     * conjunction with nginx's behavior to encode stuff using \x escape sequendes.
     */

  }, {
    key: '_unicodeEscape',
    value: function _unicodeEscape(str) {
      var result = '';
      for (var i = 0; i < str.length; i++) {
        var c = str[i];
        var cc = c.charCodeAt(0);
        var hx = cc.toString(16).toUpperCase();
        result += (cc >= 128 || hx.length > 2) && !isNaN(cc) ? '\\u' + ('0000' + hx).slice(-4) : c;
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

  }, {
    key: '_onPostData',
    value: function _onPostData(url, data) {
      for (var uuid in data) {
        var completeData = data[uuid];
        for (var timestamp in completeData) {
          // enrich data with additional values (e.g. ms since requestStart)
          var currentData = completeData[timestamp];
          var d = currentData;
          d.eventTime = _opendatalayer.window._gk && _opendatalayer.window._gk.timing ? _opendatalayer.window._gk.timing.now() : 0; // parseInt(timestamp, 10)
          d.rid = uuid;
          // manually push data to fintlog here
          stacy.post(url, this._unicodeEscape(_opendatalayer.window.JSON.stringify(d)), stacy.clear);
        }
      }
    }
  }]);
  return Stacy;
}();

exports.default = Stacy;