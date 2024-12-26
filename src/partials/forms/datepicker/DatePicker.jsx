import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Picker from "react-mobile-picker";
import moment from "moment";
import clsx from "clsx";
// 1900
// 2112

let months = Array.apply(0, Array(12)).map((_, i) =>
  moment().month(i).format("M")
);
const years = [...Array(2112 - 1990).keys()].map((i) => (i + 1990).toString());
const hoursList = Array(24)
  .fill()
  .map((_, i) => i.toString());
const minuteList = Array(60)
  .fill()
  .map((_, i) => (i < 10 ? "0" + i : i.toString()));

function DatePicker({
  clear,
  value,
  format,
  onChange,
  label,
  showHeader = false,
  errorMessage,
  errorMessageForce,
  placeholder = "Chọn thời gian",
  defaultValue,
  minDate = null,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const [pickerValue, setPickerValue] = useState({
    minutes: "",
    hours: "",
    seconds: "",
    milliseconds: "00",
    date: "",
    months: "",
    years: "",
  });

  useEffect(() => {
    setPickerValue((prevState) => ({
      ...prevState,
      hours: moment(value || new Date()).format("H"),
      minutes: moment(value || new Date()).format("mm"),
      seconds: moment(value || new Date()).format("ss"),
      date: moment(value || new Date()).format("DD"),
      months: moment(value || new Date()).format("M"),
      years: moment(value || new Date()).format("YYYY"),
    }));
  }, [value]);

  useEffect(() => {
    if (visible) {
      if (!value) {
        onChange(
          moment({
            hours: moment(value || defaultValue || new Date()).format("H"),
            minutes: moment(value || defaultValue || new Date()).format("mm"),
            seconds: moment(value || defaultValue || new Date()).format("ss"),
            date: moment(value || defaultValue || new Date()).format("DD"),
            months: (
              Number(moment(value || defaultValue || new Date()).format("M")) -
              1
            ).toString(),
            years: moment(value || defaultValue || new Date()).format("YYYY"),
          }).toDate()
        );
      }
    }
  }, [visible, value]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const getColsTotal = (v) => {
    let x = 0;
    if (v.includes("HH")) x += 1;
    if (v.includes("mm")) x += 1;
    if (v.includes("DD")) x += 1;
    if (v.includes("MM")) x += 1;
    if (v.includes("YYYY")) x += 1;
    return x;
  };

  return (
    <AnimatePresence initial={false}>
      <>
        <div
          className="relative"
          onClick={() => !props?.disabled && open()}
          //onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            className={clsx(
              "no-keyboard w-full py-3 px-4 border transition focus:border-primary font-normal shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded",
              errorMessageForce ? "border-danger" : "border-[#d5d7da]"
            )}
            type="text"
            placeholder={placeholder}
            value={value && moment(value).format(format)}
            readOnly
            {...props}
          />
          {clear && (
            <>
              {!value && (
                <CalendarDaysIcon className="absolute w-5 text-gray-700 right-3 top-2/4 -translate-y-2/4 pointer-none" />
              )}
              {value && (
                <div
                  className="absolute right-0 flex items-center justify-center w-12 h-full top-2/4 -translate-y-2/4"
                  onClick={(e) => {
                    if (!props?.disabled) {
                      e.stopPropagation();
                      onChange("");
                      close();
                    }
                  }}
                >
                  <XMarkIcon className="w-5 text-gray-700" />
                </div>
              )}
            </>
          )}
          {!clear && !value && (
            <CalendarDaysIcon className="absolute w-5 text-gray-700 right-3 top-2/4 -translate-y-2/4 pointer-none" />
          )}
        </div>
        {errorMessage && errorMessageForce && (
          <div className="mt-1.5 text-xs text-danger font-light">
            {errorMessage}
          </div>
        )}
        {visible &&
          createPortal(
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  {label || "Chọn thời gian"}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="px-4 pb-safe-b">
                  {showHeader && (
                    <div
                      className={clsx(
                        `grid grid-cols-${getColsTotal(
                          format
                        )} gap-2 mb-3 text-xs text-center text-muted`
                      )}
                    >
                      {format.includes("HH") && <div>Giờ</div>}
                      {format.includes("mm") && <div>Phút</div>}
                      {format.includes("DD") && <div>Ngày</div>}
                      {format.includes("MM") && <div>Tháng</div>}
                      {format.includes("YYYY") && <div>Năm</div>}
                    </div>
                  )}

                  <Picker
                    value={pickerValue}
                    onChange={({
                      years,
                      months,
                      date,
                      hours,
                      minutes,
                      seconds,
                      milliseconds,
                    }) => {
                      let isSet = true;
                      if (minDate) {
                        let newValue = moment({
                          years: years || moment(new Date()).format("YYYY"),
                          months: months
                            ? Number(months) - 1
                            : moment(new Date()).format("M"),
                          date: date || moment(new Date()).format("DD"),
                          hours: hours || moment(new Date()).format("H"),
                          minutes: minutes || moment(new Date()).format("mm"),
                          seconds: seconds || moment(new Date()).format("ss"),
                          milliseconds,
                        }).toDate();
                        if (moment(minDate).diff(newValue, "minutes") > 0) {
                          isSet = false;
                        }
                      }
                      if (isSet) {
                        onChange(
                          moment({
                            years: years || moment(new Date()).format("YYYY"),
                            months: months
                              ? Number(months) - 1
                              : moment(new Date()).format("M"),
                            date: date || moment(new Date()).format("DD"),
                            hours: hours || moment(new Date()).format("H"),
                            minutes: minutes || moment(new Date()).format("mm"),
                            seconds: seconds || moment(new Date()).format("ss"),
                            milliseconds,
                          }).toDate()
                        );
                      }
                    }}
                    itemHeight={52}
                    height={260}
                    className={clsx(
                      "gap-1.5 last:[&>div]:hidden",
                      "!grid-cols-" + getColsTotal(format)
                    )}
                    wheel="normal"
                  >
                    {format.includes("HH") && (
                      <Picker.Column key="hours" name="hours">
                        {hoursList.map((hour, i) => (
                          <Picker.Item key={i} value={hour}>
                            {({ selected }) => (
                              <div
                                className={clsx(
                                  "w-full h-full rounded flex items-center justify-center",
                                  selected
                                    ? "bg-[#f4f5f6] text-primary text-base"
                                    : "opacity-70"
                                )}
                              >
                                {hour}
                              </div>
                            )}
                          </Picker.Item>
                        ))}
                      </Picker.Column>
                    )}

                    {format.includes("mm") && (
                      <Picker.Column key="minutes" name="minutes">
                        {minuteList.map((minute, i) => (
                          <Picker.Item key={i} value={minute}>
                            {({ selected }) => (
                              <div
                                className={clsx(
                                  "w-full h-full rounded flex items-center justify-center",
                                  selected
                                    ? "bg-[#f4f5f6] text-primary text-base"
                                    : "opacity-70"
                                )}
                              >
                                {minute}
                              </div>
                            )}
                          </Picker.Item>
                        ))}
                      </Picker.Column>
                    )}

                    {format.includes("DD") && (
                      <Picker.Column key="date" name="date">
                        {Array.from(
                          {
                            length: moment(
                              `${pickerValue.months}-${pickerValue.years}`,
                              "MM-YYYY"
                            ).daysInMonth(),
                          },
                          (x, i) =>
                            moment(
                              `${pickerValue.months}-${pickerValue.years}`,
                              "MM-YYYY"
                            )
                              .startOf("month")
                              .add(i, "days")
                              .format("DD")
                        ).map((day, i) => (
                          <Picker.Item key={i} value={day}>
                            {({ selected }) => (
                              <div
                                className={clsx(
                                  "w-full h-full rounded flex items-center justify-center",
                                  selected
                                    ? "bg-[#f4f5f6] text-primary text-base"
                                    : "opacity-70"
                                )}
                              >
                                {day}
                              </div>
                            )}
                          </Picker.Item>
                        ))}
                      </Picker.Column>
                    )}

                    {format.includes("MM") && (
                      <Picker.Column key="months" name="months">
                        {months.map((month, i) => (
                          <Picker.Item key={i} value={month}>
                            {({ selected }) => (
                              <div
                                className={clsx(
                                  "w-full h-full rounded flex items-center justify-center",
                                  selected
                                    ? "bg-[#f4f5f6] text-primary text-base"
                                    : "opacity-70"
                                )}
                              >
                                {format.includes("HH") && format.includes("mm")
                                  ? "Thg"
                                  : "Tháng"}
                                <span className="pl-1">{month}</span>
                              </div>
                            )}
                          </Picker.Item>
                        ))}
                      </Picker.Column>
                    )}

                    {format.includes("YYYY") && (
                      <Picker.Column key="years" name="years">
                        {years.map((year, i) => (
                          <Picker.Item key={i} value={year}>
                            {({ selected }) => (
                              <div
                                className={clsx(
                                  "w-full h-full rounded flex items-center justify-center",
                                  selected
                                    ? "bg-[#f4f5f6] text-primary text-base"
                                    : "opacity-70"
                                )}
                              >
                                {year}
                              </div>
                            )}
                          </Picker.Item>
                        ))}
                      </Picker.Column>
                    )}
                  </Picker>
                </div>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default DatePicker;
