import moment from "moment";

const WorksHelpers = {
    getConfirmOutIn: ({
        WorkShiftsSetting,
        WorkTimeToday,
        CheckIn,
        CheckOut,
        CrDate
    }) => new Promise((resolve, reject) => {

        let initialValues = {};

        if (WorkTimeToday && !WorkTimeToday.isOff) {

            if (!WorkTimeToday.TimeFrom && !WorkTimeToday.TimeTo) reject("Chưa cài đặt thời gian ca làm.");

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
                initialValues[duration > 0 ? "DI_SOM" : "DI_MUON"] = {
                    ...WorkShiftDuration[indexShift],
                    Value: WorkShiftDuration[indexShift].Value > 100 ? WorkShiftDuration[indexShift].Value : WorkShiftDuration[indexShift].Value * WorkTimeToday.SalaryHours
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
                initialValues[duration > 0 ? "VE_SOM" : "VE_MUON"] = {
                    ...WorkShiftDuration[indexShift],
                    Value: WorkShiftDuration[indexShift].Value > 100 ? WorkShiftDuration[indexShift].Value : WorkShiftDuration[indexShift].Value * WorkTimeToday.SalaryHours
                }
            }
        }
        if (WorkTimeToday.isOff) {
            initialValues.Title = "Hôm nay bạn không có lịch làm ?"
        }
        resolve(Object.keys(initialValues).length === 0 ? null : initialValues)
    })
}

export default WorksHelpers