import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import StringHelpers from "@/helpers/StringHelpers";

function SelectClassOs({ StockIDs = [], ...props }) {
  let [data, setData] = useState([]);
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let Classes = useQuery({
    queryKey: ["SelectClassOs"],
    queryFn: async () => {
      const { data } = await AdminAPI.getClassSchedule({
        data: {
          StockID: StockIDs,
          To: null,
          From: null,
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      return data?.Items
        ? data?.Items.map((x) => ({
            ...x,
            label: x.Title,
            value: x.ID,
          }))
        : [];
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setData(Classes?.data || []);
  }, [Classes?.data]);

  useEffect(() => {
    if (key) {
      setData(
        Classes?.data
          ? Classes?.data.filter((x) =>
              StringHelpers.ConvertViToEn(x.label, true).includes(
                StringHelpers.ConvertViToEn(key, true)
              )
            )
          : []
      );
    } else {
      setData(Classes?.data || []);
    }
  }, [key]);
  
  return (
    <SelectPicker
      options={data || []}
      {...props}
      ref={props.elRef}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectClassOs;
