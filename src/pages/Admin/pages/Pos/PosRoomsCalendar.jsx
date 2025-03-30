import ConfigsAPI from "@/api/Configs.api";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { Children, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

const FieldsTable = ({ name }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name,
  });

  return (
    <div className="pl-4">
      {fields &&
        fields.length > 0 &&
        fields.map((field, index) => (
          <div className="flex gap-3 mt-4" key={field.id}>
            <div className="grid flex-1 grid-cols-1 gap-3">
              <Controller
                name={`${name}[${index}].label`}
                control={control}
                rules={{
                  required: true,
                }}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <Input
                    className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                    type="text"
                    placeholder="Tên bàn"
                    value={field.value}
                    clearButton={true}
                    onInput={field.onChange}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                  />
                )}
              />
            </div>
            <div>
              <div
                className="flex items-center justify-center h-full rounded shadow-lg w-11 bg-danger-light text-danger"
                onClick={() => {
                  f7.dialog.confirm("Xác nhận xoá ?", () => remove(index));
                }}
              >
                <TrashIcon className="w-5" />
              </div>
            </div>
          </div>
        ))}
      <div className="mt-4">
        <div
          className="inline-block px-3.5 py-2 text-white rounded bg-success"
          onClick={() => append({ ID: uuidv4(), label: "" })}
        >
          Thêm giường
        </div>
      </div>
    </div>
  );
};

function PosRoomsCalendar(props) {
  const queryClient = useQueryClient();
  let CrStocks = useStore("CrStocks");
  let Stocks = useStore("Stocks");

  const refButton = useRef("");

  const methods = useForm({
    defaultValues: {
      StockID: "",
      ListDisable: [],
    },
  });

  const { control, handleSubmit, reset, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "ListRooms",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ConfigRooms"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("room");
      let result = [];
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          let newValue = JSON.parse(Value);
          if (newValue && newValue.length > 0) {
            for (let Stock of Stocks) {
              let index = newValue.findIndex((x) => x.StockID === Stock?.ID);
              if (index > -1) {
                result.push(newValue[index]);
              } else {
                result.push({
                  StockID: Stock?.ID,
                  StockTitle: Stock?.Title,
                  ListRooms: [],
                });
              }
            }
          }
        } else {
          result = Stocks.map((o) => ({
            StockID: o.ID,
            StockTitle: o?.Title,
            ListRooms: [],
          }));
        }
      }

      return result;
    },
  });

  useEffect(() => {
    if (data) {
      let index = data.findIndex((x) => x.StockID === CrStocks?.ID);
      if (index > -1) {
        reset(data[index]);
      }
    }
  }, [data, CrStocks]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await queryClient.invalidateQueries(["ListRoomsBookings"])
      await refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = [...data];
    let index = newValues.findIndex((x) => x.StockID === values?.StockID);
    if (index > -1) {
      newValues[index].ListRooms = values.ListRooms;
    }

    updateMutation.mutate(
      { data: newValues, name: "room" },
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
      name="Pos-locks-calendar"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
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
        <NavTitle>Cài đặt phòng</NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={() => !isLoading && refButton?.current?.click()}
          >
            {isLoading && (
              <div
                className="flex items-center justify-center w-full h-full"
                role="status"
              >
                <svg
                  aria-hidden="true"
                  className="w-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            )}
            {!isLoading && <PlusIcon className="w-6" />}
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full pb-safe-b"
          autoComplete="off"
        >
          {isLoading && (
            <div className="p-4 overflow-auto grow">
              <div className="pb-4 mb-4 border-b last:mb-0 last:pb-0 last:border-0">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div>
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center h-full rounded shadow-lg animate-pulse w-11 bg-danger-light text-danger"></div>
                  </div>
                </div>
                <div className="pl-4">
                  {Array(2)
                    .fill()
                    .map((_, idx) => (
                      <div className="flex gap-3 mt-4" key={idx}>
                        <div className="grid flex-1 grid-cols-2 gap-3">
                          <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center h-full rounded shadow-lg w-11 bg-danger-light text-danger animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          {!isLoading && (
            <div className="p-4 overflow-auto grow">
              {fields &&
                fields.length > 0 &&
                fields.map((field, index) => (
                  <div
                    className="pb-4 mb-4 border-b last:mb-0 last:pb-0 last:border-0"
                    key={field.id}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Controller
                          name={`ListRooms[${index}].label`}
                          control={control}
                          rules={{
                            required: true,
                          }}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Input
                              className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                              type="text"
                              placeholder="Tên phòng"
                              value={field.value}
                              clearButton={true}
                              onInput={field.onChange}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                            />
                          )}
                        />
                      </div>
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
                    <FieldsTable name={`ListRooms[${index}].Children`} />
                  </div>
                ))}

              {(!fields || fields.length === 0) && (
                <NoFound
                  Title="Chưa có khoá lịch nào."
                  Desc="Vui lòng chọn (+) để thêm mới phòng / bàn."
                />
              )}
            </div>
          )}
          <button
            ref={refButton}
            className="hidden"
            type="button"
            onClick={() =>
              append({
                ID: uuidv4(),
                label: "",
                Children: [{ ID: uuidv4(), label: "" }],
              })
            }
          ></button>
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
      </FormProvider>
    </Page>
  );
}

export default PosRoomsCalendar;
