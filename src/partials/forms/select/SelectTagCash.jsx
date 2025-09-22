import React, { useEffect, useState } from "react";
import { SelectPicker } from "..";
import { useDebounce } from "@/hooks";
import StringHelpers from "@/helpers/StringHelpers";
import XML from "@/xml";

function SelectTagCash({ isAdvanced = false, ...props }) {
  let [data, setData] = useState([]);
  let [key, setKey] = useState("");

  const debouncedKey = useDebounce(key, 300);

  useEffect(() => {
    setData(XML.TagCash || []);
  }, []);

  useEffect(() => {
    if (key) {
      setData(
        XML.TagCash
          ? XML.TagCash.filter((x) =>
              StringHelpers.ConvertViToEn(x.label, true).includes(
                StringHelpers.ConvertViToEn(key, true)
              )
            )
          : []
      );
    } else {
      setData(XML.TagCash || []);
    }
  }, [debouncedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SelectPicker
      options={data.filter((x) => (isAdvanced ? isAdvanced : x.Basic)) || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectTagCash;
