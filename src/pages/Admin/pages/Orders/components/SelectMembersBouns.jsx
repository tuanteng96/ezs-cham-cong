import { SelectPickersGroup } from "@/partials/forms";
import React, { useEffect, useState } from "react";

function SelectMembersBouns({ options, ...props }) {
  let [key, setKey] = useState("");
  let [data, setData] = useState([]);

  useEffect(() => {
    if (key) {
      let newData = options
        .map((x) => ({
          ...x,
          options: x.options
            ? x.options.filter(
                (o) => o.label.toLowerCase().indexOf(key.toLowerCase()) > -1
              )
            : [],
        }))
        .filter((o) => o.options.length > 0);
      setData(newData);
    } else {
      setData([]);
    }
  }, [key]);

  return (
    <SelectPickersGroup
      {...props}
      isFilter={true}
      placeholderInput="Nhập tên nhân viên"
      options={key ? data : options}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectMembersBouns;
