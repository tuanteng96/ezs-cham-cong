const set = async ({ data, success, fail }) => {
  try {
    await Promise.resolve().then(function () {
      for (const key in data) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    });
    success && success();
  } catch (err) {
    success && success();
    console.log(err)
    //fail && fail(err);
  }
};

const get = async ({ keys, success, fail }) => {
  try {
    let response = {};
    await Promise.resolve().then(function () {
      for (const key of keys) {
        response[key] = JSON.parse(localStorage.getItem(key));
      }
    });
    success && success(response);
  } catch (err) {
    fail && fail(err);
  }
};

const remove = async ({ keys, success, fail }) => {
  try {
    await Promise.resolve().then(function () {
        for (const key in keys) {
          localStorage.removeItem(keys[key]);
        }
      });
      success && success();
  } catch (err) {
    fail && fail(err);
  }
};

const StorageHelpers = { set, get, remove };
export default StorageHelpers;
