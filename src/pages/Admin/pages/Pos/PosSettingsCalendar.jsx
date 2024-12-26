import ConfigsAPI from "@/api/Configs.api";
import NoFound from "@/components/NoFound";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import PromHelpers from "@/helpers/PromHelpers";
import { SelectServiceRoots } from "@/partials/forms/select";
import { ChevronLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
} from "framework7-react";
import React, { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import { toast } from "react-toastify";

function PosSettingsCalendar(props) {
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      Tags: [],
      OriginalServices: [],
    },
  });

  const {
    fields: fieldsTags,
    remove: removeTags,
    append: appendTags,
  } = useFieldArray({
    control,
    name: "Tags",
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: "OriginalServices",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ConfigSettingCalendar"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("ArticleRel");
      let newValue = {
        Tags: "",
        OriginalServices: [],
      };
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          newValue = JSON.parse(Value);
          newValue.Tags = newValue.Tags
            ? newValue.Tags.split(",").map((x) => ({ value: x }))
            : [];
        }
      }

      return newValue;
    },
    initialData: {
      Tags: [],
      OriginalServices: [],
    },
  });

  useEffect(() => {
    reset(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      Tags: values.Tags ? values.Tags.map((x) => x.value).toString() : "",
    };
    updateMutation.mutate(
      { data: newValues, name: "ArticleRel" },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công");
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Pos-setting-calendar"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Cài đặt bảng lịch</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col h-full pb-safe-b"
        autoComplete="off"
      >
        <div className="p-4 overflow-auto grow">
          <div className="pb-4 mb-4 border-b last:border-0 last:mb-0 last:pb-0">
            <div className="mb-3">Tags</div>
            <div>
              {fieldsTags &&
                fieldsTags.length > 0 &&
                fieldsTags.map((item, index) => (
                  <div className="flex gap-3 mb-3.5" key={item.id}>
                    <div className="flex-1">
                      <Controller
                        name={`Tags[${index}].value`}
                        control={control}
                        rules={{
                          required: true,
                        }}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                            type="text"
                            placeholder="Tên tags"
                            value={field.value}
                            clearButton={true}
                            onInput={field.onChange}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "body",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                    <div>
                      <div
                        className="flex items-center justify-center h-full rounded shadow-lg w-11 bg-danger-light text-danger"
                        onClick={() => {
                          f7.dialog.confirm("Xác nhận xoá ?", () =>
                            removeTags(index)
                          );
                        }}
                      >
                        <TrashIcon className="w-5" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div>
              <div
                className="inline-block px-3.5 py-2 text-white rounded bg-success"
                onClick={() => {
                  appendTags({ value: "" });
                }}
              >
                Thêm mới Tags
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3">Cài đặt màu sắc dịch vụ</div>
            <div>
              {fields &&
                fields.map((item, index) => (
                  <div className="flex gap-2 mb-4" key={item.id}>
                    <Controller
                      name={`OriginalServices[${index}].color`}
                      control={control}
                      rules={{
                        required: true,
                      }}
                      render={({ field: { ref, ...field }, fieldState }) => (
                        <div
                          className="relative flex-1 px-4 py-3 text-white rounded"
                          key={index.id}
                          style={{ backgroundColor: field.value }}
                        >
                          {item?.label}
                          <input
                            className="absolute top-0 left-0 w-full h-full opacity-0 z-1"
                            type="color"
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </div>
                      )}
                    />
                    <div>
                      <div
                        className="flex items-center justify-center h-full rounded shadow-lg w-11 bg-danger-light text-danger"
                        onClick={() => {
                          f7.dialog.confirm("Xác nhận xoá ?", () =>
                            remove(index)
                          );
                        }}
                      >
                        <TrashIcon className="w-5" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div>
              <SelectServiceRoots
                placeholderInput="Tên dịch vụ"
                placeholder="Chọn dịch vụ"
                value={null}
                label="Chọn dịch vụ"
                onChange={(val) => {
                  if (val) {
                    let index = fields.findIndex((x) => x.value === val?.ID);
                    
                    if (index > -1) {
                      toast.error("Dịch vụ đã được cài đặt.");
                    } else {
                      append({
                        color: "#000000",
                        label: val?.Title,
                        value: val?.ID,
                      });
                    }
                  }
                }}
                isFilter
              />
            </div>
          </div>
        </div>
        <div className="p-4">
          <Button
            type="submit"
            className="rounded-full bg-app"
            fill
            large
            preloader
            loading={updateMutation.isLoading || isLoading}
            disabled={updateMutation.isLoading || isLoading}
          >
            Lưu cài đặt
          </Button>
        </div>
      </form>
      {/* <div>
        <NoFound
          Title="Không có kết quả nào."
          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
        />
      </div> */}
    </Page>
  );
}

export default PosSettingsCalendar;
