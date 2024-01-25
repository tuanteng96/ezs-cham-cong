import { Sheet } from "framework7-react";
import React, { useState } from "react";

function PickerStatistical({ children, render }) {
  const [visible, setVisible] = useState(false);

  const close = () => {
    setVisible(false);
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: close,
      })}
      <Sheet
        style={{ height: "auto", maxHeight: "80%", overflow: "auto" }}
        swipeToClose
        //push
        backdrop
        opened={visible}
        onSheetClose={close}
      >
        <div className="pb-safe-b">{render}</div>
      </Sheet>
    </>
  );
}

export default PickerStatistical;
