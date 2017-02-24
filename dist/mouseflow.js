'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = require('gk/globals/window');

var _window2 = babelHelpers.interopRequireDefault(_window);

var _logger = require('gk/lib/logger');

var _logger2 = babelHelpers.interopRequireDefault(_logger);

var logger = new _logger2.default('ba/lib/dal/mouseflow');

var Mouseflow = function Mouseflow(dal, data, config) {
  babelHelpers.classCallCheck(this, Mouseflow);

  logger.log('initialize');

  // setup MF globals (TODO use @config)
  _window2.default.mouseflowDisableKeyLogging = config.mouseflowDisableKeyLogging || true;

  // include Mouseflow
  _window2.default._mfq = _window2.default._mfq || [];
  var mf = _window2.default.document.createElement('script');
  mf.type = 'text/javascript';
  mf.async = true;
  mf.src = '//cdn.mouseflow.com/projects/' + config.uuid + '.js';
  _window2.default.document.getElementsByTagName('head')[0].appendChild(mf);
};

exports.default = Mouseflow;