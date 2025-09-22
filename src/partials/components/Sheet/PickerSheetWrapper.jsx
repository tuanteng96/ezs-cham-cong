import React, { useState } from "react";

function PickerSheetWrapper({ Component, componentProps, children }) {
  const [visible, setVisible] = useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return (
    <>
      {children({ open, close })}

      <Component {...componentProps} onClose={close} onOpen={open}>
        {({ open, close }) => null} {/* ✅ bắt buộc giữ function để không lỗi */}
      </Component>
    </>
  );
}



export default PickerSheetWrapper;
