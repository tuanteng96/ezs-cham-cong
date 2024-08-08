import React from "react";
import NavigationBase from "./NavigationBase";
import NavigationDivide from "./NavigationDivide"
import { useStore } from "framework7-react";

function Navigation(props) {
  const Brand = useStore("Brand");
  
  if(Brand?.Global?.Timekeeping?.Version === 1) {
    return <NavigationDivide />;
  }
  return <NavigationBase />;
}

export default Navigation;
