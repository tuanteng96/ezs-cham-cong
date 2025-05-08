import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPickersGroup } from "..";
import StringHelpers from "@/helpers/StringHelpers";

function SelectGroupRoles({ StockRoles, Params, ...props }) {
  let [data, setData] = useState([]);
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let GroupRoles = useQuery({
    queryKey: ["SelectGroupRoles", Params],
    queryFn: async () => {
      const { data } = await AdminAPI.getGroupRoles({
        Token: Auth?.token || "",
      });
      let newData = [];
      if (data?.Groups && data?.Groups.length > 0) {
        for (let key of data?.Groups) {
          const { StockID, GroupID, StockTitle, TitleStock, GroupTitle } = key;
          const index = newData.findIndex((item) => item.groupid === StockID);
          if (index > -1) {
            newData[index].options.push({
              label:
                TitleStock === "Kinh doanh" ? "Sale" : TitleStock || GroupTitle,
              value: GroupID,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = StockTitle || "Hệ thống";
            newItem.groupid = StockID;
            newItem.options = [
              {
                label:
                  TitleStock === "Kinh doanh"
                    ? "Sale"
                    : TitleStock || GroupTitle,
                value: GroupID,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }

      return newData
        .filter((x) =>
          StockRoles ? StockRoles.some((s) => s.value === x.groupid) : true
        )
        .map((x) => ({
          ...x,
          index: x.groupid === 0 ? 10 : x.groupid === Params?.StockID ? 0 : 1,
        }))
        .sort((a, b) => a.index - b.index);
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setData(GroupRoles?.data || []);
  }, [GroupRoles?.data]);

  useEffect(() => {
    if (key) {
      setData(
        GroupRoles?.data
          ? GroupRoles?.data.map((s) => ({
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
      setData(GroupRoles?.data || []);
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

export default SelectGroupRoles;
