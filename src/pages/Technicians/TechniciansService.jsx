import {
  ArrowUpTrayIcon,
  CameraIcon,
  ChevronLeftIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  PhotoBrowser,
  Segmented,
  Subnavbar,
  Tab,
  Tabs,
  Toolbar,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import StaffsAPI from "../../api/Staffs.api";
import moment from "moment";
import NoFound from "../../components/NoFound";
import Dom7 from "dom7";
import KeyboardsHelper from "../../helpers/KeyboardsHelper";
import AssetsHelpers from "../../helpers/AssetsHelpers";
import Resizer from "react-image-file-resizer";
import MoresAPI from "../../api/Mores.api";
import PromHelpers from "../../helpers/PromHelpers";
import { toast } from "react-toastify";
import clsx from "clsx";
import { useForm, Controller } from "react-hook-form";

const Photos = ({ PhotoList, Title }) => {
  const Brand = useStore("Brand");
  const refPhotoWeb = useRef();
  const [PhotoWeb, setPhotoWeb] = useState([]);

  useEffect(() => {
    if (PhotoList) {
      setPhotoWeb(() =>
        PhotoList.map((item) => `${Brand.Domain}/upload/image/${item.Src}`)
      );
    }
  }, [PhotoList]);
  return (
    <>
      <button
        className="py-2 mt-4 text-white rounded bg-primary"
        type="button"
        onClick={() => refPhotoWeb?.current?.open()}
      >
        Xem hình ảnh
      </button>
      <PhotoBrowser
        photos={PhotoList.map((x) => ({
          url: `${Brand.Domain}/upload/image/${x.Src}`,
          caption: Title,
        }))}
        thumbs={PhotoWeb}
        ref={refPhotoWeb}
        navbarShowCount={true}
        toolbar={false}
      />
    </>
  );
};

let renderCount = 0;

const Notes = ({ onSubmit, initialValues }) => {
  const {
    reset,
    handleSubmit,
    control,
    watch,
    formState,
    formState: { isValidating },
  } = useForm({
    defaultValues: { TINH_TRANG: "", THU_THUAT: "", DANH_GIA: "", LUU_Y: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialValues) {
      let newValues = JSON.parse(initialValues);

      reset(newValues);
    }
  }, [initialValues]);

  renderCount++;

  const data = watch();

  useEffect(() => {
    if (formState.isValid && !isValidating) {
      //debouncedSave();
    }
  }, [formState, data, isValidating]);

  // const debouncedSave = useCallback(
  //   debounce(() => {
  //     methods.handleSubmit(onSubmit)();
  //   }, 1000),
  //   []
  // );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3.5">
        <div className="mb-1">Tình trạng</div>
        <Controller
          control={control}
          name="TINH_TRANG"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              value={value}
              className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px] [&_textarea]:shadow-none [&_textarea]:border-0"
              type="textarea"
              placeholder="Nhập tình trạng"
              // errorMessage={fieldState?.error?.message}
              // errorMessageForce={fieldState?.invalid}
              onChange={onChange}
              onFocus={(e) =>
                KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
              }
              onBlur={() => {
                handleSubmit(onSubmit)();
              }}
            />
          )}
        />
      </div>
      <div className="mb-3.5">
        <div className="mb-1">Thủ thuật</div>
        <Controller
          control={control}
          name="THU_THUAT"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              value={value}
              className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px] [&_textarea]:shadow-none [&_textarea]:border-0"
              type="textarea"
              placeholder="Nhập thủ thuật"
              // errorMessage={fieldState?.error?.message}
              // errorMessageForce={fieldState?.invalid}
              onChange={onChange}
              onFocus={(e) =>
                KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
              }
              onBlur={() => {
                handleSubmit(onSubmit)();
              }}
            />
          )}
        />
      </div>
      <div className="mb-3.5">
        <div className="mb-1">Đánh giá sau buổi trị liệu</div>
        <Controller
          control={control}
          name="DANH_GIA"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              value={value}
              className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px] [&_textarea]:shadow-none [&_textarea]:border-0"
              type="textarea"
              placeholder="Nhập đánh giá"
              // errorMessage={fieldState?.error?.message}
              // errorMessageForce={fieldState?.invalid}
              onChange={onChange}
              onFocus={(e) =>
                KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
              }
              onBlur={() => {
                handleSubmit(onSubmit)();
              }}
            />
          )}
        />
      </div>
      <div className="mb-3.5">
        <div className="mb-1">Lưu ý cho buổi sau</div>
        <Controller
          control={control}
          name="LUU_Y"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              value={value}
              className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px] [&_textarea]:shadow-none [&_textarea]:border-0"
              type="textarea"
              placeholder="Nhập lưu ý"
              // errorMessage={fieldState?.error?.message}
              // errorMessageForce={fieldState?.invalid}
              onChange={onChange}
              onFocus={(e) =>
                KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
              }
              onBlur={() => {
                handleSubmit(onSubmit)();
              }}
            />
          )}
        />
      </div>
    </form>
  );
};

