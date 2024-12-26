import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

function SelectServiceProtocol(props) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectServiceProtocol", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectServiceProtocol({
        Key: key,
        CurrentStockID: CrStocks?.ID || "",
        Token: Auth?.token || "",
      });
      return data?.data && data?.data.length > 0
        ? data?.data.map((item) => ({
            ...item,
            label: item.text === "TAT_CA" ? "Tất cả" : item.text,
            value: item.id,
          }))
        : [];
    },
    keepPreviousData: true,
  });

  return (
    <SelectPicker
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectServiceProtocol;
