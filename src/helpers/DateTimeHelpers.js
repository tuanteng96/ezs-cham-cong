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
const DateTimeHelpers = {
    getNowServer
}
export default DateTimeHelpers