import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Picker from "react-mobile-picker";
import moment from "moment";
import clsx from "clsx";
// 1900
// 2112

let months = Array.apply(0, Array(12)).map((_, i) =>
  moment().month(i).format("M")
);
const years = [...Array(2112 - 1990).keys()].map((i) => (i + 1990).toString());
const hoursList = Array(23)
  .fill()
  .map((_, i) => i.toString());
const minuteList = Array(23)
  .fill()
  .map((_, i) => (i < 10 ? "0" + i : i.toString()));

function DatePickerWrap({ children, value, format, onChange, label, showHeader = false }) {
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
      hours: moment(value).format("H") || "",
      minutes: moment(value).format("mm") || "",
      seconds: moment(value).format("ss") || "",
      date: moment(value).format("DD") || "",
      months: moment(value).format("M") || "",
      years: moment(value).format("YYYY") || "",
    }));
  }, [value]);

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
        {children({
          open: open,
        })}
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
                      onChange(
                        moment({
                          years,
                          months: Number(months) - 1,
                          date,
                          hours,
                          minutes,
                          seconds,
                          milliseconds,
                        }).toDate()
                      );
                    }}
                    itemHeight={52}
                    height={260}
                    className={clsx(
                      "gap-1.5 last:[&>div]:hidden",
                      "!grid-cols-" + getColsTotal(format)
                    )}
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

export default DatePickerWrap;
