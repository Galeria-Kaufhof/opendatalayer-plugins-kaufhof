import * as sinon from 'sinon';
import System from 'systemjs';
import mockModule from 'systemjs-mock-module';
import jsdom from 'jsdom';
import './../systemjs.config';

// plugin constructor
let [Plugin] = [];

/**
 * Setup SystemJS module.
 */
export function setupModule(name) {
  // clear module first
  System.delete(System.normalizeSync(name));
  return System.import(name).then((m) => {
    Plugin = m.default;
  }).catch(err => console.error(err));
}

/**
 * Init and return object with mocks (ODL, logger, ...). Also registers
 * ODL mock with SystemJS.
 * @param mapping {Object}  (optional) additional mocks, provided as { 'module_id': mock_object }
 */
export function initMocks(mapping = {}) {
  // spies
  const loggerSpy = { log: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
  const mocks = {
    odl: {
      window: jsdom.jsdom('<html><body></body></html>').defaultView,
      Logger: () => loggerSpy,
      helpers: { addScript: sinon.spy(), addImage: sinon.spy() },
      cookie: { get: sinon.stub(), set: sinon.stub() },
    },
    logger: loggerSpy,
  };
  // register ODL mock within system
  mockModule(System, 'opendatalayer', mocks.odl);
  // register additional mocks
  for (const m in mapping) {
    if (mapping.hasOwnProperty(m)) {
      mockModule(System, m, mapping[m]);
    }
  }
  return mocks;
}

/**
 * Returns the SystemJS instance used by this module.
 */
export function getSystemJSInstance() {
  return System;
}

/**
 * Returns the constructor for the associated ODL plugin.
 */
export function getPluginConstructor() {
  return Plugin;
}

/**
 * Returns the internal JSDOM instance.
 */
export function getJSDOM() {
  return jsdom;
}