const ScheduleItem = ({ item, checkStatus, index }) => {
  const Brand = useStore("Brand");
  const InfoJSON =
    Brand?.Global?.Admin?.os_4_chi_tiet &&
    item?.InfoJSON &&
    item?.Status === "done"
      ? JSON.parse(item.InfoJSON)
      : null;
  const [open, setOpen] = useState((InfoJSON && index === 0) || false);

  return (
    <div className="pb-4 timeline-item">
      <div className="timeline-item-date">
        <span className="font-semibold">
          {item.BookDate && moment(item.BookDate).format("DD")}
        </span>
        <small className="pl-[2px]">
          {item.BookDate && moment(item.BookDate).format("MMM")}
        </small>
      </div>
      <div className="timeline-item-divider"></div>
      <div className="w-full timeline-item-content">
        <div className="p-4 bg-white rounded">
          <div className="flex justify-between">
            <span>{checkStatus(item.Status)}</span>
            <span className="text-xs font-medium">
              {item.BookDate && moment(item.BookDate).format("HH:mm A")}
            </span>
          </div>
          <div
            className="flex mt-2 font-medium"
            onClick={() =>
              Brand?.Global?.Admin?.os_4_chi_tiet &&
              InfoJSON &&
              item?.Status === "done" &&
              setOpen(!open)
            }
          >
            <div className="items-center flex-1">{item.Title}</div>
            {Brand?.Global?.Admin?.os_4_chi_tiet &&
              InfoJSON &&
              item?.Status === "done" && <ChevronDownIcon className="w-5" />}
          </div>
          {open && (
            <div
              className={clsx(
                "pt-2 mt-2 border-t",
                item?.PhotoList &&
                  item?.PhotoList.length > 0 &&
                  "border-b pb-2 mb-2"
              )}
            >
              <div className="mb-1 last:mb-0">
                <div className="text-[#B5B5C3]">Tình trạng</div>
                <div>{InfoJSON?.TINH_TRANG || "Không"}</div>
              </div>
              <div className="mb-1 last:mb-0">
                <div className="text-[#B5B5C3]">Thủ thuật</div>
                <div>{InfoJSON?.THU_THUAT || "Không"}</div>
              </div>
              <div className="mb-1 last:mb-0">
                <div className="text-[#B5B5C3]">Đánh giá sau buổi trị liệu</div>
                <div>{InfoJSON?.DANH_GIA || "Không"}</div>
              </div>
              <div className="mb-1 last:mb-0">
                <div className="text-[#B5B5C3]">Lưu ý cho buổi sau</div>
                <div>{InfoJSON?.LUU_Y || "Không"}</div>
              </div>
            </div>
          )}
          {item?.PhotoList && item?.PhotoList.length > 0 && (
            <Photos Title={item.Title} PhotoList={item?.PhotoList} />
          )}
          {(item?.Rate || item?.Rate === 0) && (
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center">
                {Array(5).fill().map((_, index) => (
                  <svg
                    key={index}
                    className="w-4 h-4 mr-1 text-yellow-300"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 22 20"
                  >
                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                  </svg>
                ))}
              </div>
              {item?.RateNote && <div className="mt-1 text-sm text-gray-400">{item?.RateNote}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function TechniciansService({ id, memberid, itemid }) {
  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const Brand = useStore("Brand");

  const [active, setActive] = useState("#thong-tin");
  const [Note, setNote] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Technicians-Info"],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "member_sevice");
      bodyFormData.append("IsManager", 1);
      bodyFormData.append("IsService", 1);
      bodyFormData.append("MemberIDs", "");
      bodyFormData.append(
        "srv_status",
        "book,wait_book,wait,doing,done,cancel"
      );
      bodyFormData.append("srv_from", "");
      bodyFormData.append("srv_to", "");
      bodyFormData.append("key", "");
      bodyFormData.append("ps", 1);
      bodyFormData.append("osid", id);

      let { data } = await StaffsAPI.getServices({
        Filters: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });
      return data?.data ? data?.data[0] : null;
    },
    enabled: Boolean(Auth && Auth?.ID),
    onSuccess: (data) => {
      setNote(data?.Desc || "");
    },
  });

  const {
    data: Staffs,
    isLoading: StaffsLoading,
    refetch: StaffsRefetch,
  } = useQuery({
    queryKey: ["Technicians-Staffs"],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "get_staff_service");
      bodyFormData.append("arr", id);

      let { data } = await StaffsAPI.getStaffService({
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });

      return data || null;
    },
  });

  const {
    data: Schedule,
    isLoading: ScheduleLoading,
    refetch: Schedulerefetch,
  } = useQuery({
    queryKey: ["Technicians-Schedule"],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "booklist");
      bodyFormData.append("OrderItemID", itemid);

      let { data } = await StaffsAPI.getServiceSchedule({
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });

      return data
        ? data.sort((a, b) =>
            moment.utc(b["BookDate"]).diff(moment.utc(a["BookDate"]))
          )
        : null;
    },
    enabled: Boolean(active === "#lich-trinh"),
  });

  const {
    data: ImagesOs,
    isLoading: ImagesOsLoading,
    refetch: ImagesOsfetch,
  } = useQuery({
    queryKey: ["Technicians-ImagesOs"],
    queryFn: async () => {
      let { data } = await StaffsAPI.getImagesOs(id);
      return data?.data || null;
    },
  });

  const uploadOsMutation = useMutation({
    mutationFn: async (body) => {
      let { data } = await MoresAPI.upload({
        Token: body?.Token,
        File: body.File,
      });
      return await StaffsAPI.updateImageOs({
        ID: body.ID,
        data: { src: data.data },
      });
    },
  });

  const updateOsMutation = useMutation({
    mutationFn: (body) => StaffsAPI.updateImageOs(body),
  });

  const updateDescOsMutation = useMutation({
    mutationFn: (body) => StaffsAPI.updateDescOs(body),
  });

  const finishOsMutation = useMutation({
    mutationFn: (body) => StaffsAPI.doneOs(body),
  });

  const deleteOsMutation = useMutation({
    mutationFn: (body) => StaffsAPI.deleteImagesOs(body),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    f7.dialog.preloader("Đang upload...");
    Resizer.imageFileResizer(
      file,
      1500,
      1500,
      "JPEG",
      100,
      0,
      (uri) => {
        const formData = new FormData();
        formData.append("file", uri);
        uploadOsMutation.mutate(
          {
            Token: Auth?.token,
            File: formData,
            ID: id,
          },
          {
            onSuccess: (data) => {
              ImagesOsfetch().then(() => f7.dialog.close());
            },
          }
        );
      },
      "file",
      300,
      300
    );
  };

  const openCameraUpload = () => {
    PromHelpers.CHOOSE_FILE_SERVER()
      .then(({ data }) => {
        f7.dialog.preloader("Đang Upload...");
        updateOsMutation.mutate(
          {
            ID: id,
            data: { src: data },
          },
          {
            onSuccess: (data) => {
              ImagesOsfetch().then(() => f7.dialog.close());
            },
          }
        );
      })
      .catch((error) => console.log(error));
  };

  const onUpdateDescOs = (e) => {
    f7.preloader.show();
    updateDescOsMutation.mutate(
      {
        ID: id,
        data: {
          Desc: e.target.value,
        },
      },
      {
        onSuccess: (data) => {
          refetch().then(() => f7.preloader.hide());
        },
      }
    );
  };

  const onUpdateOs = (values) => {
    f7.preloader.show();
    updateDescOsMutation.mutate(
      {
        ID: id,
        data: {
          Desc: Note,
          InfoJSON: JSON.stringify(values),
        },
      },
      {
        onSuccess: (data) => {
          refetch().then(() => f7.preloader.hide());
        },
      }
    );
  };

  const onDelete = (img) => {
    f7.dialog.confirm("Bạn muốn xóa ảnh này ?", () => {
      f7.dialog.preloader("Đang thực hiện...");
      deleteOsMutation.mutate(
        {
          OsID: id,
          data: {
            delete: img.ID,
          },
        },
        {
          onSuccess: (data) => {
            ImagesOsfetch().then(() => f7.dialog.close());
          },
        }
      );
    });
  };

  const onFinish = () => {
    f7.dialog.confirm("Bạn muốn hoàn thành ca này ?", () => {
      f7.dialog.preloader("Đang thực hiện...");
      finishOsMutation.mutate(
        {
          Token: Auth?.token,
          StockID: CrStocks?.ID,
          data: {
            cmd: "staff_done_service",
            ServiceID: id,
            note: Note,
          },
        },
        {
          onSuccess: () => {
            refetch().then(() => {
              f7.dialog.close();
              toast.success("Hoàn thành ca thành công.");
            });
          },
        }
      );
    });
  };

  const checkStatus = (status) => {
    switch (status) {
      case "done":
        return (
          <span className="text-xs font-semibold rounded text-success">
            Hoàn thành
          </span>
        );
      case "doing":
        return (
          <span className="text-xs font-semibold rounded text-warning">
            Đang thực hiện
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold rounded text-primary">
            Chưa thực hiện
          </span>
        );
    }
  };

  const loadRefresh = (done) => {
    if (active === "#thong-tin") {
      refetch().then(() => {
        StaffsRefetch().then(() => done());
      });
    }
    if (active === "#lich-trinh") {
      Schedulerefetch().then(() => done());
    }
  };

  return (
    <Page
      name="Technicians-profile"
      noToolbar={data?.Status === "done"}
      // ptr
      // onPtrRefresh={loadRefresh}
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
        <NavTitle>Thông tin dịch vụ</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar>
          <Segmented strong>
            <Button
              tabLink="#thong-tin"
              active={active === "#thong-tin"}
              onClick={() => setActive("#thong-tin")}
            >
              Thông tin
            </Button>
            <Button
              tabLink="#lich-trinh"
              active={active === "#lich-trinh"}
              onClick={() => {
                setActive("#lich-trinh");
              }}
            >
              Lịch trình
            </Button>
          </Segmented>
        </Subnavbar>
      </Navbar>
      <Tabs animated>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          className="p-4 overflow-auto"
          id="thong-tin"
          tabActive
        >
          {isLoading && (
            <div className="py-2 mb-3 bg-white rounded last:mb-0" role="status">
              <div className="px-4 py-2">
                <div className="text-muted">Dịch vụ</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-full animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Số phút</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Điểm</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Nhân viên thực hiện</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              {/* <div className="px-4 py-2">
                <div className="text-muted">Ghi chú</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-full animate-pulse"></div>
                </div>
              </div> */}
            </div>
          )}
          {!isLoading && (
            <>
              <div className="py-2 mb-3 bg-white rounded last:mb-0">
                <div className="px-4 py-2">
                  <div className="text-muted">Dịch vụ</div>
                  <div className="mt-px font-medium">
                    {data?.Title}
                    {data?.Status === "done" && (
                      <span className="pl-2 font-semibold text-success">
                        (Hoàn thành)
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Số phút</div>
                  <div className="mt-px font-medium">
                    {data?.Minutes || 40}p/ Ca
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Điểm</div>
                  <div className="mt-px font-medium capitalize">
                    {
                      Auth.Info.StockRights.filter(
                        (x) => x.ID === data?.StockID
                      )[0]?.Title
                    }
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Nhân viên thực hiện</div>
                  <div className="mt-px font-medium capitalize">
                    {StaffsLoading && "Đang tải ..."}
                    {Staffs && Staffs.map((x) => x.StaffName).join(", ")}
                  </div>
                </div>
                {data?.Status === "done" && (
                  <>
                    <div className="px-4 py-2">
                      <div className="text-muted">Đánh giá</div>
                      {data?.Rate ? (
                        <div className="mt-1.5 font-medium capitalize">
                          <div className="flex items-center">
                            {Array(5)
                              .fill()
                              .map((_, i) => (
                                <svg
                                  key={i}
                                  className={clsx(
                                    "w-4 h-4 me-1",
                                    Number(data?.Rate) >= i + 1
                                      ? "text-yellow-300"
                                      : "text-gray-300"
                                  )}
                                  aria-hidden="true"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="currentColor"
                                  viewBox="0 0 22 20"
                                >
                                  <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                                </svg>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-px font-medium capitalize">
                          Chưa đánh giá
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2">
                      <div className="text-muted">Ghi chú đánh giá</div>
                      <div className="mt-px font-medium capitalize">
                        {data?.RateNote || "Chưa có"}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="mb-3.5">
                <div className="mb-1">Ghi chú</div>
                <Input
                  className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px] [&_textarea]:shadow-none [&_textarea]:border-0"
                  type="textarea"
                  placeholder="Nhập ghi chú"
                  value={Note}
                  // errorMessage={fieldState?.error?.message}
                  // errorMessageForce={fieldState?.invalid}
                  onChange={(e) => setNote(e.target.value)}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
                  }
                  onBlur={onUpdateDescOs}
                />
              </div>
              {Brand?.Global?.Admin?.os_4_chi_tiet && (
                <Notes onSubmit={onUpdateOs} initialValues={data?.InfoJSON} />
              )}

              <div>
                <div className="mb-1">Hình ảnh</div>
                <div className="grid grid-cols-3 gap-4">
                  {ImagesOs &&
                    ImagesOs.map((img, index) => (
                      <div
                        className="relative flex items-center justify-center bg-white rounded aspect-square"
                        key={index}
                      >
                        <img
                          className="object-cover rounded aspect-square"
                          src={AssetsHelpers.toAbsoluteUrl(img.Src)}
                          alt={img.OrderServiceID}
                        />
                        <div
                          className="absolute flex items-center justify-center w-5 h-5 bg-white rounded-full shadow -right-1.5 -top-1.5 text-muted"
                          onClick={() => onDelete(img)}
                        >
                          <XMarkIcon className="w-3.5" />
                        </div>
                      </div>
                    ))}
                  <div className="relative flex items-center justify-center bg-white rounded aspect-square text-muted">
                    <div className="flex flex-col items-center">
                      <ArrowUpTrayIcon className="w-6" />
                      <div className="mt-px text-[11px]">Upload</div>
                    </div>
                    <input
                      type="file"
                      name="uploadfile"
                      accept="image/*"
                      onChange={handleUpload}
                      className="absolute w-full h-full opacity-0"
                    />
                  </div>
                  <div
                    className="relative flex items-center justify-center bg-white rounded aspect-square text-muted"
                    onClick={openCameraUpload}
                  >
                    <div className="flex flex-col items-center">
                      <CameraIcon className="w-6" />
                      <div className="mt-px text-[11px]">Chụp ảnh</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Tab>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          id="lich-trinh"
          className="h-full p-4 overflow-auto"
        >
          {ScheduleLoading && (
            <div className="timeline">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div className="pb-4 timeline-item" key={index}>
                    <div className="timeline-item-date">
                      <span className="font-semibold">
                        <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </span>
                    </div>
                    <div className="timeline-item-divider"></div>
                    <div className="w-full timeline-item-content">
                      <div className="p-3 bg-white rounded">
                        <div className="mb-3 text-xs font-semibold text-muted">
                          <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-9/12 h-2 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!ScheduleLoading && (
            <>
              {Schedule && Schedule.length > 0 && (
                <div className="timeline">
                  {Schedule &&
                    Schedule.map((item, index) => (
                      <ScheduleItem
                        index={index}
                        key={index}
                        item={item}
                        checkStatus={checkStatus}
                      />
                    ))}
                </div>
              )}
              {(!Schedule || Schedule.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
      </Tabs>
      <Toolbar
        hidden={data?.Status === "done"}
        className="bg-tran"
        inner={false}
        bottom
        style={{ "--f7-toolbar-border-color": "transparent" }}
      >
        <Button
          type="button"
          className="h-[var(--f7-navbar-height)] rounded-none bg-app"
          fill
          large
          preloader
          onClick={onFinish}
          loading={finishOsMutation.isLoading}
          disabled={finishOsMutation.isLoading}
        >
          Hoàn thành
        </Button>
      </Toolbar>
    </Page>
  );
}

export default TechniciansService;
