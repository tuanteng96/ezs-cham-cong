import moment from "moment";

const WorksHelpers = {
  getConfirmOutInDivide: ({ CheckIn, CheckOut, CrDate, CheckInOutJSON }) =>
    new Promise((resolve, reject) => {
      let Intervals = [
        {
          From: "00:00:00",
          To: "08:45:59",
        },
        {
          From: "08:46:00",
          To: "11:29:59",
        },
        {
          From: "11:30:00",
          To: "13:59:59",
        },
        {
          From: "14:00:00",
          To: "16:29:59",
        },
        {
          From: "16:30:00",
          To: "18:59:59",
        },
        {
          From: "19:00:00",
          To: "23:59:59",
        },
      ];
      let initialValues = {
        Info: {},
      };

      let MinutesPrice = 333;

      let index = Intervals.findIndex(
        (x) =>
          moment(moment(CrDate).format("HH:mm:ss"), "HH:mm:ss").isSameOrAfter(
            moment(x.From, "HH:mm:ss")
          ) &&
          moment(moment(CrDate).format("HH:mm:ss"), "HH:mm:ss").isSameOrBefore(
            moment(x.To, "HH:mm:ss")
          )
      );

      if (index > -1) {
        let durationIn = moment(Intervals[index].From, "HH:mm:ss").diff(
          moment(moment(CrDate).format("HH:mm:ss"), "HH:mm:ss"),
          "minute"
        );
        let durationOut = moment(Intervals[index].To, "HH:mm:ss").diff(
          moment(moment(CrDate).format("HH:mm:ss"), "HH:mm:ss"),
          "minute"
        );
        if (!CheckIn) {
          initialValues.Info.WorkToday = {
            In: {
              Interval: Intervals[index],
              IntervalIndex: index,
              durationIn,
              durationOut,
              MinutesPrice,
            },
          };

          initialValues.Info.Title = "Hôm nay bạn đi muộn ?";

          if (index === 0) {
            initialValues.Info.WorkToday.Value = 1;
            delete initialValues.Info.Title;
            reject(initialValues);
          }
          if (index === 1) {
            initialValues.Info.WorkToday.Value = 1;
            initialValues.Info["DI_MUON"] = {
              Value: MinutesPrice * Math.abs(durationIn),
            };
          }
          if (index === 2) {
            initialValues.Info.WorkToday.Value = 0.5;
            initialValues.Info["DI_SOM"] = {
              Value: MinutesPrice * Math.abs(durationOut),
            };
          }
          if (index === 3) {
            initialValues.Info.WorkToday.Value = 0.5;
            initialValues.Info["DI_MUON"] = {
              Value: MinutesPrice * Math.abs(durationIn),
            };
          }
          if (index === 4) {
            initialValues.Info.WorkToday.Value = 0;
            initialValues.Info["DI_SOM"] = {
              Value: MinutesPrice * Math.abs(durationOut),
            };
          }
          if (index === 5) {
            initialValues.Info.WorkToday.Value = 0;
          }
        } else {
          initialValues.Info.WorkToday = {
            Out: {
              Interval: Intervals[index],
              IntervalIndex: index,
              durationIn,
              durationOut,
              MinutesPrice,
            },
          };

          initialValues.Info.Title = "Hôm nay bạn về sớm ?";

          if (index === 0) {
            initialValues.Info.WorkToday.Value = 0;
            delete initialValues.Info.Title;
            reject(initialValues);
          }
          if (index === 1) {
            initialValues.Info.WorkToday.Value = 0;
            initialValues.Info["VE_MUON"] = {
              Value: MinutesPrice * Math.abs(durationIn),
            };
          }
          if (index === 2) {
            initialValues.Info.WorkToday.Value =
              (CheckIn?.Info?.WorkToday?.Value || 0) - 0.5;
            initialValues.Info["VE_SOM"] = {
              Value: MinutesPrice * Math.abs(durationOut),
            };
          }
          if (index === 3) {
            initialValues.Info.WorkToday.Value =
              (CheckIn?.Info?.WorkToday?.Value || 0) - 0.5;
            initialValues.Info["VE_MUON"] = {
              Value: MinutesPrice * Math.abs(durationIn),
            };
          }
          if (index === 4) {
            initialValues.Info.WorkToday.Value =
              CheckIn?.Info?.WorkToday?.Value || 0;
            initialValues.Info["VE_SOM"] = {
              Value: MinutesPrice * Math.abs(durationOut),
            };
          }
          if (index === 5) {
            initialValues.Info.WorkToday.Value =
              CheckIn?.Info?.WorkToday?.Value || 0;
            initialValues.Info["VE_MUON"] = {
              Value: 0,
            };
          }
        }
      } else {
        reject({ error: "Không tìm thấy khoảng thấy gian phù hợp." });
      }

      resolve(Object.keys(initialValues).length === 0 ? null : initialValues);
    }),
  getConfirmOutIn: ({
    WorkShiftsSetting,
    WorkTimeToday,
    CheckIn,
    CheckOut,
    CrDate,
    CheckInOutJSON,
  }) =>
    new Promise((resolve, reject) => {
      let initialValues = {};
      if (WorkTimeToday && !WorkTimeToday.isOff) {
        if (!WorkTimeToday.TimeFrom && !WorkTimeToday.TimeTo)
          reject("Chưa cài đặt thời gian ca làm.");

        if (!CheckIn && WorkTimeToday.TimeFrom) {
          let duration = moment(WorkTimeToday.TimeFrom, "HH:mm").diff(
            moment(moment(CrDate).format("HH:mm"), "HH:mm"),
            "minute"
          );

          let WorkShiftDuration =
            WorkShiftsSetting[duration > 0 ? "DI_SOM" : "DI_MUON"];

          let indexShift = WorkShiftDuration.findIndex(
            (x) =>
              Math.abs(duration) >= Number(x.FromMinute) &&
              Math.abs(duration) <= Number(x.ToMinute)
          );

          if (indexShift === -1) reject("Không tìm thấy khoảng thời gian vào.");
          initialValues.Title =
            duration > 0 ? "Hôm nay bạn đi sớm?" : "Hôm nay bạn đi muộn?";

          if (WorkShiftDuration[indexShift].Value < 0) {
            if (Number(WorkShiftDuration[indexShift].Value) === -60) {
              initialValues[duration > 0 ? "DI_SOM" : "DI_MUON"] = {
                ...WorkShiftDuration[indexShift],
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Duration: duration,
                Value: Math.round(
                  Math.abs(duration) * ((WorkTimeToday.SalaryHours || 0) / 60)
                ),
              };
            } else if (WorkShiftDuration[indexShift].Value > -10) {
              initialValues[duration > 0 ? "DI_SOM" : "DI_MUON"] = {
                ...WorkShiftDuration[indexShift],
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Value: 0,
                Duration: duration,
                WorkDays:
                  duration > 0
                    ? Number(
                        (
                          Number(CheckInOutJSON.list[0].Info.WorkToday.Value) -
                          Number(WorkShiftDuration[indexShift].Value)
                        ).toFixed(1)
                      )
                    : Number(
                        (
                          Number(CheckInOutJSON.list[0].Info.WorkToday.Value) +
                          Number(WorkShiftDuration[indexShift].Value)
                        ).toFixed(1)
                      ),
              };
            } else {
              initialValues[duration > 0 ? "DI_SOM" : "DI_MUON"] = {
                ...WorkShiftDuration[indexShift],
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Duration: duration,
                Value: Math.abs(duration * WorkShiftDuration[indexShift].Value),
              };
            }
          } else {
            initialValues[duration > 0 ? "DI_SOM" : "DI_MUON"] = {
              ...WorkShiftDuration[indexShift],
              ValueType: WorkShiftDuration[indexShift]?.Value,
              Duration: duration,
              Value:
                WorkShiftDuration[indexShift].Value > 100
                  ? WorkShiftDuration[indexShift].Value
                  : WorkShiftDuration[indexShift].Value *
                    WorkTimeToday.SalaryHours,
            };
          }
        }

        if (CheckIn && !CheckOut && WorkTimeToday.TimeTo) {
          let duration = moment(WorkTimeToday.TimeTo, "HH:mm").diff(
            moment(moment(CrDate).format("HH:mm"), "HH:mm"),
            "minute"
          );
          let WorkShiftDuration =
            WorkShiftsSetting[duration > 0 ? "VE_SOM" : "VE_MUON"];
          let indexShift = WorkShiftDuration.findIndex(
            (x) =>
              Math.abs(duration) >= Number(x.FromMinute) &&
              Math.abs(duration) <= Number(x.ToMinute)
          );
          if (indexShift === -1) reject("Không tìm thấy khoảng thời gian ra.");

          initialValues.Title =
            duration > 0 ? "Hôm nay bạn về sớm?" : "Hôm nay bạn về muộn?";
          if (WorkShiftDuration[indexShift].Value < 0) {
            if (
              Number(WorkShiftDuration[indexShift].Value) === -60 &&
              WorkTimeToday.SalaryHours
            ) {
              initialValues[duration > 0 ? "VE_SOM" : "VE_MUON"] = {
                ...WorkShiftDuration[indexShift],
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Duration: duration,
                Value: Math.round(
                  Math.abs(duration) * ((WorkTimeToday.SalaryHours || 0) / 60)
                ),
              };
            } else if (WorkShiftDuration[indexShift].Value > -10) {
              initialValues[duration > 0 ? "VE_SOM" : "VE_MUON"] = {
                ...WorkShiftDuration[indexShift],
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Duration: duration,
                Value: 0,
                WorkDays:
                  duration > 0
                    ? Number(
                        (
                          Number(CheckInOutJSON.list[0].Info.WorkToday.Value) +
                          Number(WorkShiftDuration[indexShift].Value)
                        ).toFixed(1)
                      )
                    : Number(
                        (
                          Number(CheckInOutJSON.list[0].Info.WorkToday.Value) -
                          Number(WorkShiftDuration[indexShift].Value)
                        ).toFixed(1)
                      ),
              };
            } else {
              initialValues[duration > 0 ? "VE_SOM" : "VE_MUON"] = {
                ...WorkShiftDuration[indexShift],
                Duration: duration,
                ValueType: WorkShiftDuration[indexShift]?.Value,
                Value: Math.abs(duration * WorkShiftDuration[indexShift].Value),
              };
            }
          } else {
            initialValues[duration > 0 ? "VE_SOM" : "VE_MUON"] = {
              ...WorkShiftDuration[indexShift],
              Duration: duration,
              ValueType: WorkShiftDuration[indexShift]?.Value,
              Value:
                WorkShiftDuration[indexShift].Value > 100
                  ? WorkShiftDuration[indexShift].Value
                  : WorkShiftDuration[indexShift].Value *
                    WorkTimeToday.SalaryHours,
            };
          }
        }
      }
      if (WorkTimeToday.isOff) {
        initialValues.Title = "Hôm nay bạn không có lịch làm ?";
      }
      resolve(Object.keys(initialValues).length === 0 ? null : initialValues);
    }),
  getTimekeepingType: (info) => {
    let obj = {
      Value: "",
      Option: "",
    };
    if (!info) return obj;
    if (info["DI_SOM"]) {
      obj = {
        Value: info["DI_SOM"]?.Value,
        Option: {
          label: "Đi sớm",
          value: "DI_SOM",
        },
      };
    }
    if (info["DI_MUON"]) {
      obj = {
        Value: info["DI_MUON"]?.Value
          ? info?.Type === "CA_NHAN"
            ? -Math.abs(info["DI_MUON"].Value)
            : info["DI_MUON"].Value
          : 0,
        Option: {
          label: "Đi muộn",
          value: "DI_MUON",
        },
      };
    }
    if (info["VE_SOM"]) {
      obj = {
        Value: info["VE_SOM"]?.Value
          ? info?.Type === "CONG_TY"
            ? Math.abs(info["VE_SOM"].Value)
            : -Math.abs(info["VE_SOM"].Value)
          : 0,
        Option: {
          label: "Về sớm",
          value: "VE_SOM",
        },
      };
    }
    if (info["VE_MUON"]) {
      obj = {
        Value: info["VE_MUON"]?.Value,
        Option: {
          label: "Về muộn",
          value: "VE_MUON",
        },
      };
    }
    return obj;
  },
  getTimekeepingOption: (info) => {
    let obj = {
      Value: "",
      Option: "",
    };
    if (!info) return obj;
    if (info["DI_SOM"]) {
      obj = {
        Value: info["DI_SOM"]?.Value,
        Option: {
          label: "Đi sớm",
          value: "DI_SOM",
        },
      };
    }
    if (info["DI_MUON"]) {
      obj = {
        Value: info["DI_MUON"]?.Value ? -Math.abs(info["DI_MUON"].Value) : 0,
        Option: {
          label: "Đi muộn",
          value: "DI_MUON",
        },
      };
    }
    if (info["VE_SOM"]) {
      obj = {
        Value: info["VE_SOM"]?.Value ? -Math.abs(info["VE_SOM"].Value) : 0,
        Option: {
          label: "Về sớm",
          value: "VE_SOM",
        },
      };
    }
    if (info["VE_MUON"]) {
      obj = {
        Value: info["VE_MUON"]?.Value,
        Option: {
          label: "Về muộn",
          value: "VE_MUON",
        },
      };
    }
    return obj;
  },
  getTimeWork: ({ WorkTimeSetting, CA_LAM_VIEC, INDEX_NGAY }) => {
    if (!WorkTimeSetting || !CA_LAM_VIEC || INDEX_NGAY < 0) return;
    let index = CA_LAM_VIEC.findIndex((x) => x.ID === WorkTimeSetting.ShiftID);
    if (index < 0) return;
    let Day =
      CA_LAM_VIEC[index].Days &&
      CA_LAM_VIEC[index].Days.findIndex((d) => d.index === INDEX_NGAY);
    if (Day > -1) {
      return `${CA_LAM_VIEC[index].Name} : ${CA_LAM_VIEC[index].Days[Day].TimeFrom} - ${CA_LAM_VIEC[index].Days[Day].TimeTo}`;
    }
  },
  getCountWorkTime : ({ CheckIn, CheckOut }) => {
    if (!CheckIn || !CheckOut) return 0

    let duration = moment(moment(CheckOut).format('HH:mm:ss'), 'HH:mm:ss').diff(
      moment(moment(CheckIn).format('HH:mm:ss'), 'HH:mm:ss'),
      'minute'
    )
    if (duration < 0) return 0
    return duration
  }
};

export default WorksHelpers;
