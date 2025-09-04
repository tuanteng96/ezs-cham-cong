import { SelectPickersGroup } from "@/partials/forms";
import React, { forwardRef, useEffect, useState } from "react";

const SelectMembersBouns = forwardRef(({ options, ...props }, ref) => {
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
      ref={ref}
      isFilter={true}
      placeholderInput="Nhập tên nhân viên"
      options={key ? data : options}
      onInputFilter={(value) => setKey(value)}
    />
  );
});

export default SelectMembersBouns;
