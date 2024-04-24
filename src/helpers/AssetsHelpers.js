import StoreHelper from "./StoreHelper";


const toAbsoluteUrl = (pathname, path = "/upload/image/") => {
  return StoreHelper.getDomain() + path + pathname;
};

const toAbsoluteUrlCore = (pathname, path = "/upload/image/") => {
  return import.meta.env.VITE_HOST + path + pathname;
};

const AssetsHelpers = {
  toAbsoluteUrl,
  toAbsoluteUrlCore
};

export default AssetsHelpers;