import moment from "moment";

const ArrayHelpers = {
  useInfiniteQuery: (page, key = "data") => {
    let newPages = [];
    if (!page || !page[0]) return newPages;
    for (let items of page) {
      for (let x of items[key]) {
        newPages.push(x);
      }
    }
    return newPages;
  },
  sumTotal: (arr, key) => {
    if (!arr) return 0;
    return arr.reduce((n, item) => n + (item[key] || 0), 0);
  },
  groupbyDDHHMM: (arr, name = "BookDate") => {
    const newArr = [];
    if (!arr) return false;
    arr.map((item) => {
      const dayFull = item[name];
      const d = dayFull.split("T")[0];
      var g = null;
      newArr.every((_g) => {
        if (_g.day == d) g = _g;
        return g == null;
      });
      if (g == null) {
        g = {
          day: d,
          dayFull: dayFull,
          items: [],
        };
        newArr.push(g);
      }
      g.items.push(item);
    });
    return newArr
      .map((item) => ({
        ...item,
        items: item.items.sort((left, right) =>
          moment.utc(right[name]).diff(moment.utc(left[name]))
        ),
      }))
      .sort((left, right) =>
        moment.utc(right.dayFull).diff(moment.utc(left.dayFull))
      );
  },
  findNodeByName: (data, name) => {
    let response = null;
    let findNameItem = (tree) => {
      let result = null;
      if (tree.name === name && !tree?.subs) {
        return tree;
      }

      if (Array.isArray(tree.children) && tree.children.length > 0) {
        tree.children.some((node) => {
          result = findNameItem(node);
          return result;
        });
      }
      return result;
    };
    if (!data) return null;
    for (let item of data) {
      if (findNameItem(item)) {
        response = findNameItem(item);
        break;
      }
    }
    return response;
  },
};

export default ArrayHelpers;
