import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import ProdsAPI from "@/api/Prods.api";

function SelectServiceRoots(props) {
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectServicesRoots", key],
    queryFn: async () => {
      const { data } = await ProdsAPI.getServicesRoots({
        Key: key,
        Token: Auth?.token || "",
      });
      return data?.lst && data?.lst.length > 0
        ? data?.lst.map((item) => ({
            ...item,
            label: item.Title,
            value: item.ID,
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

export default SelectServiceRoots;
