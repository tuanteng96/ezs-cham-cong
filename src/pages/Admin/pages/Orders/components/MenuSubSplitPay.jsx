import React, { useContext, useRef } from "react";
import {
  ScrollMenu,
  VisibilityContext,
  getItemsPos,
  slidingWindow,
} from "react-horizontal-scrolling-menu";
import clsx from "clsx";
import "react-horizontal-scrolling-menu/dist/styles.css";
import { useDrag } from "@/hooks";
import { toast } from "react-toastify";

function onWheel({ getItemById, items, visibleItems, scrollToItem }, ev) {
  const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

  if (isThouchpad) {
    ev.stopPropagation();
    return;
  }

  if (ev.deltaY < 0) {
    // NOTE: for center items
    const nextGroupItems = slidingWindow(
      items.toItemsKeys(),
      visibleItems
    ).next();
    const { center } = getItemsPos(nextGroupItems);
    scrollToItem(getItemById(center), "smooth", "center");
  } else if (ev.deltaY > 0) {
    const prevGroupItems = slidingWindow(
      items.toItemsKeys(),
      visibleItems
    ).prev();
    const { center } = getItemsPos(prevGroupItems);
    scrollToItem(getItemById(center), "smooth", "center");
  }
}

const Item = ({ itemId, selected, onClick, item }) => {
  const visibility = useContext(VisibilityContext);
  const visible = visibility.isItemVisible(itemId);

  return (
    <div
      onClick={() => onClick(visibility)}
      className={clsx(
        "cursor-pointer h-[48px]",
        selected ? "text-app" : "text-[#202244]"
        //item.disabled && "opacity-30"
      )}
    >
      <div
        className={clsx(
          "whitespace-nowrap h-full flex items-center text-[14px]"
        )}
      >
        {item.Title}
        {item?.children.length > 0 && (
          <span className="pl-1.5">({item?.children.length})</span>
        )}
      </div>
    </div>
  );
};

function MenuSubSplitPay({ data, selected, setSelected }) {
  const dragState = useRef(new useDrag());
  const handleDrag =
    ({ scrollContainer }) =>
    (ev) =>
      dragState.current.dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff;
        }
      });

  const handleItemClick =
    (itemId, Index, disabled) =>
    ({ getItemById, scrollToItem, getItemElementByIndex }) => {
      if (dragState.current.dragging) {
        return false;
      }

      if (disabled) {
        if (Index === 1 || Index === 2) {
          toast.warning("Đơn hàng đã được thanh toán hết.");
        } else {
          toast.warning("Đơn hàng chưa được thanh toán");
        }
      }

      if (!disabled) setSelected(itemId);
      scrollToItem(getItemElementByIndex(Index), "smooth", "center", "nearest");
    };

  const onInit = ({
    getItemById,
    scrollToItem,
    getItemElementByIndex,
    items,
  }) => {
    if (selected) {
      let index = data.findIndex((x) => x.ID === selected);
      if (index > -1) {
        scrollToItem(
          getItemElementByIndex(index),
          "smooth",
          "center",
          "nearest"
        );
      }
    }
  };

  if (!selected) {
    return (
      <div className="grid h-full grid-cols-2 gap-4">
        <div className="flex items-center">
          <div className="w-full h-3.5 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-full h-3.5 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" onMouseLeave={dragState.current.dragStop}>
      <ScrollMenu
        wrapperClassName="h-full"
        scrollContainerClassName="no-scrollbar"
        itemClassName="mr-5 last:mr-0 font-medium"
        onInit={onInit}
        onWheel={onWheel}
        onMouseDown={() => dragState.current.dragStart}
        onMouseUp={({ getItemById, scrollToItem, items }) =>
          () => {
            dragState.current.dragStop();
            const { center } = getItemsPos(items.getVisible());
            scrollToItem(getItemById(center), "smooth", "center");
          }}
        onMouseMove={handleDrag}
        options={{ throttle: 0 }}
      >
        {data &&
          data.map((item) => (
            <Item
              itemID={item.ID}
              key={item.ID}
              onClick={handleItemClick(item.ID, item.Index, item.disabled)}
              selected={item.ID === selected}
              item={item}
            />
          ))}
      </ScrollMenu>
    </div>
  );
}

export default MenuSubSplitPay;
