/* eslint-disable react/jsx-no-target-blank */
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import React, { useState } from "react";
import { toast } from "react-toastify";
import MoresAPI from "../api/Mores.api";
import { useStore } from "framework7-react";
import AssetsHelpers from "../helpers/AssetsHelpers";
import { useMutation } from "react-query";

const UploadImages = ({
  className,
  value,
  onChange,
  placeholder,
  errorMessage,
  errorMessageForce,
  size,
  width = "w-[160px]",
  height = "h-[160px]",
  buttonText = "Thêm ảnh",
  ...props
}) => {
  const Auth = useStore("Auth");
  const [completed, setCompleted] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: (body) =>
      MoresAPI.uploadProgress(body, (progress) => {
        setCompleted(progress);
      }),
  });

  const handleFileChange = (event) => {
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
            onChange(data.data);
          }
        },
        onError: (error) => {
          console.log(error);
        },
      }
    );
  };

  return (
    <>
      <div
        className={clsx(
          "rounded relative bg-primarylight",
          className,
          width,
          height
        )}
      >
        {/* No file */}
        <div
          className={clsx(
            "relative flex flex-col items-center justify-center h-full text-center border border-primarylight rounded",
            errorMessageForce && "border-danger"
          )}
        >
          <svg
            className="w-9"
            viewBox="0 0 25 23"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="fill-primary"
              d="M21.072 16.002a.75.75 0 01.75.75v1.842h1.842a.75.75 0 01.743.648l.007.102a.75.75 0 01-.75.75h-1.842v1.842a.75.75 0 01-.648.743l-.102.007a.75.75 0 01-.75-.75v-1.842H18.48a.75.75 0 01-.743-.648l-.007-.102a.75.75 0 01.75-.75h1.842v-1.842a.75.75 0 01.648-.743zM14.102.45a.75.75 0 01.624.334l1.621 2.43h3.285a2.593 2.593 0 012.593 2.594v7.494a.75.75 0 11-1.5 0V5.808c0-.604-.49-1.093-1.093-1.093h-3.686a.75.75 0 01-.624-.334L13.7 1.95H8.974l-1.62 2.43a.75.75 0 01-.624.335H3.043c-.604 0-1.093.49-1.093 1.093v11.98c0 .605.49 1.094 1.093 1.094h11.691a.75.75 0 110 1.5H3.044A2.593 2.593 0 01.45 17.789V5.808a2.593 2.593 0 012.593-2.593h3.285L7.948.784A.75.75 0 018.574.45zm-2.764 5.53a5.358 5.358 0 110 10.716 5.358 5.358 0 010-10.716zm0 1.5a3.858 3.858 0 100 7.716 3.858 3.858 0 000-7.716zM4.08 5.808a1.037 1.037 0 110 2.074 1.037 1.037 0 010-2.074z"
              fillRule="evenodd"
            />
          </svg>
          <div
            className={clsx(
              "text-primary font-medium mt-2",
              size === "xs" ? "text-xs" : "text-sm"
            )}
          >
            {buttonText}
          </div>
          <input
            value=""
            className="absolute top-0 left-0 z-0 w-full h-full opacity-0 cursor-pointer"
            type="file"
            title=""
            {...props}
            onChange={handleFileChange}
          />
        </div>
        {/* No file */}
        {value && (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-100 dark:bg-graydark-100">
            <a
              className="flex items-center justify-center h-full overflow-hidden rounded"
              target="_blank"
              rel="noopener"
            >
              <img
                className="w-full"
                src={AssetsHelpers.toAbsoluteUrl(value)}
                alt="Avatar"
              />
            </a>
            <div
              className="absolute z-10 flex items-center justify-center text-gray-700 transition bg-white rounded-full shadow-lg cursor-pointer dark:text-darkgray-800 dark:bg-graydark-200 h-7 w-7 -top-4 -right-4 hover:text-primary"
              onClick={() => onChange("")}
            >
              <XMarkIcon className="w-4" />
            </div>
          </div>
        )}

        {/* Loading */}
        <div
          className={clsx(
            "absolute top-0 right-0 flex items-center justify-center w-full h-full bg-white/90 dark:bg-dark-app/90 z-10 transition",
            uploadMutation.isLoading
              ? "opacity-1 visible"
              : "opacity-0 invisible"
          )}
        >
          <div className="flex flex-col items-center">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-graydark-800 fill-blue-600"
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
            <div className="mt-3 text-sm text-gray-600 dark:text-graydark-800">
              Đang tải ...{" "}
              <span className="font-medium text-primary">{completed}%</span>
            </div>
          </div>
        </div>
      </div>
      {placeholder && (
        <div className="mt-3 text-xs text-muted font-inter">{placeholder}</div>
      )}
    </>
  );
};

export default UploadImages;
