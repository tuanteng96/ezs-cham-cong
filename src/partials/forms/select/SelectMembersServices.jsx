import AdminAPI from "@/api/Admin.api";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { SelectPickersGroup } from "..";
import StringHelpers from "@/helpers/StringHelpers";

function SelectMembersServices({ StockRoles, ShiftOnly = false, ...props }) {
  let [data, setData] = useState([]);
  let Auth = useStore("Auth");

  let [key, setKey] = useState("");

  let Members = useQuery({
    queryKey: ["SelectMembersService"],
    queryFn: async () => {
      const { data } = await AdminAPI.selectMembersServices({
        Key: key,
        CurrentStockID: "",
        Token: Auth?.token || "",
      });

      let ShiftMembers = null;
      if (ShiftOnly) {
        ShiftMembers = appPOS ? await appPOS.nhanVienCa() : [];
      }

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

            if (ShiftOnly) {
              if (text !== "TAT_CA") {
                let ShiftMember = getMemberCurrent({
                  StockID: groupid,
                  Members: obj,
                  ShiftsMembers: ShiftMembers,
                });
                if (ShiftMember) {
                  obj.sub = `Số ca yêu cầu: ${
                    ShiftMember?.SoCaYeuCau || 0
                  }, Đã làm: ${ShiftMember?.Da_lam || 0}, Đang làm: ${
                    ShiftMember?.Dang_lam || 0
                  }`;
                }
              }
            }

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

            if (ShiftOnly) {
              if (text !== "TAT_CA") {
                let ShiftMember = getMemberCurrent({
                  StockID: groupid,
                  Members: obj,
                  ShiftsMembers: ShiftMembers,
                });
                if (ShiftMember) {
                  obj.sub = `Số ca yêu cầu: ${
                    ShiftMember?.SoCaYeuCau || 0
                  }, Đã làm: ${ShiftMember?.Da_lam || 0}, Đang làm: ${
                    ShiftMember?.Dang_lam || 0
                  }`;
                }
              }
            }
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

  const getMemberCurrent = ({ StockID, Members, ShiftsMembers }) => {
    let obj = null;
    let CrS = ShiftsMembers
      ? ShiftsMembers.findIndex((x) => x.StockID === StockID)
      : -1;
    if (CrS > -1) {
      let MbIndex = ShiftsMembers[CrS].Users
        ? ShiftsMembers[CrS].Users.findIndex((x) => x.ID === Members.id)
        : -1;
      if (MbIndex > -1 && ShiftsMembers[CrS].Users[MbIndex].SoCaYeuCau > 0) {
        obj = ShiftsMembers[CrS].Users[MbIndex];
      }
    }
    return obj;
  };

  return (
    <SelectPickersGroup
      options={data || []}
      {...props}
      ref={props.elRef}
      onInputFilter={(value) => setKey(value)}
    />
  );
}

export default SelectMembersServices;
