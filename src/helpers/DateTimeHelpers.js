import moment from "moment";
import MoresAPI from "../api/Mores.api";

const getNowServer = () => new Promise((resolve, reject) => {
    MoresAPI.getNow().then(({
        data
    }) => {
        resolve({
            CrDate: data.now
        });
    })
})

const formatTimeOpenClose = ({
    Text,
    InitialTime,
    Date
}) => {
    let Times = {
        ...InitialTime
    };

    let CommonTime = Array.from(Text.matchAll(/\[([^\][]*)]/g), (x) => x[1]);

    if (CommonTime && CommonTime.length > 0) {
        let CommonTimeJs = CommonTime[0].split(";");
        Times.TimeOpen = CommonTimeJs[0];
        Times.TimeClose = CommonTimeJs[1];
    }

    let PrivateTime = Array.from(Text.matchAll(/{+([^}]+)}+/g), (x) => x[1]);
    PrivateTime = PrivateTime.filter((x) => x.split(";").length > 2).map((x) => ({
        DayName: x.split(";")[0],
        TimeOpen: x.split(";")[1],
        TimeClose: x.split(";")[2],
    }));
    if (Date) {
        let index = PrivateTime.findIndex(
            (x) => x.DayName === moment(Date, "DD/MM/YYYY").format("ddd")
        );

        if (index > -1) {
            Times.TimeOpen = PrivateTime[index].TimeOpen;
            Times.TimeClose = PrivateTime[index].TimeClose;
        }
    }

    return Times;
};

const DateTimeHelpers = {
    getNowServer,
    formatTimeOpenClose
}
export default DateTimeHelpers