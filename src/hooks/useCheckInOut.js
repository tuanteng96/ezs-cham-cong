import { useEffect, useState } from "react";
import store from "../js/store";

const useCheckInOut = () => {
  const [CheckIn, setCheckIn] = useState(null);
  const [CheckOut, setCheckOut] = useState(null);
  useEffect(() => {
    if (store?.getters?.Auth?.value?.WorkTrack && store?.getters?.Auth?.value?.WorkTrack?.List?.length > 0) {
      let { WorkTrack } = store?.getters?.Auth?.value;
      let indexCheckIn = WorkTrack?.List && WorkTrack?.List.findIndex((obj) => obj.CheckIn);
      let indexCheckOut = WorkTrack?.List && WorkTrack?.List.findIndex((obj) => obj.CheckOut);
      indexCheckIn > -1
        ? setCheckIn(WorkTrack?.List[indexCheckIn])
        : setCheckIn(null);
      indexCheckOut > -1
        ? setCheckOut(WorkTrack?.List[indexCheckOut])
        : setCheckOut(null);
    } else {
      setCheckIn(null);
      setCheckOut(null);
    }
  }, [store?.getters?.Auth?.value]);

  return {
    CheckIn,
    CheckOut,
  };
};

export default useCheckInOut;
