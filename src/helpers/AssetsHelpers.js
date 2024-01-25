import StoreHelper from "./StoreHelper";


const toAbsoluteUrl = (pathname, path = "/upload/image/") => {
  return StoreHelper.getDomain() + path + pathname;
};

const AssetsHelpers = {
  toAbsoluteUrl,
};

export default AssetsHelpers;