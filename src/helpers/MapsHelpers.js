import axios from "axios"

const MapsHelpers = {
    getDistance: (start, end) => new Promise((resolve, reject) => {
        axios.get(`https://api.tomtom.com/routing/1/calculateRoute/${start.latitude},${start.longitude}:${end.latitude},${end.longitude}/json?&vehicleHeading=90&key=${import.meta.env.VITE_KEY}`).then(({
            data
        }) => {
            if (data && data.routes && data.routes.length > 0) {
                resolve(data.routes[0]["summary"])
            } else {
                reject("Không thể tính được khoảng cách hiện tại.")
            }
        }).catch(err => {
            reject("Vị trí Spa cài đặt không hợp lệ.")
        })
    })
}

export default MapsHelpers