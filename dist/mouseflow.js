'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opendatalayer = require('opendatalayer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = new _opendatalayer.Logger('mouseflow');

var Mouseflow = function Mouseflow(odl, data, config) {
  _classCallCheck(this, Mouseflow);

  logger.log('initialize');

  // setup MF globals
  _opendatalayer.window.mouseflowDisableKeyLogging = config.mouseflowDisableKeyLogging || true;

  // include Mouseflow
  _opendatalayer.window._mfq = _opendatalayer.window._mfq || [];
  var mf = _opendatalayer.window.document.createElement('script');
  mf.type = 'text/javascript';
  mf.async = true;
  mf.src = '//cdn.mouseflow.com/projects/' + config.uuid + '.js';
  _opendatalayer.window.document.getElementsByTagName('head')[0].appendChild(mf);
};

exports.default = Mouseflow;