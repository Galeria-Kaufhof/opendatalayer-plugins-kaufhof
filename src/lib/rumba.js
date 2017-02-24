/* eslint-disable no-use-before-define, max-len, class-methods-use-this, no-bitwise */

/**
rumbajs v0.4.0

by Rico Pfaus | <rico.pfaus@kaufhof.de>

released under: The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
import { window, Logger } from 'opendatalayer';

// create logger instance
const logger = new Logger('ba/lib/rumba');
logger.log('loaded');

// SUPPORT TYPES --------------------------------------------------------------

/**
 * The tenant according to
 * https://gitlab.gkh-setu.de/specs/jumprfc-026-globalization/blob/master/jumprfc-026-globalization.md#tenants.
 */
class BATenant {

  static create() {
    const tenantEl = window.document.querySelector('[data-tenant-id]');
    const tenantId = tenantEl ? tenantEl.getAttribute('data-tenant-id') : '0001';

    return {
      id: tenantId,
    };
  }

}

/**
 * Container with core information about an event (type, timestamp, delta timestamp).
 */
class BAEvent {

  /**
   * Create new TrackingEvent object.
   * @param {String}  type  type name for this event
   */
  static create(type) {
    return {
      type,
      ts: new window.Date().getTime(),
      dts: window.performance && window.performance.now ? parseInt(window.performance.now(), 10) : 0,
    };
  }

}

/**
 * Container with information about current user identity.
 */
class BAIdentity {

  /**
   * Create new BAIdentity object.
   * @param {String}  vid  visitor ID of a logged in user
   */
  static create(vid = null) {
    return {
      bid: rumba.getBrowserID(),
      vid,
    };
  }

}

/**
 * Container with information about browser specifics (userAgent, platform, ...).
 */
class BABrowser {

  /**
   * Create new BABrowser object.
   */
  static create() {
    return {
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
      doNotTrack: BABrowser.checkDoNotTrack(),
    };
  }

  /**
   * Returns yes/no/unset depending on the user's DNT header.
   */
  static checkDoNotTrack() {
    switch (window.navigator.doNotTrack) {
      case '1': return 'yes';
      case '0': return 'no';
      default: return 'unset';
    }
  }

}

/**
 * Container with information about request.
 */
class BARequest {

  /**
   * Create new BARequest object.
   */
  static create() {
    return {
      rid: rumba.getRequestID(),
      tags: !rumba.storage ? ['ns'] : [],
    };
  }

}

/**
 * Container with information about page rendering times.
 */
class BAPageTiming {

  /**
   * Create new BAPageTiming object.
   */
  static create() {
    // record values from navigation timing API
    const performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;
    const t = performance && performance.timing ? performance.timing : null;
    if (t) {
      // XXX: if, for whatever reason, we end up with a timestamp after calculation, sanitize it to -1
      //      this fixes crazy issues in some browsers
      const sanitize = function sanitize(val) {
        if (val > 100000000000 || val < 0) {
          return -1;
        }
        return val;
      };
      const o = {
        lookupTime: sanitize(t.domainLookupEnd - t.domainLookupStart),
        redirectTime: sanitize(t.redirectEnd - t.redirectStart),
        connectTime: sanitize(t.connectEnd - t.connectStart),
        requestTime: sanitize(t.responseStart - t.requestStart),
        responseTime: sanitize(t.responseEnd - t.responseStart),
        renderTime: sanitize(t.domContentLoadedEventStart - t.navigationStart),
      };
      o.loadTime = o.lookupTime + o.redirectTime + o.connectTime + o.requestTime + o.responseTime + o.renderTime;
      return o;
    } else {
      return null;
    }
  }

}

/**
 * Contains breadcrumbs / navigation data from the user's page context.
 */
class BANavigationData {
  static create(navigation) {
    return {
      entries: navigation.entries,
    }
  }
}

/**
 * Container with information about a page.
 */
class BAPage {

  /**
   * Create new BAPage object.
   * @param {String}  type        type of page as defined by DAL
   * @param {String}  name        display name of page
   * @param {String}  breakpoint  the currently active breakpoint
   * @param {DALNavigation}  navigation  Navigation object (e.g. {entries: ['women', 'women/fashion', 'women/fashion/jeans']})
   */
  static create(type, name, breakpoint, navigation) {
    return {
      type,
      name,
      breakpoint,
      url: window.location.href,
      referrer: window.document.referrer || '',
      screenOrientation: BAPage.getScreenOrientation(),
      pageTiming: BAPageTiming.create(),
      navigationData: BANavigationData.create(navigation),
    };
  }

