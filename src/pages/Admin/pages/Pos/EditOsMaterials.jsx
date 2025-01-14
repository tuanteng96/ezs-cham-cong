import AdminAPI from "@/api/Admin.api";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import PromHelpers from "@/helpers/PromHelpers";
import {
  SelectMaterials,
  SelectMaterialsFromCard,
} from "@/partials/forms/select";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MinusCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import React, { useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";

//[{"ProdCode":"NVLT1","Qty":"1"},{"ProdCode":"NL14","Qty":"1"}]

function EditOsMaterials({ f7route }) {
  let Auth = useStore("Auth");

  const queryClient = useQueryClient();

  let btnMaterialsRef = useRef();
  let btnMaterialsFromCardRef = useRef();

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      Materials: [],
      MaterialsChoose: [],
      MaterialsFromCard: null,
    },
    //resolver: yupResolver(schemaAdd),
  });

  const OsMaterials = useQuery({
    queryKey: ["MaterialsOsID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsGetMaterialsOsServicesItem({
        Token: Auth?.token,
        OsID: f7route?.params?.id,
      });
      return data?.data || null;
    },
    onSuccess: (data) => {
      reset({
        Materials: data
          ? data.map((x) => ({
              ...x,
              Qty: Math.abs(x.Qty),
              label: x.Title,
              value: x.ID,
            }))
          : [],
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsAddMaterialsOsServicesItem(body);
      queryClient.invalidateQueries(["OsDetailID"])
      await OsMaterials?.refetch();
      return data;
    },
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "Materials",
  });

  const onSubmit = ({ Materials }) => {
    f7.dialog.preloader("Đang thực hiện ...");
    var bodyFormData = new FormData();
    bodyFormData.append(
      "data",
      JSON.stringify(
        Materials
          ? Materials?.map((x) => ({ ProdCode: x.ProdCode, Qty: x.Qty }))
          : []
      )
    );
    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        OsID: f7route?.params?.id,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công.");
          f7.dialog.close();
        },
      }
    );
  };

  const { Materials } = watch();

  return (
    <Page
      className="bg-white"
      name="os-edit-materials"
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
        <NavTitle>Nguyên vật liệu</NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-add-materials"
          >
            <PlusIcon className="w-6" />
          </Link>
          <Popover className="popover-add-materials">
            <div className="flex flex-col py-1">
              <Link
                className="relative px-4 py-3 font-medium border-b last:border-0"
                popoverClose
                noLinkClass
                onClick={() => btnMaterialsRef?.current?.click()}
              >
                Thêm mới nguyên vật liệu
              </Link>
              <Link
                className="relative px-4 py-3 font-medium border-b last:border-0"
                popoverClose
                noLinkClass
                onClick={() => btnMaterialsFromCardRef?.current?.click()}
              >
                Thêm từ thẻ dịch vụ khác
              </Link>
            </div>
          </Popover>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form
        className="flex flex-col h-full pb-safe-b"
        onSubmit={handleSubmit(onSubmit)}
      >
        {OsMaterials?.isLoading && (
          <div
            role="status"
            className={clsx(
              "grow left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50"
            )}
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="fill-muted"
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
        {!OsMaterials?.isLoading && (
          <>
            {(!fields || fields.length === 0) && (
              <div
                className={clsx(
                  "flex flex-col items-center justify-center px-8 py-8 text-center h-full"
                )}
              >
                <div className="text-base font-medium">
                  Chưa có nguyên vật liệu
                </div>
                <div className="font-light text-[#757676] mt-2">
                  Chạm vào một mục
                  <span className="px-1 font-medium">
                    "Thêm mới nguyên vật liệu"
                  </span>
                  bên dưới để thêm mới nguyên vật liệu cho buổi dịch vụ.
                </div>
                <div className="mt-5">
                  <Link
                    popoverOpen=".popover-add-materials"
                    className="px-4 py-3 font-medium text-white rounded bg-app"
                  >
                    Thêm mới nguyên vật liệu
                    <ChevronDownIcon className="w-5 ml-2" />
                  </Link>
                </div>
              </div>
            )}
            {fields && fields.length > 0 && (
              <>
                <div className="p-4 overflow-auto grow page-scrollbar">
                  {fields &&
                    fields.map((item, index) => (
                      <div
                        className="mb-3 pb-3.5 border-b border-dashed last:mb-0 last:pb-0 last:border-0"
                        key={item.id}
                      >
                        <div className="mb-1.5 flex justify-between items-center">
                          <div className="font-medium">{item.label}</div>
                          <div
                            className="text-danger"
                            onClick={() => {
                              if (
                                fields.length === 1 &&
                                OsMaterials?.data?.length > 0
                              ) {
                                f7.dialog.confirm(
                                  "Xác nhận cập nhập xoá tất cả các nguyên vật liệu ?",
                                  () => {
                                    setValue("Materials", []);
                                    handleSubmit(onSubmit)();
                                  }
                                );
                              } else {
                                f7.dialog.confirm(
                                  "Xác nhận xoá nguyên vật liệu này ?",
                                  () => {
                                    remove(index);
                                  }
                                );
                              }
                            }}
                          >
                            <MinusCircleIcon className="w-[22px]" />
                          </div>
                        </div>
                        <div className="mb-1.5">
                          <Controller
                            name={`Materials[${index}].Qty`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className="flex">
                                <div className="bg-gray-100 text-gray-500 px-4 rounded-s w-[100px] flex items-center border-l border-t border-b border-[#d5d7da]">
                                  Số lượng
                                </div>
                                <div className="relative flex-1">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-e py-3 px-4 focus:border-primary",
                                      fieldState?.invalid
                                        ? "border-danger"
                                        : "border-[#d5d7da]"
                                    )}
                                    type="text"
                                    autoComplete="off"
                                    thousandSeparator={true}
                                    placeholder="Nhập số lượng"
                                    value={field.value}
                                    onValueChange={(val) =>
                                      field.onChange(val.floatValue || "")
                                    }
                                    onFocus={(e) =>
                                      KeyboardsHelper.setAndroid({
                                        Type: "body",
                                        Event: e,
                                      })
                                    }
                                  />
                                  {field.value ? (
                                    <div
                                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                      onClick={() => field.onChange("")}
                                    >
                                      <XMarkIcon className="w-5" />
                                    </div>
                                  ) : (
                                    <></>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4">
                  <Button
                    type="submit"
                    className="rounded-full bg-app"
                    fill
                    large
                    preloader
                    loading={addMutation.isLoading}
                    disabled={addMutation.isLoading}
                  >
                    Cập nhật nguyên vật liệu
                  </Button>
                </div>
              </>
            )}
            <div className="hidden">
              <Controller
                name="MaterialsChoose"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectMaterials
                    elRef={btnMaterialsRef}
                    isMulti
                    isRequired={false}
                    placeholderInput="Tên nguyên vật liệu"
                    placeholder="Chọn nguyên vật liệu"
                    value={field.value}
                    label="Chọn nguyên vật liệu"
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    isFilter
                    onClose={(val) => {
                      let newMaterials = [...Materials];
                      if (val) {
                        for (let m of val) {
                          let index = newMaterials?.findIndex(
                            (x) => x.ProdCode === m?.source?.DynamicID
                          );
                          if (index > -1) {
                            newMaterials[index].Qty =
                              newMaterials[index].Qty + 1;
                          } else {
                            newMaterials.push({
                              ...m,
                              ProdCode: m?.source?.DynamicID,
                              Qty: 1,
                            });
                          }
                        }
                      }
                      setValue("Materials", newMaterials);
                      setValue("MaterialsChoose", []);
                    }}
                  />
                )}
              />
            </div>
            <div className="hidden">
              <Controller
                name="MaterialsFromCard"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectMaterialsFromCard
                    elRef={btnMaterialsFromCardRef}
                    isRequired={false}
                    isMulti
                    placeholderInput="Tên thẻ dịch vụ"
                    placeholder="Tên thẻ dịch vụ"
                    value={field.value}
                    label="Chọn thẻ dịch vụ"
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    onClose={async (val) => {
                      if (val) {
                        f7.dialog.preloader("Đang kiểm tra ...");
                        let data = await Promise.all(
                          val.map(
                            (x) =>
                              new Promise((resolve) => {
                                AdminAPI.clientsGetMaterialsProdCard({
                                  ProdID: x?.id,
                                }).then(({ data }) => {
                                  resolve(data?.data);
                                });
                              })
                          )
                        );
                        if (data && data.length > 0) {
                          let newMaterials = [...Materials];
                          for (let arr of data) {
                            if (Array.isArray(arr)) {
                              for (let m of arr) {
                                let index = newMaterials?.findIndex(
                                  (x) => x.ProdCode === m?.ItemDynamicID
                                );
                                if (index > -1) {
                                  newMaterials[index].Qty =
                                    newMaterials[index].Qty + m?.Qty;
                                } else {
                                  newMaterials.push({
                                    ...m,
                                    ProdCode: m?.ItemDynamicID,
                                    Qty: 1,
                                    value: m?.ItemID,
                                    label: m?.Product?.Title,
                                  });
                                }
                              }
                            }
                          }
                          setValue("Materials", newMaterials);
                        }

                        setValue("MaterialsFromCard", []);
                        f7.dialog.close();
                      }
                    }}
                  />
                )}
              />
            </div>
          </>
        )}
      </form>
    </Page>
  );
}

export default EditOsMaterials;
