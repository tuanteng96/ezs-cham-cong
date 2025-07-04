
import React, { useState } from "react";
import { useQuery } from "react-query";
import { SelectPicker } from "..";
import ConfigsAPI from "@/api/Configs.api";
import { Controller, useFormContext } from "react-hook-form";

function SelectUserLevels({ onSuccess, name, label, wrapClassName, autoSet, ...props }) {
  
  let [key, setKey] = useState("");

  const { control, setValue } = useFormContext();

  let { data } = useQuery({
    queryKey: ["SelectUserLevels", key],
    queryFn: async () => {
      const { data } = await ConfigsAPI.getValue("user.levels");
      let result = [];

      if (data.data && data.data.length > 0) {
        if (data.data[0].Value) {
          result = data.data[0].Value.split(",")
            .map((x) => ({
              label: x,
              value: x,
            }))
            .filter((x) => x?.value && x.label);
        }
      }

      return result;
    },
    onSuccess: (val) => {
      if(val && val.length === 1 && autoSet) {
        setValue(name, val[0])
      }
      
    },
    keepPreviousData: true,
  });

  if (!data || data.length === 0) return <></>;

  return (
    <div className={wrapClassName}>
      <div className="mb-px">{label}</div>
      <div>
        <Controller
          name={name}
          control={control}
          render={({ field: { ref, ...field }, fieldState }) => (
            <>
              <SelectPicker
                options={data || []}
                {...props}
                value={data ? data.filter(x => x.value === field.value) : null}
                label={label}
                onChange={(val) => {
                  field.onChange(val?.value || null);
                }}
                errorMessage={fieldState?.error?.message}
                errorMessageForce={fieldState?.invalid}
                onInputFilter={(value) => setKey(value)}
              />
            </>
          )}
        />
      </div>
    </div>
  );
}

export default SelectUserLevels;
