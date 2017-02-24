'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _mediaQuery = require('gk/lib/mediaQuery');

var _mediaQuery2 = babelHelpers.interopRequireDefault(_mediaQuery);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var _config = require('gk/lib/config');

var _config2 = babelHelpers.interopRequireDefault(_config);

var _stacy = require('./../stacy');

var _stacy2 = babelHelpers.interopRequireDefault(_stacy);

/**
 * stacy DAL plugin
 *
 * Includes stacy logging library and hands over specific data to logging backend.
 *
 * @TODO
 * - connect with trafficbroker and log traffic sources
 * - log breakpoint changes by listening to mq.change
 *
 * @module   gk.lib.dal
 * @class    stacy
 * @implements  IDALService
 */
var logger = new _logger2.default('ba/lib/dal/stacy');

// provide DAL data to metrics
/* eslint-disable no-underscore-dangle, no-bitwise, max-len */
var _dalData = {};

// stacy metric for fint-specific KPIs
var FintPageMetric = {
  type: 'page',
  execute: function execute() {
    // @TODO: handle breakpoint change events
    // mq.on "change", (breakpoint) ->
    //   stacy.log "BreakPointChange", breakpoint
    var data = {
      Breakpoint: _mediaQuery2.default.currentRange,
      PageLocation: _window2.default.location.pathname + _window2.default.location.search,
      PageType: _dalData.page.type,
      PageName: _dalData.page.name,
      SiteId: _dalData.site.id,
      bid: _dalData.identity.bid,
      tenantId: _config2.default.tenantId,
      Referrer: document.referrer
    };
    // if we have custom rum events, log them
    for (var name in _window2.default._gk.timing.data) {
      var value = _window2.default._gk.timing.data[name];
      data['timing.' + name] = value;
    }
    return data;
  }
};

var Stacy = function () {

  /**
   * Fired when the plugin is loaded by the DAL (during or after DOM load)
   *
   * @method constructor
   * @param  {gk.lib.DAL}  dal     the global DAL instance
   * @param  {Object}      data    the global DAL data object (as returned by DAL.getData)
   * @param  {Object}      config  custom configuration for this service
   */
  function Stacy(dal, data, config) {
    babelHelpers.classCallCheck(this, Stacy);

    this._onPostData = this._onPostData.bind(this);
    this.dal = dal;
    this.data = data;
    logger.log('initialize');
    // make DAL data available to metrics
    _dalData = this.data;
    // init stacy
    _stacy2.default.init({
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
   * @TODO add loglevel argument to DAL
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
          d.eventTime = _window2.default._gk && _window2.default._gk.timing ? _window2.default._gk.timing.now() : 0; // parseInt(timestamp, 10)
          d.rid = uuid;
          // manually push data to fintlog here
          _stacy2.default.post(url, this._unicodeEscape(_window2.default.JSON.stringify(d)), _stacy2.default.clear);
        }
      }
    }
  }]);
  return Stacy;
}();

exports.default = Stacy;