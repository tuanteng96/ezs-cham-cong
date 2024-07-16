import { useEffect, useState } from "react";
import store from "../js/store";
import { useStore } from "framework7-react";

const useCheckInOut = () => {
  const [CheckIn, setCheckIn] = useState(null);
  const [CheckOut, setCheckOut] = useState(null);
  const Auth = useStore("Auth");
  
  useEffect(() => {
    if (Auth?.WorkTrack && Auth?.WorkTrack?.List?.length > 0) {
      let { WorkTrack } = Auth;
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
  }, [Auth]);

  return {
    CheckIn,
    CheckOut,
  };
};

export default useCheckInOut;
