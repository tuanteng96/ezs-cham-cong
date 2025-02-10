/* eslint-disable react/jsx-no-target-blank */
import { CameraIcon, FolderIcon, PhotoIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import React from "react";
import { f7, Link, Popover } from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";

const UploadImagesIcon = ({
  className,
  onChange,
  isMultiple = false,
  accept = "",
  popoverOpen = "popover-upload-images",
  children,
  ...props
}) => {
  const onPhotoLibrary = () => {
    const arg = {
      accept: accept,
      isMultiple: isMultiple,
    };
    PromHelpers.CHOOSE_IMAGES(JSON.stringify(arg))
      .then(({ data }) => {
        f7.dialog.close();
        if (data) {
          if (!isMultiple) {
            onChange(data[0].data);
          } else {
            onChange(
              data ? data.filter((x) => x.success).map((x) => x.data) : []
            );
          }
        }
      })
      .catch((e) => console.log(e));
  };

  const onTakePhoto = () => {
    PromHelpers.CHOOSE_FILE_SERVER()
      .then(({ data }) => {
        f7.dialog.close();
        if (data) {
          if (isMultiple) {
            onChange([data]);
          } else {
            onChange(data);
          }
        }
      })
      .catch((error) => console.log(error));
  };

  const onChooseFiles = () => {
    const arg = {
      accept: accept,
      isMultiple: isMultiple,
    };
    PromHelpers.CHOOSE_FILES(JSON.stringify(arg))
      .then(({ data }) => {
        f7.dialog.close();
        if (data) {
          if (!isMultiple) {
            onChange(data[0].data);
          } else {
            onChange(
              data ? data.filter((x) => x.success).map((x) => x.data) : []
            );
          }
        }
      })
      .catch((e) => console.log(e));
  };

  return (
    <>
      <div>
        <Link className={className} noLinkClass popoverOpen={`.${popoverOpen}`}>
          {children}
        </Link>
      </div>
      <Popover
        className={clsx(
          "min-w-[200px]",
          popoverOpen && "popover-upload-images"
        )}
      >
        <div className="flex flex-col py-1">
          <Link
            className="relative flex justify-between px-4 py-3 font-medium border-b last:border-0"
            popoverClose
            noLinkClass
            onClick={onPhotoLibrary}
          >
            Thư viện ảnh
            <PhotoIcon className="w-6" />
          </Link>
          <Link
            className="relative flex justify-between px-4 py-3 font-medium border-b last:border-0"
            popoverClose
            noLinkClass
            onClick={onTakePhoto}
          >
            Chụp ảnh
            <CameraIcon className="w-6" />
          </Link>
          <Link
            className="relative flex justify-between px-4 py-3 font-medium border-b last:border-0"
            popoverClose
            noLinkClass
            onClick={onChooseFiles}
          >
            Chọn tập tin
            <FolderIcon className="w-6" />
          </Link>
        </div>
      </Popover>
    </>
  );
};

export default UploadImagesIcon;
