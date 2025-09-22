import React, { useContext, useEffect, useRef } from "react";
import {
  ScrollMenu,
  VisibilityContext,
  getItemsPos,
  slidingWindow,
} from "react-horizontal-scrolling-menu";
import clsx from "clsx";
import "react-horizontal-scrolling-menu/dist/styles.css";
import { useDrag } from "@/hooks";

function onWheel({ getItemById, items, visibleItems, scrollToItem }, ev) {
  const isTouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

  if (isTouchpad) {
    ev.stopPropagation();
    return;
  }

  if (ev.deltaY < 0) {
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

  return (
    <div
      onClick={() => onClick(visibility)}
      className={clsx(
        "cursor-pointer h-[48px]",
        selected ? "text-app" : "text-[#202244]"
      )}
    >
      <div
        className={clsx(
          "whitespace-nowrap h-full flex items-center text-[14px]"
        )}
      >
        {item.Title}{" "}
        {!item.visibleCount && <>({item?.Total || item?.children.length})</>}
      </div>
    </div>
  );
};

function MenuSubNavbar({
  data,
  selected,
  setSelected,
  className = "w-full h-full",
}) {
  const dragState = useRef(new useDrag());
  const apiRef = useRef(null);

  // scroll khi selected thay đổi
  useEffect(() => {
    if (apiRef.current && selected) {
      const { getItemById, scrollToItem } = apiRef.current;
      requestAnimationFrame(() => {
        // lần đầu mount dùng auto để tránh giật
        scrollToItem(getItemById(selected), "auto", "center");
      });
    }
  }, [selected]);

  const handleDrag =
    ({ scrollContainer }) =>
    (ev) =>
      dragState.current.dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff;
        }
      });

  const handleItemClick =
    (itemId) =>
    ({ getItemById, scrollToItem }) => {
      if (dragState.current.dragging) return;
      setSelected(itemId);
      scrollToItem(getItemById(itemId), "smooth", "center");
    };

  const handleInit = ({ getItemById, scrollToItem }) => {
    if (selected) {
      const tryScroll = () => {
        const el = getItemById(selected);

        if (el) {
          scrollToItem(el, "smooth", "center");
        } else {
          setTimeout(tryScroll, 50);
        }
      };
      tryScroll();
    }
  };

  return (
    <div className={className} onMouseLeave={dragState.current.dragStop}>
      <ScrollMenu
        apiRef={apiRef}
        wrapperClassName="h-full"
        scrollContainerClassName="no-scrollbar"
        itemClassName="mr-5 last:mr-0"
        onInit={handleInit}
        onWheel={onWheel}
        onMouseDown={dragState.current.dragStart}
        onMouseUp={({ getItemById, scrollToItem, items }) => {
          dragState.current.dragStop();
          const { center } = getItemsPos(items.getVisible());
          scrollToItem(getItemById(center), "smooth", "center");
        }}
        onMouseMove={handleDrag}
        options={{ throttle: 0 }}
      >
        {data?.map((item) => (
          <Item
            itemId={item.ID}
            key={item.ID}
            onClick={handleItemClick(item.ID)}
            selected={item.ID === selected}
            item={item}
          />
        ))}
      </ScrollMenu>
    </div>
  );
}

export default MenuSubNavbar;
