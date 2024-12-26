import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { useQuery } from "react-query";
import { SelectBookingPicker } from ".";

const SelectBookingClients = forwardRef((props, ref) => {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectBookingClients", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectClient({
        Key: key,
        CurrentStockID: CrStocks?.ID || "",
        MemberID: "",
        Token: Auth?.token || "",
      });
      return data?.data && data?.data.length > 0
        ? data?.data
            .map((item) => ({
              ...item,
              label: item.text,
              value: item.id,
              index: item.text !== "Khách vãng lai" ? 1 : 0,
            }))
            .sort((a, b) => a.index - b.index)
        : [];
    },
    keepPreviousData: true,
  });

  return (
    <SelectBookingPicker
      options={data || []}
      {...props}
      ref={ref}
      onInputFilter={(value) => setKey(value)}
    />
  );
});

export default SelectBookingClients;