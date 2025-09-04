import { useEffect, useState } from "react";
import { useStore } from "framework7-react";
import moment from "moment";

const useCheckInOut = () => {
  const [CheckIn, setCheckIn] = useState(null);
  const [CheckOut, setCheckOut] = useState(null);

  const [CheckInStorage, setCheckInStorage] = useState(null);
  const [CheckOutStorage, setCheckOutStorage] = useState(null);

  const Auth = useStore("Auth");
  const CrsInOut = useStore("CrsInOut");

  useEffect(() => {
    if (Auth) {
      let { WorkTrack } = Auth;
      let In = null;
      let Out = null;

      let indexCheckIn =
        WorkTrack?.List && WorkTrack?.List.findIndex((obj) => obj.CheckIn);
      if (indexCheckIn > -1) {
        In = WorkTrack?.List[indexCheckIn];
      }

      let indexCheckOut =
        WorkTrack?.List && WorkTrack?.List.findIndex((obj) => obj.CheckOut);
      if (indexCheckOut > -1) {
        Out = WorkTrack?.List[indexCheckOut];
      }

      setCheckIn(In);
      setCheckOut(Out);
    } else {
      setCheckIn(null);
      setCheckOut(null);
    }
  }, [Auth]);

  useEffect(() => {
    if (Auth && CrsInOut && CrsInOut.length > 0) {
      let { ServerTime } = Auth;
      let InStorage = null;
      let OutStorage = null;

      let indexIn = CrsInOut.findIndex(
        (x) =>
          x?.CheckIn &&
          moment(x?.CheckIn, "YYYY-MM-DD").format("YYYY-MM-DD") ===
            moment(ServerTime).format("YYYY-MM-DD")
      );
      if (indexIn > -1) {
        InStorage = CrsInOut[indexIn];
      }

      let indexOut = CrsInOut.findIndex(
        (x) =>
          x?.CheckOut &&
          moment(x?.CheckOut, "YYYY-MM-DD").format("YYYY-MM-DD") ===
            moment(ServerTime).format("YYYY-MM-DD")
      );
      if (indexOut > -1) {
        OutStorage = CrsInOut[indexOut];
      }
      setCheckInStorage(InStorage);
      setCheckOutStorage(OutStorage);
    } else {
      setCheckInStorage(null);
      setCheckOutStorage(null);
    }
  }, [CrsInOut, Auth]);

  return {
    CheckIn,
    CheckOut,
    CheckInStorage,
    CheckOutStorage,
  };
};

export default useCheckInOut;
