import StoreHelper from "./StoreHelper";

const StringHelpers = {
  getFirstText: (text) => {
    if (!text) return;
    return text.split(" ").reverse()[0].charAt(0)
  },
  formatVND: price => {
    if (!price || price === 0) {
      return '0'
    } else {
      return price.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')
    }
  },
  formatVNDPositive: price => {
    if (!price || price === 0) {
      return '0'
    } else {
      return Math.abs(price)
        .toFixed(0)
        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')
    }
  },
  fixedContentDomain: (content) => {
    if (!content) return "";
    return content.replace(/src=\"\//g, 'src="' + StoreHelper.getDomain() + "/");
  }
};

export default StringHelpers;