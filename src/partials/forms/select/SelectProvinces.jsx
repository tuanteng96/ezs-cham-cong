import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

function SelectProvinces(props) {
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectProvinces", key],
    queryFn: async () => {
      const { data } = await AdminAPI.getProvinces({
        Key: key,
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
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectProvinces;
