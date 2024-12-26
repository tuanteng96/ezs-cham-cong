import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from ".";

const SelectMoneyCardClients = forwardRef((props, ref) => {
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectMoneyCardClients", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectMoneyCardClient({
        Key: key,
        Token: Auth?.token || "",
      });
      return data?.data && data?.data.length > 0
        ? data?.data
            .map((item) => ({
              ...item,
              label: item.text,
              value: item.id,
            }))
            .sort((a, b) => a.index - b.index)
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
});

export default SelectMoneyCardClients;