  /**
   * Get the device's screen orientation
    */
  static getScreenOrientation() {
    const ws = window.screen;
    const o = (ws.orientation || ws.webkitOrientation || ws.mozOrientation || ws.msOrientation || {});
    const angle = typeof window.orientation === 'number' ? window.orientation : o.angle;
    if (o.type) {
      return o.type.replace(/-primary|-secondary/, '');
    } else if (typeof angle === 'undefined') {
      return 'unknown';
    } else if (angle === -90 || angle === 90) {
      return 'landscape'; // + (if angle is 90 then "-primary" else "-secondary")
    }
    return 'portrait';  // we assume primary since most devices don't allow using the browser upside-down
  }

}

/**
 * Contains info about a brand, used to attach brand data to events.
 */
class BABrand {

  /**
   * Create new BABrand object.
   * @param  {String}   name      brand's display name
   * @param  {String}   brandKey  internal brandKey for this brand
   * @param  {String}   lineKey   internal lineKey for this brand
   */
  static create(name, brandKey, lineKey) {
    if (brandKey == null || brandKey.trim() === '' || name == null || name.trim() === '') {
      return null;
    }
    return {
      name,
      brandKey: brandKey.toString(),
      lineKey: lineKey ? lineKey.toString() : null,
    };
  }

}

/**
 * Contains info about a product, used to attach product data to events.
 */
class BAProduct {

  /**
   * Create new BAProduct object.
   * @param  {long}     productId   internal product id of product
   * @param  {long}     variantId   internal variant id of this product variant
   * @param  {long}     ean         european article number
   * @param  {long}     aonr        article obernummer
   * @param  {Brand}    brand       brand information associated with this product
   */
  static create(productId, variantId, ean, aonr, brand) {
    return {
      productId: productId.toString(),
      variantId: variantId.toString(),
      ean: ean.toString(),
      aonr: aonr.toString(),
      brand,
    };
  }

}

/**
 * Contains info about an error, optionally with stacktrace info from client.
 */
class BAError {

  /**
   * Create new BAError object.
   * @param  {String}   type      type of error
   * @param  {String}   message   human-readable error message
   * @param  {String}   url       URL of page where error occured
   * @param  {String}   stack     stacktrace info (as stringified JSON)
   */
  static create(type, message, url = '', stack = '') {
    return {
      type,
      message,
      url,
      stack,
    };
  }

}

/**
 * Contains info about a line item which contains a product and quantity.
 */
class BALineItem {

  /**
   * Create new BALineItem object.
   * @param  {BAProduct}  product   associated product
   * @param  {int}        quantity  number of products (defaults to 1)
   */
  static create(product, quantity = 1) {
    return {
      product,
      quantity,
    };
  }

}

/**
 * Contains info about an order. In the first version this only conatins product and
 * brand related information.
 */
class BAOrder {

  /**
   * Create new BAOrder object.
   * @param  {Array<BALineItem>}  lineItems   array with line items in this order
   */
  static create(lineItems) {
    return {
      lineItems,
    };
  }

}

// EVENTS ---------------------------------------------------------------------

/**
 * Event fired when a user script throws an error.
 * See http://gitlab.gkh-setu.de/bsna/bsna-services/blob/master/shared/shared-model/src/main/avro/TrackingEvent.avdl for details.
 */
class BAScriptErrorEvent {

  /**
   * Create new BAScriptErrorEvent object.
   * @param  {String}   type      type of error
   * @param  {String}   message   human-readable error message
   * @param  {String}   url       URL of page where error occured
   * @param  {String}   stack     stacktrace info (as stringified JSON)
   */
  static create(errorType, message, url, stack) {
    return {
      tenant: BATenant.create(),
      event: BAEvent.create('ScriptError'),
      identity: BAIdentity.create(),
      browser: BABrowser.create(),
      err: BAError.create(errorType, message, url, stack),
    };
  }

}

/**
 * Generic logging event to be used for dynamic key/value logging.
 * See http://gitlab.gkh-setu.de/bsna/bsna-services/blob/master/shared/shared-model/src/main/avro/TrackingEvent.avdl for details.
 */
