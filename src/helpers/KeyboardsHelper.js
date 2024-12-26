import Dom7 from "dom7";
import { f7 } from "framework7-react";

const setAndroid = ({ Type, Event, success, fail }) => {
  if (window.PlatformId === "ANDROID") {
    let { height } = f7;
    let heightKeyBoard = height / 2;
    let element = Dom7(Event.target);

    let F7KeyBoardHeight = getComputedStyle(
      document.querySelector("html")
    ).getPropertyValue("--f7-keyboard-height");

    if (F7KeyBoardHeight) heightKeyBoard = parseInt(F7KeyBoardHeight);

    let translateKeyboard = getComputedStyle(
      document.querySelector("html")
    ).getPropertyValue("--keyboard-translate");

    if (Type === "modal") {
      translateKeyboard = getComputedStyle(
        document.querySelector("html")
      ).getPropertyValue("--keyboard-translate-sheet-modal");
    }

    let elementCrOffset = translateKeyboard ? parseInt(translateKeyboard) : 0;
    let elementHeight = element.outerHeight();
    let ElementOffsetTop = element.offset().top;

    if (Type === "modal") {
      elementCrOffset = -elementCrOffset;
    }

    let ElementOffsetBottom =
      height + elementCrOffset - elementHeight - ElementOffsetTop;

    if (Event.type === "focus") {
      if (ElementOffsetBottom < heightKeyBoard) {
        if (Type === "body") {
          document.documentElement.style.setProperty(
            "--keyboard-translate",
            `-${heightKeyBoard - ElementOffsetBottom + elementHeight}px`
          );
        }
        if (Type === "modal") {
          document.documentElement.style.setProperty(
            "--keyboard-translate-sheet-modal",
            `${heightKeyBoard - ElementOffsetBottom + elementHeight}px`
          );
        }
        if (Type === "sheet") {
          document.documentElement.style.setProperty(
            "--keyboard-translate-sheet",
            `${heightKeyBoard - ElementOffsetBottom + elementHeight}px`
          );
        }
      }
    }

    success && success(Event);
  } else {
    success && success(Event);
  }
};

const bodyEventListener = (event) => {
  if (window.PlatformId === "ANDROID") {
    var evt = window.event || event;
    if (!evt.target) evt.target = event.srcElement;
    if (
      (!Dom7(event.target).is("input") && !Dom7(event.target).is("textarea")) ||
      Dom7(event.target).hasClass("no-keyboard")
    ) {
      if (Dom7(event.target).hasClass("input-clear-button")) return;
      if (
        getComputedStyle(document.querySelector("html")).getPropertyValue(
          "--keyboard-translate"
        )
      ) {
        document.documentElement.style.removeProperty("--keyboard-translate");
      }
      if (
        getComputedStyle(document.querySelector("html")).getPropertyValue(
          "--keyboard-translate-sheet-modal"
        )
      ) {
        document.documentElement.style.removeProperty(
          "--keyboard-translate-sheet-modal"
        );
      }
      if (
        getComputedStyle(document.querySelector("html")).getPropertyValue(
          "--keyboard-translate-sheet"
        )
      ) {
        document.documentElement.style.removeProperty(
          "--keyboard-translate-sheet"
        );
      }
    }
  }
};

const forceOutListener = () => {
  if (window.PlatformId === "ANDROID") {
    if (
      getComputedStyle(document.querySelector("html")).getPropertyValue(
        "--keyboard-translate"
      )
    ) {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        document.activeElement.blur();
        document.documentElement.style.removeProperty("--keyboard-translate");
      }
    }
    if (
      getComputedStyle(document.querySelector("html")).getPropertyValue(
        "--keyboard-translate-sheet-modal"
      )
    ) {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        document.activeElement.blur();
        document.documentElement.style.removeProperty(
          "--keyboard-translate-sheet-modal"
        );
      }
    }
  }
};

const KeyboardsHelper = {
  setAndroid,
  bodyEventListener,
  forceOutListener,
};
export default KeyboardsHelper;
