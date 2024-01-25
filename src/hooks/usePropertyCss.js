import { useEffect, useState } from "react";

function usePropertyCss(PropertyName) {
  let [value, setValue] = useState(0);

  useEffect(() => {
    let valueProperty = Number(
      getComputedStyle(document.documentElement)
        .getPropertyValue(PropertyName)
        .replaceAll("px", "")
    );
    setValue(valueProperty);
  }, [PropertyName]);

  return value;
}

export default usePropertyCss;