class BAKeyValueEvent {

  /**
   * Create new BAKeyValueEvent instance.
   * @param {String}  name    label of the data entry
   * @param {String}  value   value of the data entry (non-complex type)
   */
  static create(name, value) {
    return {
      event: BAEvent.create('KeyValue'),
      identity: BAIdentity.create(),
      name,
      value,
    };
  }

}

/**
 * Pageload event, holding data about an individual page request and optional product data.
 * See http://gitlab.gkh-setu.de/bsna/bsna-services/blob/master/shared/shared-model/src/main/avro/TrackingEvent.avdl for details.
 */
class BAPageLoadEvent {

  /**
   * Create new BAPageLoadEvent instance.
   * @param {String}  pageType    type ID for the page's type (e.g. "productdetail", "homepage", ...)
   * @param {String}  pageName    display name of page
   * @param {String}  breakpoint  shortname of viewport breakpoint (e.g. "S_to_M")
   * @param {DALNavigation}  navigation  Navigation object (e.g. {entries: ['women', 'women/fashion', 'women/fashion/jeans']})
   */
  static create(pageType, pageName, breakpoint, navigation) {
    return {
      tenant: BATenant.create(),
      event: BAEvent.create('PageLoad'),
      identity: BAIdentity.create(),
      browser: BABrowser.create(),
      request: BARequest.create(),
      page: BAPage.create(pageType, pageName, breakpoint, navigation),
    };
  }

}

/**
 * AddedToCart event, holding data about an individual product that was added to the shopping cart.
 * See http://gitlab.gkh-setu.de/bsna/bsna-services/blob/master/shared/shared-model/src/main/avro/TrackingEvent.avdl for details.
 */
class BAProductAddedToCartEvent {

  /**
   * Create new BAProductAddedToCartEvent instance.
   * @param {BALineItem}   lineItem    lineitem to be added
   */
  static create(lineItem) {
    return {
      tenant: BATenant.create(),
      event: BAEvent.create('ProductAddedToCart'),
      identity: BAIdentity.create(),
      pageLoadRequest: BARequest.create(),
      lineItem,
    };
  }

}

// APPLICATION ----------------------------------------------------------------

/**
 * The RUMBA main class, contains business logic and gets instantiated as singleton.
 */
class RUMBA {

  /**
   * Create new RUMBA instance.
   */
  constructor() {
    /**
     * internal configuration object
     */
    this.config = {
      autoPush: true,         // set to false to disable automatic pushes to the backend
      pushInterval: 10,       // request delay for backend calls (in seconds)
      sessionLifetime: 1800,  // lifetime of user session in seconds (default is 30min)
      backend: '',            // example backend URL
      repostOnError: true,    // set to false to activate fire&forget behavior
    };
    // internals
    this.initialized = false;
    this.queue = []; // event queue
    this.storage = null;
    try {
      window.localStorage.setItem('test', 'test');
      window.localStorage.removeItem('test');
      this.storage = window.localStorage;
    } catch (e) {
      // FIXME: we might load a polyfill here or fall back to cookies
      this.storage = null;
    }
    this.storageKey = 'rumba.data';      // name of internal storage key
    this.sessionKey = 'rumba.session';   // name of internal session key
    this.browserId = ''; // unique name/id of user's browser for session-independent recognition
    this.session = null; // session data for current user's session (object with ts/id properties)
    this.pushDelay = 0;  // ms until next push attempt (auto-increases on error to prevent DOS'ing backend)

    // generate uuid for this single page impression (used to connect
    // all asynchronous rumba calls to one context)
    this.rid = this.generateUUID();
    logger.log('RequestId is ', this.rid);

    // restore entries that might have been logged after last push on previous page
    if (this.storage) {
      logger.log('storage found');
      const d = this.storage.getItem(this.storageKey);
      if (d && d.length > 0) {
        logger.log('stored data found', d);
        try {
          this.queue = window.JSON.parse(d);
        } catch (e) {
          logger.warn('failed to parse stored data');
        }
      }
    }
  }

