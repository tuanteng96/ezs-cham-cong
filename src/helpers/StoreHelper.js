import store from "../js/store";

const StoreHelper = {
  getDomain: () => {
    return store?.getters?.Brand?.value?.Domain || null
  },
  getToken: () => {
    return store?.getters?.Auth?.value?.token || null
  }
};

export default StoreHelper;
