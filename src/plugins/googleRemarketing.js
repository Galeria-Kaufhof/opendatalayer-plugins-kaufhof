import window from 'gk/globals/window';
import Logger from 'gk/lib/logger';
// import 'https://www.googleadservices.com/pagead/conversion_async.js';

const logger = new Logger('ba/lib/dal/aff/googleRemarketing');

/**
 * GoogleRemarketing pixel DAL plugin
 *
 * @module   ba.lib.dal.aff.googleRemarketing
 * @class    GoogleRemarketing
 * @implements  IDALService
 */
export default class GoogleRemarketing {

  constructor(dal, data, config) {
    logger.log('initialize');
    // @TODO use System.import once systemjs is globally available
    window.require([`${window.location.protocol}//www.googleadservices.com/pagead/conversion_async.js`], () => {
      // build params
      let [pageType, category, prodName, prodPrice, prodId, memberType, payback] = [];
      switch (data.page.type) {
        case 'homepage':
          pageType = 'home';
          break;
        case 'category':
          pageType = 'category';
          category = data.category.id;
          break;
        case 'productdetail':
          pageType = 'product';
          category = data.product.category;
          prodId = data.product.ean;
          prodName = data.product.name;
          prodPrice = data.product.priceData.total;
          break;
        case 'checkout-cart':
          pageType = 'cart';
          break;
        case 'checkout-confirmation':
          pageType = 'purchase';
          // build memberType (see LIVE-5019)
          payback = data.order.paybackPoints > 0 ? '1' : '0';
          memberType = (data.order.customer.loginstatus.match(/Guest$/) !== null) ? '0' : '1';
          break;
        default:
      }

      if (data.page.type === 'checkout-cart' || data.page.type === 'checkout-confirmation') {
        category = [];
        prodName = [];
        prodPrice = [];
        prodId = [];
        const products = data.cart ? data.cart.products : data.order.products;
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          category.push(p.category);
          prodName.push(p.name);
          prodPrice.push(p.priceData.total);
          prodId.push(p.ean);
        }
      }

      // use async tracking (see https://developers.google.com/adwords-remarketing-tag/asynchronous/)
      const customParams = {
        ecomm_pagetype: pageType,
        ecomm_category: category,
        ecomm_prodname: prodName,
        ecomm_prodid: prodId,
        ecomm_totalvalue: prodPrice,
      };
      if (memberType) {
        customParams.membertype = memberType;
      }
      if (payback) {
        customParams.payback = payback;
      }
      window.google_trackConversion({
        google_conversion_id: config.conversionId,
        google_conversion_label: config.conversionLabel,
        google_remarketing_only: true,
        google_conversion_format: 3,
        google_custom_params: customParams,
      });
    });
  }
}
