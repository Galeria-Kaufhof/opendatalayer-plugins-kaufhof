import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';

const logger = new Logger('ba/lib/dal/ga2');

/**
 * Google Analytics pixel DAL plugin
 *
 * @module   ba.lib.dal.ga2
 * @class    GoogleAnalytics2
 * @implements  IDALService
 */
export default class GoogleAnalytics2 {

  constructor(dal, data, config) {
    logger.log('initialize', config);
    this.config = config;

    const document = window.document;

    // GA snippet (we simply include the official code here)
    if (!window.ga) {
      (function (i, s, o, g, r, a, m) { i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments); }, i[r].l = 1 * new Date(); a = s.createElement(o),
      m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
      })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    }

    // @XXX: we need to use this ugly construct because clientID retrieval in the app works asynchronously
    this.initGA(data, config);
  }

  // Initialize GA tracking
  initGA(data, config, clientId = false) {
    const uaId = data.site.id === 'jump_live' ? config.gaProdId : config.gaDevId;
    const gaConfig = {
      name: 'galeria',         // individual tracker name to avoid conflicts with existing implementation
      cookieDomain: 'auto',    // set cookie domain to highest possible domain
      cookieExpires: 6307200,  // 2 years
      allowLinker: true,       // set google to accept linker parameters for x-domain tracking
    };

    // override the clientId if in App context
    if (clientId) {
      gaConfig.clientId = clientId;
    }

    window.ga('create', uaId, gaConfig);
    window.ga('galeria.set', 'anonymizeIp', true);
    window.ga('galeria.require', 'displayfeatures');

    // load ecommerce plugin for certain pages
    if (
      data.page.type === 'productdetail'
      || data.page.type === 'checkout-cart'
      || data.page.type === 'checkout-login'
      || data.page.type === 'checkout-lastCheck'
      || data.page.type === 'checkout-confirmation'
    ) {
      window.ga('galeria.require', 'ec');
    }

    // page-specific actions
    let pageName = this.mapPageName(data.page.name);
    switch (data.page.type) {
      case 'category':
        pageName = data.category.id;
        break;
      case 'productdetail':
        pageName = data.page.name.replace(/\/[0-9]{8,}$/, '');
        // track product view
        this.ecAddProduct(data.product);
        window.ga('galeria.ec:setAction', 'detail');
        break;
      case 'checkout-cart':
        for (let i = 0; i < data.cart.products.length; i++) {
          this.ecAddProduct(data.cart.products[i]);
        }
        window.ga('galeria.ec:setAction', 'checkout', { step: 1 });
        break;
      case 'checkout-login':
        window.ga('galeria.ec:setAction', 'checkout', { step: 2 });
        break;
      case 'checkout-lastCheck':
        window.ga('galeria.ec:setAction', 'checkout', { step: 3 });
        break;
      case 'checkout-confirmation': {
        const o = data.order;
        // track purchase
        for (let j = 0; j < o.products.length; j += 1) {
          const product = o.products[j];
          this.ecAddProduct(product, product.quantity);
        }
        window.ga('galeria.ec:setAction', 'purchase', {
          id: o.id,
          affiliation: '',
          revenue: o.priceData.total,
          tax: o.priceData.VAT,
          shipping: o.shipping,
          coupon: o.couponCode,
        });
        break;
      }
      default:
        break;
    }

    // track custom dimensions
    this.trackDimension('dimension1', pageName);
    this.trackDimension('dimension2', escape(window.navigator.userAgent), true);

    // handle campaign tracking
    this.trackCampaign();

    // send pageview
    window.ga('galeria.send', 'pageview');
  }

  // runtime event handling
  handleEvent(name, data) {
    if (name === 'addtocart') {
      // see https://jira.gkh-setu.de/browse/BSNA-716 for details
      this.ecAddProduct(data.product);
      window.ga('galeria.ec:setAction', 'add');
      return window.ga('galeria.send', 'event', 'UX', 'click', 'add to cart');
    }
    return false;
  }

  // track a custom dimension (lowercases if keepCase isn't set)
  trackDimension(name, value, keepCase = false) {
    const d = {};
    d[name] = typeof value === 'string' && keepCase !== true ? value.toLowerCase() : value;
    return window.ga('galeria.set', d);
  }

  // track a campaign (reads custom flags from URL and sets campaign as needed)
  trackCampaign() {
    // get URL params
    const query = {};
    const q = window.location.search.substring(1);
    const iterable = q.split('&');
    for (let i = 0; i < iterable.length; i += 1) {
      const chunk = iterable[i];
      const pair = chunk.split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    // read campaign data
    const medium = query.emsrc;
    const campaignData = __guard__(query.refId, x => x.split('/'));
    const newsletterData = query.newsletter;
    if ((medium && __guard__(campaignData, x1 => x1.length)) || __guard__(newsletterData, x2 => x2.length) > 1) {
      // track campaign infos using galeria.set
      const nlCampaign = newsletterData ? newsletterData.split('/', 2) : '';
      return window.ga('galeria.set', {
        campaignName: __guard__((newsletterData ? nlCampaign[1] : campaignData[1] ? campaignData[1] : campaignData[0]), x3 => x3.toLowerCase()),
        campaignSource: __guard__((newsletterData ? nlCampaign[0] : campaignData[0]), x4 => x4.toLowerCase()),
        campaignMedium: __guard__((newsletterData ? 'newsletter' : medium), x5 => x5.toLowerCase()),
      });
    }
    return true;
  }

  // add a product to the ecommerce tracking (just adds Product, does not send any action)
  ecAddProduct(product, quantity = 1, couponCode = '') {
    // see https://jira.gkh-setu.de/browse/BSNA-716 for details
    return window.ga('galeria.ec:addProduct', {
      id: product.ean,
      name: product.name,
      category: product.abteilungNummer,
      brand: product.brand,
      variant: product.aonr,
      price: product.priceData.total,
      coupon: couponCode,
      quantity,
    });
  }

  // @FIXME: pagename mapping, required until all analytics reports and data are translated to english
  mapPageName(name) {
    if (!this.config.mapPagenamesToEnglish) {
      return name;
    }
    // dynamic replacements (changes parts)
    const repl = [
      [/^ZumWarenkorb\//g, 'AddToCart/'],
      [/^Produkt\//g, 'Product/'],
    ];
    repl.forEach(r => name = name.replace(r[0], r[1]));
    // fixed mappings
    const map = {
      Startseite: 'Homepage',
      Fehlerseite: 'Error',
      Suchergebnis: 'SearchResult',
      'Bestellprozess/Warenkorb': 'Checkout/Basket',
      'Bestellprozess/Login': 'Checkout/Login',
      'Bestellprozess/Gastbestellung': 'Checkout/CustomerDataGuest',
      'Bestellprozess/Registrierung': 'Checkout/CustomerDataNewCustomer',
      'Bestellprozess/Lieferung': 'Checkout/DeliveryData',
      'Bestellprozess/Zahlungsart': 'Checkout/PaymentData',
      'Bestellprozess/Pruefen': 'Checkout/LastCheck',
      'Bestellprozess/Bestaetigung': 'Checkout/OrderConfirmation',
    };
    if (typeof map[name] !== 'undefined') {
      return map[name];
    }
    return name;
  }
}


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
