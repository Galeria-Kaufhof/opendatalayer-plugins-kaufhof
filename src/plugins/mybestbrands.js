import { Logger, window } from 'opendatalayer';

const logger = new Logger('mybestbrands');

// NOTE: mybestbrands got no unit test, due to the completely stupid script block
// they supply to their customers

/**
 * mybestbrands ODL plugin
 *
 * @module   ba.lib.odl.bt.mybestbrands
 * @class    MyBestBrands
 * @implements  IODLService
 */
export default class MyBestBrands {

  constructor(odl, data, config) {
    logger.log('initialize');

    if (data.page.type === 'checkout-confirmation') {
      // collect products
      const products = data.order.products.map(p => ({
        pid: p.ean,
        prn: p.name,
        pri: p.priceData.net,
        qty: p.quantity,
        trc: 'basket',
      }));

      // create options
      const itsConv = {
        // MANDATORY FIELD: This is the product category for this conversion target.
        // Important: The value for this product category needs to be set in your network configuration beforehand.
        trcCat: 'basket',

        // MANDATORY FIELD: This is the name of the conversion target.
        // Important: The value for this conversion target needs to be set in your network configuration beforehand.
          // Your possible conversion targets are: 'sale','mbbsale',
        convTarget: 'mbbsale',

        // MANDATORY FIELD: This is a short description of the conversion page.
        // Examples: Check-Out, Registration Complete, Valentines Day Promotion.
        siteId: 'ordercomplete',

        // MANDATORY FIELD: This the unique conversion identifier from your system. Examples: OrderID, CustomerID, LeadID.
        // If you can't provide a correct unique conversion identifier you can use 'auto' and our system will generate it automatically.
        // This could lead to validation problems due to the fact that an exact matching from your system to ours will not exist.
        convId: data.order.id,

        // MANDATORY FIELD: This is the net order value (without shipping and handling costs). Use a value of '0.00' for conversion targets without net order value.
        ordValue: data.order.priceData.net,

        // MANDATORY FIELD: This is the ISO currency code (ISO 4217).
        // Examples: 'EUR', 'GBP', 'CHF'.
        ordCurr: config.currency,

        // OPTIONAL FIELDS: These are additional customer parameters.
        // isCustNew : '', # OPTIONAL. New or existing customer. Use value 'true' for new customer or 'false' for existing customer.
        // custGend : '', # This specifies the customer's gender. Use value 'm' for male or 'f' for female.
        // custAge : '', # This specifies the customer's age. We recommend to use the birth date in the format 'MM-DD-YYYY'.
        // OPTIONAL FIELD: This field is used for detailed shopping basket information. Build this field in JSON format.
        // A single basket position contains these mandatory fields:
        // pid: Unique product ID
        // prn: Product name
        // pri: Product price
        // qty: Quantity of units in this position
        // trc: Tracking category (corresponds to parameter 'trcCat')
        // prc: OPTIONAL FIELD: Product category hierarchy, using '.' as delimiter. Example: 'Women.Clothing.Shoes'.
        // Example of detailed shopping basket information:
        basket: JSON.stringify(products),

        // DO NOT CHANGE. The following parameters are used to identify the advertiser in the network.
        advId: config.advId,
        trcDomain: config.trcDomain,
      };

      // for testing
      window.itsConv = itsConv;

      // DO NOT CHANGE. The following lines assure tracking functionality.
      const document = window.document;

      en=function(v){if(v){if(typeof(encodeURIComponent)=='function'){return(encodeURIComponent(v));}return(escape(v));}};ts=function(){var d=new Date();var t=d.getTime();return(t);};im=function(s){if(document.images){if(typeof(ia)!="object"){
      var ia=new Array();};var i=ia.length;ia[i]=new Image();ia[i].src=s;ia[i].onload=function(){};}else{document.write('<img src="'+s+'" height="1" width="1" border="0" alt="">');}};var pr='http'+(document.location.protocol=='https:'?'s':'')+':';
      fr=function(s){var d=document;var i=d.createElement("iframe");i.src=s;i.frameBorder=0;i.width=0;i.height=0;i.vspace=0;i.hspace=0;i.marginWidth=0;i.marginHeight=0;i.scrolling="no";i.allowTransparency=true;try{d.body.insertBefore(i,d.body.firstChild);}catch(e){
      d.write('<ifr'+'ame'+' src="'+s+'" width="0" height="0" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" scrolling="no" allowtransparency="true"></ifr'+'ame>');}};ap=function(o){var v='tst='+ts();if(o.trcCat){v+='&trc='+en(o.trcCat);}
      v+='&ctg='+en(o.convTarget);var i=(o.convId)?o.convId:o.convTarget+':'+ts();v+='&cid='+en(i);if(o.ordValue){v+='&orv='+en(o.ordValue);}if(o.ordCurr){v+='&orc='+en(o.ordCurr);}if(o.discValue){v+='&dsv='+en(o.discValue);}if(o.discCode){v+='&dsc='+en(o.discCode);}
      if(o.invValue){v+='&inv='+en(o.invValue);}if(o.confStat){v+='&cfs='+en(o.confStat);}if(o.admCode){v+='&amc='+en(o.admCode);}if(o.subCode){v+='&smc='+en(o.subCode);}if(o.userVal1){v+='&uv1='+en(o.userVal1);}if(o.userVal2){v+='&uv2='+en(o.userVal2);}if(o.userVal3){
      v+='&uv3='+en(o.userVal3);}if(o.userVal4){v+='&uv4='+en(o.userVal4);}if(o.isCustNew){var n=o.isCustNew.toLowerCase();v+='&csn=';v+=(n=="true"||n=="false")?n:"null";}if(o.custId){v+='&csi='+en(o.custId);}if(o.custGend){var g=o.custGend.toLowerCase();v+='&csg=';
      v+=(g=="m"||g=="f")?g:"null";}if(o.custAge){v+='&csa='+en(o.custAge);}if(o.basket){v+='&bsk='+en(o.basket);}if(o.addData){v+='&adt='+en(o.addData);}if(o.custSurv){v+='&csr='+en(o.custSurv);}if(o.siteId){v+='&sid='+en(o.siteId);}var s=(screen.width)?screen.width:"0";
      s+="X";s+=(screen.height)?screen.height:"0";s+="X";s+=(screen.colorDepth)?screen.colorDepth:"0";v+='&scr='+s;v+='&nck=';v+=(navigator.cookieEnabled)?navigator.cookieEnabled:"null";v+='&njv=';v+=(navigator.javaEnabled())?navigator.javaEnabled():"null";return(v);};
      itsStartConv=function(o){var s=pr+'#'+o.trcDomain+'/ts/'+o.advId+'/tsa?typ=f&'+ap(o);fr(s);};itsStartConv(itsConv);
      writeScript=function(s,c){if(typeof c==="undefined"){c=""}var d=document;try{var a=document.createElement("script");a.type="text/javascript";a.async=true;a.src=s;if(c!=""){a.onload=c;a.onreadystatechange=function(){if(this.readyState=="complete"){c()}}}var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)}catch(e){d.write('<script src="'+s+'"><\/script>')}};
      writeScript("http"+("https:"==document.location.protocol?"s":"")+":#"+itsConv.trcDomain+"/scripts/ts/"+itsConv.advId+"contA.js");
    }
  }
}