  /**
   * Send data to backend, either using AJAX post or falling back to form-submit.
   * @param {String}    url         server URL to POST data to
   * @param {String}    data        data (post body) to be sent
   * @param {Function}  onSuccess   success callback
   * @param {Function}  onError     error callback
   */
  post(url, data, onSuccess, onError) {
    logger.log(`post to ${url}:`, data);
    let xhr = null;
    if (window.XMLHttpRequest) {
      try {
        xhr = new window.XMLHttpRequest();
      } catch (e) {
        logger.log(e);
        return null;
      }
    } else {
      try {
        xhr = new window.ActiveXObject('Msxml2.XMLHTTP');
      } catch (e) {
        try {
          xhr = new window.ActiveXObject('Microsoft.XMLHTTP');
        } catch (e2) {
          xhr = null;
        }
      }
    }
    if (xhr) {
      xhr.onreadystatechange = function onReadyStateChange() {
        if (xhr.readyState === 4) {
          // XXX: IE fix: see http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
          if ([200, 204, 422, 1223].indexOf(xhr.status) > -1) {
            if (onSuccess) {
              return onSuccess();
            }
          } else if (onError) {
            return onError();
          }
        }
        return false;
      };
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Rumba-Date', new window.Date().toJSON());
      return xhr.send(data);
    }
    return true;
  }

  /**
   * Generate a random UUID (based on current timestamp combined with Math.random)
   */
  generateUUID() {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = ((d + (Math.random() * 16)) % 16) | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
    });
  }

  /**
   * Write a given object to storage.
   *
   * IMPORTANT: overwrites ALL data in storage with current queue contents!
   * @param  {Object} data  non-complex object or Array to be stored
   */
  storeData(data) {
    if (this.storage) {
      this.storage.setItem(this.storageKey, window.JSON.stringify(data));
    }
    return true;
  }

  /**
   * Clear cache and storage.
   */
  clear() {
    logger.log('clearing cache');
    this.queue.length = 0;
    return this.storeData(this.queue);
  }

  /**
   * Immediately write all queued data to the backend.
   */
  push() {
    // make xhr call to backend API and clear queue
    logger.log('push', this.queue);
    if (this.queue.length > 0) {
      this.post(
        this.config.backend,
        window.JSON.stringify(this.queue),
        () => {
          logger.log('push: request successful, clearing cache');
          this.clear();
        },
        () => {
          if (this.config.repostOnError === false) {
            logger.log('push: request failed, but repostOnError set so clearing anyway');
            this.clear();
          }
          logger.log('push: request error, keeping cache');
        }
      );
    } else {
      logger.log('nothing to push');
    }
  }

  /**
   * Install scheduler for pushing data in constant intervals.
   */
  schedule() {
    logger.log(`.schedule: scheduling next push in ${this.pushDelay} ms`);
    setTimeout(() => {
      logger.log('.schedule: calling push');
      this.push();
      this.schedule();
    }, this.pushDelay);
    this.pushDelay *= 3; // increase exponentially to prevent DDOS'ing ourselves
  }

  /**
   * Compare two events and check if they are "technically equal", meaning they have the
   * identical property values, except timestamp and delta timestamp.
   */
  compareEvents(event1, event2) {
    // normalize event (clone and set ts/dts to 0)
    const normalize = (event) => {
      const e = JSON.parse(JSON.stringify(event));
      e.event.ts = 0;
      e.event.dts = 0;
      return e;
    };
    return JSON.stringify(normalize(event1)) === JSON.stringify(normalize(event2));
  }

  /**
   * Add an event to rumba's queue. Returns true if event was added, else false (e.g. to prevent event "spamming")
   * @param  {ClientEvent}  e  event object to be added to queue
   */
  event(e) {
    logger.log('adding event', e);
    // avoid "error spam" (@FIXME: use timestamp-based check for all event types)
    if (this.queue.length > 0 && e.event && e.event.type === 'ScriptError' && this.compareEvents(e, this.queue[this.queue.length - 1])) {
      logger.log('skipped event, identical to last queue item');
      return false;
    }
    // add event to queue (as plain object literal, to simplify unserialization from storage)
    this.queue.push(e);
    if (this.storage) {
      this.storeData(this.queue);
      return true;
    } else if (this.initialized && this.config.autoPush) {
      // if no storage available, always push immediately
      this.push();
      return true;
    }
    return false;
  }

  /**
   * Initialize internal client session.
   * @TODO handle external session supplied via config.sessionId
   */
  /* @XXX session handling is disabled because we don't need it
  initOrUpdateSession() {
    // helper that creates a (new) session and sends the appropriate event(s)
    const startNew = (hasCurrent = false) => {
      if (hasCurrent) {
        this.event(new SessionEndEvent(this.session.id));
      }
      this.session.id = this.generateUUID();
      return this.event(new SessionStartEvent(this.session.id));
    };
    // read session from storage
    this.session = null;
    try {
      this.session = JSON.parse(this.storage.getItem(this.sessionKey));
    } catch (error) {
      this.session = {};
    }
    // create/renew session
    const t = new Date().getTime();
    if (typeof this.session.ts === 'undefined') {
      logger.log('starting new session');
      startNew(); // entirely new session
    } else if (typeof this.session !== 'undefined' && this.session.ts < t - (this.config.sessionLifetime * 1000)) {
      logger.log('ending expired session and starting new');
      startNew(true); // expired session
    } else {
      logger.log('updating existing session');
    }
    // update new or running session either way
    this.session.ts = new Date().getTime();
    return this.storage.setItem(this.sessionKey, JSON.stringify(this.session));
  }
  */

  /**
   * Add a log statement to rumba's queue
   * @param  {String} name  key name for the value to store
   * @param  {Object} data  any kind of non-complex data (plain object, string, numbers; or Array of those)
   */
  log(name, data) {
    this.event(BAKeyValueEvent.create(name, data));
  }

  /**
   * Return current timestamp
   */
  now() {
    return new window.Date().getTime();
  }

  /**
   * Return the request ID for the current request.
   */
  getRequestID() {
    return this.rid;
  }

  /**
   * Return the browser ID assigned to this instance.
   */
  getBrowserID() {
    return this.browserId;
  }

  /**
   * Init rumba with given configuration and start the push scheduler.
   *
   * @param  {Object} config  configuration object with following options
   *  - autoPush<Boolean>:         set to false to disable automatic pushes to the backend
   *  - pushInterval<Number>:      request delay for backend calls (in seconds)
   *  - sessionLifetime<Number>:   lifetime of session in seconds (default is 1800)
   *  - backend<String>:           example backend URL
   *  - repostOnError<Boolean>:    set to false to activate fire&forget behavior
   */
  init(config = {}) {
    if (this.initialized) {
      logger.warn('already initialized');
      return;
    }
    logger.log('init');
    // extend config with supplied value
    const keys = Object.keys(config);
    for (let i = 0; i < keys.length; i += 1) {
      this.config[keys[i]] = config[keys[i]];
    }
    // set browser and session ids
    if (config.browserId) {
      this.browserId = config.browserId;
    }
    // session handling
    /* if (this.storage) {
      this.initOrUpdateSession();
    } */
    // install scheduler
    if (this.config.autoPush) {
      this.pushDelay = this.config.pushInterval * 1000;
      this.push();
      if (this.storage) {
        this.schedule();
      }
    }
    // done
    this.initialized = true;
  }

}

