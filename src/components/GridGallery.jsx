import React from "react";
import AssetsHelpers from "../helpers/AssetsHelpers";
import clsx from "clsx";

function GridGallery({ photos }) {
  if (photos.length === 1) {
    return photos.map((x, index) => (
      <img
        key={index}
        src={AssetsHelpers.toAbsoluteUrl(x)}
        className="w-full"
        onError={(e) => {
          if (e.target.src !== "/AppCore/images/no-thumbnail.jpeg") {
            e.target.onerror = null;
            e.target.src = AssetsHelpers.toAbsoluteUrlCore(
              "/AppCore/images/no-thumbnail.jpeg",
              ""
            );
          }
        }}
      />
    ));
  }
  if (photos.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {photos.map((x, index) => (
          <div key={index}>
            <img
              src={AssetsHelpers.toAbsoluteUrl(x)}
              className="w-full"
              onError={(e) => {
                if (e.target.src !== "/AppCore/images/no-thumbnail.jpeg") {
                  e.target.onerror = null;
                  e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                    "/AppCore/images/no-thumbnail.jpeg",
                    ""
                  );
                }
              }}
            />
          </div>
        ))}
      </div>
    );
  }
  if (photos.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {photos.map((x, index) => (
          <div className={clsx(index === 0 && "col-span-2")} key={index}>
            <img
              src={AssetsHelpers.toAbsoluteUrl(x)}
              className="w-full"
              onError={(e) => {
                if (e.target.src !== "/AppCore/images/no-thumbnail.jpeg") {
                  e.target.onerror = null;
                  e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                    "/AppCore/images/no-thumbnail.jpeg",
                    ""
                  );
                }
              }}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1">
      {photos.slice(0, 4).map((x, index) => (
        <div className="relative" key={index}>
          <img
            src={AssetsHelpers.toAbsoluteUrl(x)}
            className="object-cover w-full h-full"
            onError={(e) => {
              if (e.target.src !== "/AppCore/images/no-thumbnail.jpeg") {
                e.target.onerror = null;
                e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                  "/AppCore/images/no-thumbnail.jpeg",
                  ""
                );
              }
            }}
          />
          {index === 3 && <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full text-2xl text-white bg-black/50">+{photos.length - 4}</div>}
        </div>
      ))}
    </div>
  );
}

export default GridGallery;
