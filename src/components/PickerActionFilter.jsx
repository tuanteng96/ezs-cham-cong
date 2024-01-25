import React, { useState } from "react";
import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
} from "framework7-react";
import clsx from "clsx";
import { CheckIcon } from "@heroicons/react/24/outline";

function PickerActionFilter({ children, options, onChange, label, option }) {
  const [visible, setVisible] = useState(false);

  const close = () => setVisible(false);

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: close,
      })}

      <Actions opened={visible} onActionsClosed={close}>
        <ActionsGroup>
          {label && <ActionsLabel>{label}</ActionsLabel>}
          {options &&
            options.map((item, index) => (
              <ActionsButton
                className={clsx(
                  option === item.value && "text-app",
                  "relative"
                )}
                key={index}
                onClick={() => onChange(item)}
              >
                {item.Title}
                {option === item.value && (
                  <CheckIcon className="absolute w-6 top-2/4 right-4 -translate-y-2/4" />
                )}
              </ActionsButton>
            ))}
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Đóng</ActionsButton>
        </ActionsGroup>
      </Actions>
    </>
  );
}

export default PickerActionFilter;
