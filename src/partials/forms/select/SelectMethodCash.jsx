import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import StringHelpers from "@/helpers/StringHelpers";
import { useDebounce } from "@/hooks";

function SelectMethodCash(props) {
  let Auth = useStore("Auth");
  let [data, setData] = useState([]);

  let [key, setKey] = useState("");
  const debouncedKey = useDebounce(key, 300);

  let MethodCash = useQuery({
    queryKey: ["SelectMethodCash", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectCashMethod({
        Token: Auth?.token || "",
      });
      return data?.data && data?.data.length > 0
        ? data?.data.map((item) => ({
            ...item,
            label: item.text,
            value: item.id,
          }))
        : [];
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setData(MethodCash?.data || []);
  }, [MethodCash?.data]);

  useEffect(() => {
    if (key) {
      setData(
        MethodCash?.data
          ? MethodCash?.data.filter((x) =>
              StringHelpers.ConvertViToEn(x.label, true).includes(
                StringHelpers.ConvertViToEn(key, true)
              )
            )
          : []
      );
    } else {
      setData(MethodCash?.data || []);
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

export default SelectMethodCash;
