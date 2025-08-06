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
  sortDateTime: (arr, name = "BookDate") => {
    if (!arr) return [];
    return arr.sort((left, right) =>
      moment.utc(right[name]).diff(moment.utc(left[name]))
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
  employeeRatio: (count) => {
    if (!count) return null;
    if (count === 1) {
      return [100];
    }
    if (count === 2) {
      return [50, 50];
    }
    if (count === 3) {
      return [33.333, 33.333, 33.333];
    }
    if (count === 4) {
      return [25, 25, 25, 25];
    }
    if (count === 5) {
      return [20, 20, 20, 20, 20];
    }
    if (count === 6) {
      return [16.666, 16.666, 16.666, 16.666, 16.666, 16.666];
    }
    if (count === 7) {
      return [14.285, 14.285, 14.285, 14.285, 14.285, 14.285, 14.285];
    }
    if (count === 8) {
      return [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5];
    }
    if (count === 9) {
      return [
        11.111, 11.111, 11.111, 11.111, 11.111, 11.111, 11.111, 11.111, 11.111,
      ];
    }
    if (count === 10) {
      return [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    }
  },
  getCommissionValue: ({ user, item, Type }) => {
    if (item.gia_tri_thanh_toan === "NaN") {
      if (
        item?.prodBonus?.BonusSaleLevels &&
        item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary) &&
        Type.value !== "KY_THUAT_VIEN"
      ) {
        let { BonusSaleLevels } = item?.prodBonus;
        let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
        let Salary = 0;
        if (index > -1) {
          Salary = BonusSaleLevels[index].Salary;
        }
        return Salary * item.Qty;
      }

      if (Type.value !== "KY_THUAT_VIEN") {
        return item.prodBonus.BonusSale * item.Qty;
      }
      return item.prodBonus.BonusSale2 * item.Qty;
    }
    if (
      item?.prodBonus?.BonusSaleLevels &&
      item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary) &&
      Type.value !== "KY_THUAT_VIEN"
    ) {
      let { BonusSaleLevels } = item?.prodBonus;
      let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
      let Salary = 0;
      if (index > -1) {
        Salary = BonusSaleLevels[index].Salary;
      }
      if (Salary < 100) {
        return Math.round(
          (item.gia_tri_thanh_toan_thuc_te * Salary * (user.Value / 100)) / 100
        );
      }
      return Math.round(
        ((((item.gia_tri_thanh_toan_thuc_te * Salary) / item.ToPay) *
          user.Value) /
          100) *
          item.Qty
      );
    }

    if (Type.value !== "KY_THUAT_VIEN") {
      return item.prodBonus.BonusSale > 100
        ? Math.round(
            (((item.gia_tri_thanh_toan_thuc_te *
              item.prodBonus.BonusSale *
              item.Qty) /
              item.ToPay) *
              user.Value) /
              100
          )
        : Math.round(
            ((item.prodBonus.BonusSale / 100) *
              item.gia_tri_thanh_toan_thuc_te *
              user.Value) /
              100
          );
    }

    return item.prodBonus.BonusSale2 > 100
      ? Math.round(
          (((item.prodBonus.BonusSale2 *
            item.gia_tri_thanh_toan_thuc_te *
            item.Qty) /
            item.ToPay) *
            user.Value) /
            100
        )
      : Math.round(
          (user.Value *
            item.gia_tri_thanh_toan_thuc_te *
            (item.prodBonus.BonusSale2 / 100)) /
            100
        );
  },
  arrayContains: (x, y) => {
    return !x.reduce(
      (y, e, t) => ((t = y.indexOf(e)), t >= 0 && y.splice(t, 1), y),
      [...y]
    ).length;
  },
};

export default ArrayHelpers;
