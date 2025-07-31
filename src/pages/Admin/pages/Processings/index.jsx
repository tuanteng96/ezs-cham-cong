import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Subnavbar,
  Tab,
  Tabs,
  f7,
  f7ready,
  useStore,
} from "framework7-react";
import React, { useEffect, useState } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import MenuSubNavbar from "./MenuNavbar/MenuSubNavbar";
import Dom7 from "dom7";
import NoFound from "@/components/NoFound";
import moment from "moment";
import StringHelpers from "@/helpers/StringHelpers";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import { BookProcessPicker } from "../../components";

function ProcessingsAdmin({ f7router }) {
  const queryClient = useQueryClient();
  let Auth = useStore("Auth");
  let Processings = useStore("Processings");
  let CrStocks = useStore("CrStocks");

  useEffect(() => {
    f7ready((f7) => {
      queryClient.invalidateQueries(["Processings"]);
    });
  }, []);

  const [active, setActive] = useState(
    Processings?.items && Processings?.items.length > 0
      ? Processings?.items[0]?.ID
      : ""
  );

  const paymentedMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doPayedProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const notiMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doNotiProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doContactProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const qrMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doQrProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const cancelBookMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doCancelBookProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const onPayed = (item) => {
    f7.dialog.confirm("Xác nhận duyệt thanh toán này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("orderid", item.id);
      bodyFormData.append("value", item.smsPayed);

      paymentedMutation.mutate(
        {
          bodyFormData,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Duyệt thanh toán thành công.");
          },
        }
      );
    });
  };

  const onCancelBook = (item) => {
    f7.dialog.confirm("Xác nhận huỷ lịch này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");

      cancelBookMutation.mutate(
        {
          data: {
            mbookID: item.ID,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Xác nhận thành công.");
            window?.noti27?.TIN_NHAN &&
              window?.noti27.TIN_NHAN({
                type: "CANCEL_BOOK_WEB_APP",
                data: {
                  mbookID: item.ID,
                },
              });
          },
        }
      );
    });
  };

  const onNoti = (item) => {
    f7.dialog.confirm("Xác nhận thực hiện nhắc ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("noti_id", item.ID);

      notiMutation.mutate(
        {
          bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Xác nhận thành công.");
          },
        }
      );
    });
  };

  const onContact = (item) => {
    f7.dialog.confirm("Xác nhận đã xử lý ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("contact_id", item.ID);

      contactMutation.mutate(
        {
          bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Thực hiện thành công.");
          },
        }
      );
    });
  };

  const onQrCallback = (item) => {
    f7.dialog.confirm("Xác nhận thanh toán ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");

      let newValues = {
        ...item,
      };

      newValues.Status = 1;

      qrMutation.mutate(
        {
          data: {
            lst: [newValues],
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Thanh toán thành công.");
          },
        }
      );
    });
  };

  return (
    <Page
      className="bg-white"
      name="Processings"
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
        <NavTitle>Cần xử lý ({Processings?.Count})</NavTitle>
        <Subnavbar>
          <MenuSubNavbar
            data={Processings?.items || []}
            selected={active}
            setSelected={(val) => {
              setActive(val);
              f7.tab.show(Dom7("#" + val), true);
            }}
          />
        </Subnavbar>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="h-full bg-[#f5f8fa]">
        <Tabs animated>
          {Processings?.items &&
            Processings?.items.map((item, index) => (
              <Tab
                className="pt-0 pb-0 page-content"
                id={item.ID}
                key={index}
                tabActive={active === item.ID}
              >
                {item?.children?.length > 0 && (
                  <div className="p-4">
                    {item.ID === "memberBooks" && (
                      <>
                        {item?.children.map((book, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 text-base font-medium">
                              {book?.RootTitles || "Chưa xác định dịch vụ"}
                            </div>
                            <div className="font-light text-gray-800">
                              {book?.Member?.IsAnonymous && (
                                <div>
                                  Khách vãng lai:
                                  <span className="pl-1">
                                    {book?.FullName || "Chưa xác định"}
                                  </span>
                                  <span className="px-1">-</span>
                                  <span>{book?.Phone || "Chưa xác định"}</span>
                                </div>
                              )}
                              {!book?.Member?.IsAnonymous && (
                                <div>
                                  KH:
                                  <span className="pl-1">
                                    {book?.Member?.FullName || "Chưa xác định"}
                                  </span>
                                  <span className="px-1">-</span>
                                  <span>
                                    {book?.Member?.MobilePhone ||
                                      "Chưa xác định"}
                                  </span>
                                </div>
                              )}
                              {book?.UserServices && (
                                <div>
                                  NV:
                                  <span className="pl-1">
                                    {book.UserServices.map(
                                      (x) => x.FullName
                                    ).join(", ")}
                                  </span>
                                </div>
                              )}
                              {(book.Desc || book.AtHome) && (
                                <div>
                                  {book.Desc && (
                                    <span>Ghi chú : {book.Desc}</span>
                                  )}
                                  {book.Desc && book.AtHome && (
                                    <span className="px-1" />
                                  )}
                                  {book.AtHome && (
                                    <span>Thực hiện tại nhà</span>
                                  )}
                                </div>
                              )}
                              <div>
                                Ngày
                                <span className="pl-1">
                                  {moment(book.BookDate).format("DD-MM-YYY")}
                                </span>
                                <span className="pl-3">Giờ</span>
                                <span className="pl-1">
                                  {moment(book.BookDate).format("HH:mm")}
                                </span>
                              </div>
                              {book.ChangeFromInfo && (
                                <div>Khách đã thay đổi lịch (*)</div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t">
                              <BookProcessPicker
                                type="Xác nhận đặt lịch"
                                data={book}
                              >
                                {({ open }) => (
                                  <button
                                    type="button"
                                    onClick={open}
                                    className="py-2 text-white rounded shadow bg-success"
                                  >
                                    Xác nhận
                                  </button>
                                )}
                              </BookProcessPicker>
                              <BookProcessPicker
                                type="Xác nhận huỷ lịch"
                                data={book}
                              >
                                {({ open }) => (
                                  <button
                                    type="button"
                                    onClick={open}
                                    className="py-2 text-white rounded shadow bg-danger"
                                  >
                                    Huỷ
                                  </button>
                                )}
                              </BookProcessPicker>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "memberBooksCancel" && (
                      <>
                        {item?.children.map((book, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 text-base font-medium">
                              {book?.RootTitles || "Chưa xác định dịch vụ"}
                            </div>
                            <div className="font-light text-gray-800">
                              {book?.Member?.IsAnonymous && (
                                <div>
                                  Khách vãng lai:
                                  <span className="pl-1">
                                    {book?.FullName || "Chưa xác định"}
                                  </span>
                                  <span className="px-1">-</span>
                                  <span>{book?.Phone || "Chưa xác định"}</span>
                                </div>
                              )}
                              {!book?.Member?.IsAnonymous && (
                                <div>
                                  KH:
                                  <span className="pl-1">
                                    {book?.Member?.FullName || "Chưa xác định"}
                                  </span>
                                  <span className="px-1">-</span>
                                  <span>
                                    {book?.Member?.MobilePhone ||
                                      "Chưa xác định"}
                                  </span>
                                </div>
                              )}
                              {book.UserServices && (
                                <div>
                                  NV:
                                  <span className="pl-1">
                                    {book.UserServices.map(
                                      (x) => x.FullName
                                    ).join(", ")}
                                  </span>
                                </div>
                              )}
                              {(book.Desc || book.AtHome) && (
                                <div>
                                  {book.Desc && (
                                    <span>Ghi chú : {book.Desc}</span>
                                  )}
                                  {book.Desc && book.AtHome && (
                                    <span className="px-1" />
                                  )}
                                  {book.AtHome && (
                                    <span>Thực hiện tại nhà</span>
                                  )}
                                </div>
                              )}
                              <div>
                                Ngày
                                <span className="pl-1">
                                  {moment(book.BookDate).format("DD-MM-YYY")}
                                </span>
                                <span className="pl-3">Giờ</span>
                                <span className="pl-1">
                                  {moment(book.BookDate).format("HH:mm")}
                                </span>
                              </div>
                              {book.ChangeFromInfo && (
                                <div>Khách đã thay đổi lịch (*)</div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t">
                              <button
                                type="button"
                                className="py-2 text-white rounded shadow bg-success"
                                onClick={() => onCancelBook(book)}
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "orderWebApp" && (
                      <>
                        {item?.children.map((order, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 flex justify-between gap-3">
                              <div className="flex-1 text-base font-medium">
                                {order.Member &&
                                order.Member.MobilePhone != "0000000000" ? (
                                  <>
                                    {order?.Member?.FullName || "Chưa xác định"}
                                  </>
                                ) : (
                                  <>{order?.SenderName}</>
                                )}
                              </div>
                              <div className="font-light w-[100px] text-right pt-1">
                                {moment(order.CreateDate).fromNow()}
                              </div>
                            </div>
                            <div className="font-light text-gray-800">
                              <div>
                                SĐT:
                                {order.Member &&
                                order.Member.MobilePhone != "0000000000" ? (
                                  <span className="pl-1">
                                    {order?.Member?.MobilePhone ||
                                      "Chưa xác định"}
                                  </span>
                                ) : (
                                  <span className="pl-1">
                                    {order?.SenderPhone}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">#{order.ID}</span>
                                <span className="px-1">-</span>
                                <span className="font-medium text-danger">
                                  {StringHelpers.formatVND(order.ToPay)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t">
                              <Link
                                href={`/admin/pos/orders/view/${order.ID}`}
                                className="py-2 text-white rounded shadow bg-success"
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "noti" && (
                      <>
                        {item?.children.map((x, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 flex justify-between items-center">
                              <span className="text-base font-medium">
                                {x?.Member?.FullName}
                              </span>
                              <span className="font-light">
                                {moment(x.CreateDate).fromNow()}
                              </span>
                            </div>
                            <div className="font-light text-gray-800">
                              <div
                                dangerouslySetInnerHTML={{ __html: x?.Content }}
                              ></div>
                            </div>
                            <div
                              type="button"
                              className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t"
                              onClick={() => onNoti(x)}
                            >
                              <button className="py-2 text-white rounded shadow bg-success">
                                Thực hiện nhắc
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "smsPayed" && (
                      <>
                        {item?.children.map((x, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 flex justify-between items-center">
                              <span className="text-base font-medium">
                                {x?.name} - {x?.phone}
                              </span>
                              <span className="font-light">
                                {moment(x.CreateDate).fromNow()}
                              </span>
                            </div>
                            <div className="font-light text-gray-800">
                              <div>
                                Đơn hàng #{x.id}
                                <span className="pl-1">
                                  -
                                  <span className="pl-1 font-medium text-danger">
                                    {StringHelpers.formatVND(x.topay)}
                                  </span>
                                </span>
                              </div>
                              <div>
                                Thanh toán chờ duyệt:
                                <span className="pl-1 font-medium text-danger">
                                  {StringHelpers.formatVND(x.smsPayed)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t">
                              <button
                                type="button"
                                className="py-2 text-white rounded shadow bg-success"
                                onClick={() => onPayed(x)}
                              >
                                Duyệt thanh toán
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "contact" && (
                      <>
                        {item?.children.map((contact, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 flex justify-between items-center">
                              <span className="text-base font-medium">
                                {contact?.Fullname}
                              </span>
                              <span className="font-light">
                                {moment(contact.CreateDate).fromNow()}
                              </span>
                            </div>
                            <div className="font-light text-gray-800">
                              <div>
                                SĐT:
                                <span className="pl-1">
                                  {contact?.Phone1 ||
                                    contact?.Phone2 ||
                                    "Chưa xác định"}
                                </span>
                              </div>
                              {contact?.Content && (
                                <div>
                                  Nội dung:
                                  <span
                                    className="pl-1"
                                    dangerouslySetInnerHTML={{
                                      __html: contact?.Content,
                                    }}
                                  ></span>
                                </div>
                              )}

                              {contact.ByAff && (
                                <div className="text-waring">
                                  (*) Aff : {contact.ByAff.FullName} /{" "}
                                  {contact.ByAff.Phone}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t">
                              <button
                                type="button"
                                className="py-2 text-white rounded shadow bg-success"
                                onClick={() => onContact(contact)}
                              >
                                Đã xử lý
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {item.ID === "qrCallback" && (
                      <>
                        {item?.children.map((qr, i) => (
                          <div
                            className="p-4 mb-4 bg-white rounded last:mb-0"
                            key={i}
                          >
                            <div className="mb-1.5 flex justify-between items-center">
                              <span className="text-base font-medium">
                                {qr.SenderName}
                              </span>
                              <span className="font-light">
                                {moment(qr.CreateDate).fromNow()}
                              </span>
                            </div>
                            <div className="font-light text-gray-800">
                              <div>SĐT: {qr.SenderPhone}</div>
                              <div>
                                <span className="font-medium">
                                  #{qr.OrderID}
                                </span>
                                <span className="px-1">-</span>
                                <span className="font-medium text-danger">
                                  {StringHelpers.formatVND(qr.Amount)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t">
                              <button
                                type="button"
                                className="py-2 text-white rounded shadow bg-success"
                                onClick={() => onQrCallback(qr)}
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {(!item?.children || item?.children.length === 0) && (
                  <NoFound
                    Title="Không có kết quả nào."
                    Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                  />
                )}
              </Tab>
            ))}
        </Tabs>
      </div>
    </Page>
  );
}

export default ProcessingsAdmin;
