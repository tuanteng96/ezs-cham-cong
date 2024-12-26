import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

function SelectServicesTransfer(props) {
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectServicesTransfer", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectServicesTransfer({
        Key: key,
        Token: Auth?.token || "",
      });
      return data?.data
        ? data?.data
            .filter((x) => x.id !== -1)
            .map((x) => ({
              ...x,
              label: x.text,
              value: x.id,
            }))
        : null;
    },
    keepPreviousData: true,
  });

  return (
    <SelectPicker
      options={data || []}
      {...props}
      ref={props.elRef}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectServicesTransfer;