/**
 * Public singleton rumba instance.
 */
const rumba = new RUMBA();

// @XXX: this is required to still support the old API using require("ba/lib/rumba", function (rumba) { rumba.ScriptErrorEvent; })

// support types
rumba.BATenant = BATenant;
rumba.BAEvent = BAEvent;  // do not override internal type Event
rumba.BAIdentity = BAIdentity;
rumba.BABrowser = BABrowser;
rumba.BARequest = BARequest;
rumba.BAPageTiming = BAPageTiming;
rumba.BANavigationData = BANavigationData;
rumba.BAPage = BAPage;
rumba.BABrand = BABrand;
rumba.BAProduct = BAProduct;
rumba.BAError = BAError;  // do not override internal type Error
rumba.BALineItem = BALineItem;
rumba.BAOrder = BAOrder;

// events
rumba.BAScriptErrorEvent = BAScriptErrorEvent;
rumba.BAKeyValueEvent = BAKeyValueEvent;
// rumba.SessionStartEvent = SessionStartEvent;
// rumba.SessionEndEvent = SessionEndEvent;
rumba.BAPageLoadEvent = BAPageLoadEvent;
rumba.BAProductAddedToCartEvent = BAProductAddedToCartEvent;
// rumba.ClickEvent = ClickEvent;
// rumba.FocusEvent = FocusEvent;

export default rumba;
