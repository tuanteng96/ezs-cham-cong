import AdminAPI from "@/api/Admin.api";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

function SelectDistricts({ ProvinceID = "", ...props }) {

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectDistricts", {key, ProvinceID}],
    queryFn: async () => {
      const { data } = await AdminAPI.getDistricts({
        Key: key,
        Pid: ProvinceID || "",
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
    enabled: Number(ProvinceID) > 0,
  });

  return (
    <SelectPicker
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectDistricts;
