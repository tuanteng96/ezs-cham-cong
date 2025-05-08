import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import ConfigsAPI from "@/api/Configs.api";

function SelectUserShifts(props) {

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectUserShifts", key],
    queryFn: async () => {
      const { data } = await ConfigsAPI.getValue("calamviecconfig");
      let result = [];
      
      if (data.data && data.data.length > 0) {
        if (data.data[0].Value) {
          
          let p = JSON.parse(data.data[0].Value);
          result = p.map((x) => ({ ...x, value: x.ID, label: x.Name }));
        }
      }
     
      return result
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

export default SelectUserShifts;
