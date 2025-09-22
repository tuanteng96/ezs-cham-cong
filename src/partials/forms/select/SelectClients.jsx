import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

const SelectClients = forwardRef((props, ref) => {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectClients", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectClient({
        Key: key,
        CurrentStockID: CrStocks?.ID || "",
        MemberID: "",
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

  return (
    <SelectPicker
      ref={ref}
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
});

export default SelectClients;
