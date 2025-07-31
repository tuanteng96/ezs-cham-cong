import React from "react";
import { useMutation } from "react-query";
import MoresAPI from "../../../api/Mores.api";
import { useStore } from "framework7-react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AssetsHelpers from "../../../helpers/AssetsHelpers";
import clsx from "clsx";

function UploadFiles({
  value,
  onChange,
  widthClass = "w-32",
  heightClass = "h-32",
  wrapClass = "flex items-end",
}) {
  const Auth = useStore("Auth");
  const uploadMutation = useMutation({
    mutationFn: (body) => MoresAPI.upload(body),
  });

  // const handleFile = async (event) => {
  //   const [file] = event.target.files;
  //   if (file) {
  //     let val = await new Promise((resolve) => {
  //       Resizer.imageFileResizer(
  //         file,
  //         600,
  //         600,
  //         "JPEG",
  //         100,
  //         0,
  //         (uri) => {
  //           resolve(uri);
  //         },
  //         "file",
  //         300,
  //         300
  //       );
  //     });
  //     var bodyFormData = new FormData();
  //     bodyFormData.append("file", val);

  //     uploadMutation.mutate(
  //       {
  //         Token: Auth?.token,
  //         File: bodyFormData,
  //       },
  //       {
  //         onSuccess: ({ data }) => {
  //           if (data?.error) {
  //             toast.error(data.error);
  //           } else {
  //             onChange(data.data);
  //           }
  //         },
  //         onError: (error) => {
  //           console.log(error);
  //         },
  //       }
  //     );
  //   }
  // };

  return (
    <div className={clsx(wrapClass)}>
      <div className="relative w-full h-full">
        <label
          htmlFor="dropzone-file"
          className={clsx(
            "flex flex-col items-center justify-center border-[1px] border-[#d5d7da] border-dashed rounded cursor-pointer",
            widthClass,
            heightClass
          )}
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
                className="text-gray-500 w-7 h-7 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <div className="text-[11px] text-muted mt-1">Upload</div>
            </div>
          )}
          {/* <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFile}
            value=""
          /> */}
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
    </div>
  );
}

export default UploadFiles;
