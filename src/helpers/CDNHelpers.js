const addScript = async (src) =>
  new Promise(async (resolve, reject) => {
    var el = document.createElement("script");

    el.src = src;
    el.addEventListener("load", resolve);
    el.addEventListener("error", reject);
    var s = document.getElementsByTagName("script")[0];

    s.parentNode.insertBefore(el, s);
  });

const removeScript = async (srcs) =>
  new Promise(async (resolve, reject) => {
    document.querySelectorAll("script").forEach((s) => {
      if (srcs.some((x) => s.src && s.src.indexOf(x))) {
        s.remove();
      }
      resolve();
    });
  });

const CDNHelpers = {
  addScript,
  removeScript,
};
export default CDNHelpers;
