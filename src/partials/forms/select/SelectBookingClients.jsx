import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { useQuery } from "react-query";
import { SelectBookingPicker } from ".";
import { useDebounce } from "@/hooks";

const SelectBookingClients = forwardRef(
  ({ hiddenVisitors = false, ...props }, ref) => {
    let Auth = useStore("Auth");
    let CrStocks = useStore("CrStocks");
    let [visible, setVisible] = useState(false);

    let [key, setKey] = useState("");

    const debouncedKey = useDebounce(key, 400);

    let { data } = useQuery({
      queryKey: ["SelectBookingClients", { debouncedKey, visible }],
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
              .filter((x) =>
                hiddenVisitors ? x.text !== "Khách vãng lai" : x.text
              )
              .sort((a, b) => a.index - b.index)
          : [];
      },
      keepPreviousData: true,
      enabled: visible,
    });

    window.SelectMembers = data;

    return (
      <SelectBookingPicker
        options={data || []}
        {...props}
        ref={ref}
        onInputFilter={(value) => setKey(value)}
        onVisible={(val) => setVisible(val)}
      />
    );
  }
);

export default SelectBookingClients;
