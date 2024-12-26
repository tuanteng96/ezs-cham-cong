import React from "react";
import { SelectPicker } from "..";

function SelectGender({ value, ...props }) {
  let options = [
    {
      value: 0,
      label: "Nữ",
    },
    {
      value: 1,
      label: "Nam",
    },
  ];

  return (
    <>
      <SelectPicker
        options={options}
        value={
          value !== ""
            ? options.filter((x) => Number(x.value) === Number(value))
            : ""
        }
        {...props}
      />
    </>
  );
}

export default SelectGender;
