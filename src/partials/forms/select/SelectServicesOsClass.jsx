import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";

function SelectServicesOsClass({
  ProdIDs,
  DateFrom,
  Member,
  IsAllService = false,
  callback,
  ...props
}) {
  let Auth = useStore("Auth");

  let { data } = useQuery({
    queryKey: ["SelectServicesOsClass", { Member, IsAllService }],
    queryFn: async () => {
      const { data } = await AdminAPI.selectServicesOsClass({
        data: {
          MemberIDs: Member?.value ? [Member?.value] : [],
          ProdIDs: !IsAllService && ProdIDs ? ProdIDs.split(",") : [],
          Date: DateFrom ? moment(DateFrom).format("YYYY-MM-DD") : null,
        },
        Token: Auth?.token || "",
      });

      return data?.lst
        ? data?.lst.map((x) => ({
            label: x.Prod.Title,
            value: x.OS?.ID,
          }))
        : null;
    },
    onSuccess: (rs) => {
      if (rs && rs.length === 1) {
        callback(rs[0]);
      }
    },
    enabled: Boolean(Member?.value),
  });

  return <SelectPicker options={data || []} {...props} ref={props.elRef} />;
}

export default SelectServicesOsClass;
