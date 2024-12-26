import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPickersGroup } from "..";

function SelectMembersCharge(props) {
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let { data } = useQuery({
    queryKey: ["SelectMembersCharge", key],
    queryFn: async () => {
      const { data } = await AdminAPI.selectMembersCharge({
        Key: key,
        Token: Auth?.token || "",
      });

      let newData = [];
      
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id, suffix } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            newData[index].options.push({
              label: text === "TAT_CA" ? "Tất cả" : `${text} ${suffix && `(${suffix})`}`,
              value: id,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = group === "TAT_CA" ? "Tất cả" : group;
            newItem.groupid = groupid;
            newItem.options = [
              {
                label: text === "TAT_CA" ? "Tất cả nhân viên" : `${text} ${suffix && `(${suffix})`}`,
                value: id,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }
      return newData;
    },
    keepPreviousData: true,
  });

  return (
    <SelectPickersGroup
      options={data || []}
      {...props}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectMembersCharge;
