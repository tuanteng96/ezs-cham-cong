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
      )}
    >
      <div
        className={clsx(
          "whitespace-nowrap h-full flex items-center text-[14px]"
        )}
      >
        {item.Title} ({item?.children?.length})
      </div>
    </div>
  );
};

function MenuSubNavbar({ data, selected, setSelected }) {
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
    (itemId, index) =>
    ({ getItemById, scrollToItem, getItemElementByIndex }) => {
      if (dragState.current.dragging) {
        return false;
      }
      setSelected(itemId);
      scrollToItem(getItemElementByIndex(index), "smooth", "center", "nearest");
      //scrollToItem(getItemById(itemId), "smooth", "center", "nearest");
    };

  const onInit = ({ getItemById, scrollToItem }) => {
    if (selected) {
      scrollToItem(getItemById(selected), "smooth", "center", "nearest");
    }
  };

  return (
    <div className="w-full h-full" onMouseLeave={dragState.current.dragStop}>
      <ScrollMenu
        wrapperClassName="h-full"
        scrollContainerClassName="no-scrollbar"
        itemClassName="mr-4 last:mr-0"
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
          data.map((item, index) => (
            <Item
              itemID={item.ID}
              key={item.ID}
              onClick={handleItemClick(item.ID, index)}
              selected={item.ID === selected}
              item={item}
            />
          ))}
      </ScrollMenu>
    </div>
  );
}

export default MenuSubNavbar;
