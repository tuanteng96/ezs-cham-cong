import React, { useState } from "react";
import { useMutation } from "react-query";
import MoresAPI from "../../../api/Mores.api";
import { useStore } from "framework7-react";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AssetsHelpers from "../../../helpers/AssetsHelpers";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";

function UploadFile({ value, onChange, PathFrame }) {
  const [isCreate, setIsCreate] = useState(false);
  const Auth = useStore("Auth");
  const uploadMutation = useMutation({
    mutationFn: (body) => MoresAPI.upload(body),
  });

  const handleFile = (event) => {
    const files = event.target.files;
    var bodyFormData = new FormData();
    bodyFormData.append("file", files[0]);

    uploadMutation.mutate(
      {
        Token: Auth?.token,
        File: bodyFormData,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error(data.error);
          } else {
            onChange("/upload/image/" + data.data);
          }
        },
        onError: (error) => {
          console.log(error);
        },
      }
    );
  };

  const onCreateImage = () => {
    setIsCreate(true);
  };

  window.addEventListener(
    "message",
    function ({ data }) {
      let dataJson = JSON.parse(data);
      if (dataJson?.Image) {
        onChange("/upload/image/" + dataJson?.Image);
        setIsCreate(false);
      }
      if (dataJson?.isClose) {
        setIsCreate(false);
      }
    },
    false
  );

  return (
    <div className="flex items-end">
      <div className="relative">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-32 h-32 border-[1px] border-[#d5d7da] border-dashed rounded cursor-pointer"
        >
          {value && (
            <div className="w-full h-full">
              <img
                className="object-contain w-full h-full"
                src={AssetsHelpers.toAbsoluteUrl(value, "")}
                alt="Hình ảnh"
              />
            </div>
          )}
          {!value && (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <div className="text-[11px] text-muted mt-1">Upload hình ảnh</div>
            </div>
          )}
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFile}
          />
        </label>
        {value && (
          <div
            className="absolute bg-white shadow-xl rounded-full w-6 h-6 flex items-center justify-center text-muted -top-[10px] -right-[10px] cursor-pointer"
            onClick={() => onChange("")}
          >
            <XMarkIcon className="w-5" />
          </div>
        )}
      </div>
      {PathFrame && value && (
        <div
          className="pl-5 text-sm cursor-pointer text-primary"
          onClick={onCreateImage}
        >
          Chỉnh sửa ảnh
        </div>
      )}
      {isCreate &&
        createPortal(
          <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
            <motion.div
              className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
              initial={{ opacity: 0, translateY: "100%" }}
              animate={{ opacity: 1, translateY: "0%" }}
              exit={{ opacity: 0, translateY: "100%" }}
              onClick={() => setIsCreate(false)}
            ></motion.div>
            <motion.div
              className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
              initial={{ opacity: 0, translateY: "100%" }}
              animate={{ opacity: 1, translateY: "0%" }}
              exit={{ opacity: 0, translateY: "100%" }}
            >
              <div className="w-full h-full overflow-hidden bg-white rounded">
                {PathFrame && (
                  <iframe
                    id="Demo1"
                    className="w-full h-full"
                    src={`https://cser.vn${PathFrame}?token=${Auth?.token}`}
                    title="Mẫu 1"
                    // onLoad={handleIfrmeLoad}
                    //scrolling="no"
                  ></iframe>
                )}
                {/* <LoadingComponentFull loading={loading} /> */}
              </div>
            </motion.div>
          </div>,
          document.getElementById("framework7-root")
        )}
    </div>
  );
}

export default UploadFile;
