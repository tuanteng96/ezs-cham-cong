import React, { useState, useRef } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
  Link,
  f7,
} from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function DebugPage(props) {
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const ChooseImages = () => {
    const arg = {
      accept: "",
      isMultiple: false,
    };
    PromHelpers.CHOOSE_IMAGES(JSON.stringify(arg))
      .then(({ data }) => {
        let newData = Array.isArray(data) ? data : data?.values || [];
        if (newData && newData.length > 0) {
          console.log(newData);
          f7.dialog.confirm(
            `path: ${newData[0]}, server: ${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}, token: ${Auth?.token}`,
            () => {
              console.log({
                server: `${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}`,
                path: newData[0],
                token: Auth?.token,
              });

              app21
                .prom(
                  "POST_TO_SERVER",
                  JSON.stringify({
                    server: `${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}`,
                    path: newData[0],
                    token: Auth?.token,
                  })
                )
                .then((s1) => {
                  var rs = JSON.parse(s1.data);
                  console.log(rs);
                  f7.dialog.alert(JSON.stringify(rs));
                })
                .catch((f1) => {
                  f7.dialog.alert(JSON.stringify(f1));
                });
            }
          );
        }
      })
      .catch((err) => f7.dialog.alert(JSON.stringify(err)));
  };

  const ChooseMultipleImages = () => {
    const arg = {
      accept: "",
      isMultiple: true,
    };
    PromHelpers.CHOOSE_IMAGES(JSON.stringify(arg))
      .then(({ data }) => {
        if (data && data.length > 0) {
          app21
            .prom(
              "POST_TO_SERVER",
              JSON.stringify({
                server: `${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}`,
                path: data[0],
                token: Auth?.token,
              })
            )
            .then((s1) => {
              console.log("POST_TO_SERVER");
              var rs = JSON.parse(s1.data);
              f7.dialog.alert(JSON.stringify(rs));
            })
            .catch((f1) => {
              f7.dialog.alert(JSON.stringify(f1));
            });
        }
      })
      .catch((err) => f7.dialog.alert(JSON.stringify(err)));
  };

  const ChooseFiles = () => {
    const arg = {
      accept: "",
      isMultiple: false,
    };
    PromHelpers.CHOOSE_FILES(JSON.stringify(arg))
      .then(({ data }) => {
        if (data && data.length > 0) {
          app21
            .prom(
              "POST_TO_SERVER",
              JSON.stringify({
                server: `${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}`,
                path: data[0],
                token: Auth?.token,
              })
            )
            .then((s1) => {
              console.log("POST_TO_SERVER");
              var rs = JSON.parse(s1.data);
              f7.dialog.alert(JSON.stringify(rs));
            })
            .catch((f1) => {
              f7.dialog.alert(JSON.stringify(f1));
            });
        }
      })
      .catch((err) => f7.dialog.alert(JSON.stringify(err)));
  };

  const ChooseMultipleFiles = () => {
    const arg = {
      accept: "",
      isMultiple: true,
    };
    PromHelpers.CHOOSE_FILES(JSON.stringify(arg))
      .then(({ data }) => {
        if (data && data.length > 0) {
          app21
            .prom(
              "POST_TO_SERVER",
              JSON.stringify({
                server: `${Brand.Domain}/api/v3/file?cmd=upload&autn=AAAA&token=${Auth?.token}`,
                path: data[0],
                token: Auth?.token,
              })
            )
            .then((s1) => {
              console.log("POST_TO_SERVER");
              var rs = JSON.parse(s1.data);
              f7.dialog.alert(JSON.stringify(rs));
            })
            .catch((f1) => {
              f7.dialog.alert(JSON.stringify(f1));
            });
        }
      })
      .catch((err) => f7.dialog.alert(JSON.stringify(err)));
  };

  const Camera = () => {
    PromHelpers.CHOOSE_FILE_SERVER()
      .then(({ data }) => {
        console.log(data);
      })
      .catch((error) => console.log(error));
  };

  return (
    <Page
      className="bg-white"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            back
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Debug</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col gap-4 p-4">
        <div
          className="flex items-center justify-center h-12 px-4 text-white rounded cursor-pointer bg-primary"
          onClick={ChooseImages}
        >
          Chọn ảnh
        </div>
        <div
          className="flex items-center justify-center h-12 px-4 text-white rounded cursor-pointer bg-primary"
          onClick={ChooseMultipleImages}
        >
          Chọn nhiều ảnh
        </div>
        <div
          className="flex items-center justify-center h-12 px-4 text-white rounded cursor-pointer bg-primary"
          onClick={ChooseFiles}
        >
          Chọn file
        </div>
        <div
          className="flex items-center justify-center h-12 px-4 text-white rounded cursor-pointer bg-primary"
          onClick={ChooseMultipleFiles}
        >
          Chọn nhiều file
        </div>
        <div
          className="flex items-center justify-center h-12 px-4 text-white rounded cursor-pointer bg-primary"
          onClick={Camera}
        >
          Camera
        </div>
      </div>
    </Page>
  );
}

export default DebugPage;
