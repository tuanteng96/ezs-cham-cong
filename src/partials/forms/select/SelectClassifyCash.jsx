import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import { useDebounce } from "@/hooks";
import StringHelpers from "@/helpers/StringHelpers";
import ConfigsAPI from "@/api/Configs.api";

function SelectClassifyCash({ Type, ...props }) {
  let Auth = useStore("Auth");

  let [data, setData] = useState([]);
  let [key, setKey] = useState("");
  const debouncedKey = useDebounce(key, 300);

  let ClassifyCash = useQuery({
    queryKey: ["SelectClassifyCash", { key, Type }],
    queryFn: async () => {
      if (!Type) return [];
      let { data: rs } = await ConfigsAPI.getValue(
        "CashCustomType:CHI_THUONG,CashCustomType:THU_PHAT"
      );
      let result = [];
      if (Type && rs.data && rs.data.length > 0) {
        if (Type === "THU") {
          let index = rs.data.findIndex(
            (x) => x.Name === "CashCustomType:THU_PHAT"
          );
          if (index > -1) {
            result = rs.data[index].Value
              ? rs.data[index].Value.split(",").map((x) => ({
                  label: x,
                  value: x,
                }))
              : [];
          }
        } else if (Type === "CHI") {
          let index = rs.data.findIndex(
            (x) => x.Name === "CashCustomType:CHI_THUONG"
          );
          result = rs.data[index].Value
            ? rs.data[index].Value.split(",").map((x) => ({
                label: x,
                value: x,
              }))
            : [];
        }
      }
      return result;
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setData(ClassifyCash?.data || []);
  }, [ClassifyCash?.data]);

  useEffect(() => {
    if (key) {
      setData(
        ClassifyCash?.data
          ? ClassifyCash?.data.filter((x) =>
              StringHelpers.ConvertViToEn(x.label, true).includes(
                StringHelpers.ConvertViToEn(key, true)
              )
            )
          : []
      );
    } else {
      setData(ClassifyCash?.data || []);
    }
  }, [debouncedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SelectPicker
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectClassifyCash;
