import StoreHelper from "./StoreHelper";

const StringHelpers = {
  getFirstText: (text) => {
    if (!text) return;
    return text.split(" ").reverse()[0].charAt(0);
  },
  formatVND: (price) => {
    if (!price || price === 0) {
      return "0";
    } else {
      return price.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
    }
  },
  formatVNDPositive: (price) => {
    if (!price || price === 0) {
      return "0";
    } else {
      return Math.abs(price)
        .toFixed(0)
        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
    }
  },
  fixedContentDomain: (content) => {
    if (!content) return "";
    return content.replace(
      /src=\"\//g,
      'src="' + StoreHelper.getDomain() + "/"
    );
  },
  getMultipleIndexOf: (str, searchQuery, acc = 0, result = []) => {
    if (!str || !searchQuery) {
      return {
        result,
        acc,
      };
    }
    const foundIndex = str.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (foundIndex < 0) {
      return {
        result,
        acc,
      };
    }
    return StringHelpers.getMultipleIndexOf(
      str.slice(foundIndex + searchQuery.length),
      searchQuery,
      acc + foundIndex + searchQuery.length,
      [...result, acc + foundIndex]
    );
  },
  ConvertViToEn: (str, toUpperCase = false) => {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư

    return toUpperCase ? str.toUpperCase() : str;
  },
  getClassOrder: (item) => {
    let obj = {};
    if (item?.Status === "user_sent") {
      obj.Value = "Mới gửi";
      obj.Color = "text-warning";
      obj.Background = "bg-warning-light";
      return obj;
    }
    if (
      item?.Status === "finish" &&
      item?.AdminAction === "TANG_DH_KET_THUC_NO"
    ) {
      obj.Value = "Hoàn thành - Đơn tặng";
      obj.Color = "text-success";
      obj.Background = "bg-success-light";
      return obj;
    }
    if (
      item?.Status === "finish" &&
      item?.AdminAction === "KHOA_NO_KET_THUC_NO"
    ) {
      obj.Value = "Hoàn thành - Khoá nợ";
      obj.Color = "text-success";
      obj.Background = "bg-success-light";
      return obj;
    }
    if (item?.Status === "finish" && item?.AdminAction !== "KHOA_NO_KET_THUC_NO" && item?.AdminAction !== "TANG_DH_KET_THUC_NO") {
      obj.Value = "Hoàn thành";
      obj.Color = "text-success";
      obj.Background = "bg-success-light";
      return obj;
    }
    if (item?.Status === "cancel" && item?.IsReturn) {
      obj.Value = "Trả hàng";
      obj.Color = "text-danger";
      obj.Background = "bg-danger-light";
      return obj;
    }
    if (item?.Status === "cancel" && !item?.IsReturn) {
      obj.Value = "Đơn huỷ";
      obj.Color = "text-danger";
      obj.Background = "bg-danger-light";
      return obj;
    }
  },
  formatQty : (v) =>  {
    if (typeof v === "number") return v;
    return parseFloat((v || '').replace(/\,/gmi, ''));
  } 
};

export default StringHelpers;
