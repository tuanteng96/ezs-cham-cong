import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPickersGroup } from "..";
import StringHelpers from "@/helpers/StringHelpers";

function SelectMembers({ StockRoles, ...props }) {
  let [data, setData] = useState([]);
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let Members = useQuery({
    queryKey: ["SelectMembers"],
    queryFn: async () => {
      const { data } = await AdminAPI.selectMembers({
        Key: key,
        CurrentStockID: "",
        Token: Auth?.token || "",
      });

      let newData = [];
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            let obj = {
              label: text === "TAT_CA" ? "Tất cả" : text,
              value: id,
              ...key,
            };

            newData[index].options.push(obj);
          } else {
            const newItem = {};
            newItem.label = group === "TAT_CA" ? "Tất cả" : group;
            newItem.groupid = groupid;
            let obj = {
              label: text === "TAT_CA" ? "Tất cả nhân viên" : text,
              value: id,
              ...key,
            };

            newItem.options = [obj];
            newData.push(newItem);
          }
        }
      }

      return newData.filter((x) =>
        StockRoles ? StockRoles.some((s) => s.value === x.groupid) : true
      );
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setData(Members?.data || []);
  }, [Members?.data]);

  useEffect(() => {
    if (key) {
      setData(
        Members?.data
          ? Members?.data.map((s) => ({
              ...s,
              options: s.options
                ? s.options.filter((x) =>
                    StringHelpers.ConvertViToEn(x.label, true).includes(
                      StringHelpers.ConvertViToEn(key, true)
                    )
                  )
                : [],
            }))
          : []
      );
    } else {
      setData(Members?.data || []);
    }
  }, [key]);

  return (
    <SelectPickersGroup
      options={data || []}
      {...props}
      ref={props.elRef}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectMembers;
