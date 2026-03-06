export const makeIconFromPath = (
  name: string,
  size: number | { width: number; height: number } = 24,
  viewBox: string = "0 0 24 24",
) => {
  if (!name) throw new Error("Please add name to use makeIconFromPath");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (typeof size === "number") {
    svg.setAttribute("width", size.toString());
    svg.setAttribute("height", size.toString());
  } else if (typeof size === "object") {
    svg.setAttribute("width", size.width.toString());
    svg.setAttribute("height", size.height.toString());
  }
  if (viewBox) {
    svg.setAttribute("viewBox", viewBox);
  }
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `/icons.svg#${name}`);
  svg.appendChild(use);
  return svg;
};

export function createElem(
  tag: keyof HTMLElementTagNameMap,
  classNames?: string,
  text?: string,
  attributes?: { [s: string]: string } | ArrayLike<string>,
) {
  if (!tag) throw new Error("Tag name is required to use createElem!");

  const elem = document.createElement(tag);
  if (classNames) {
    elem.classList.add(...classNames.trim().split(" "));
  }
  if (text) {
    elem.innerHTML = text;
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      elem.setAttribute(key, value);
    });
  }
  return elem;
}
export type SaveButtonElement = HTMLButtonElement & {
  success: (holdState?: boolean) => void;
  error: (holdState?: boolean) => void;
  idle: () => void;
  loading: () => void;
};

export function SaveButton(button: SaveButtonElement) {
  const contentWrapper = createElem("span");
  contentWrapper.append(...button.childNodes);
  button.append(contentWrapper);

  button.style.overflow = "hidden";
  button.style.position = "relative";

  const buttonSuccessEvent = new CustomEvent("button-success", {
    detail: button,
  });
  const buttonErrorEvent = new CustomEvent("button-error", {
    detail: button,
  });

  const animationConfig: KeyframeAnimationOptions = {
    easing: "cubic-bezier(0.17, 0.67, 0.16, 0.99)",
    duration: 700,
    fill: "forwards",
  };

  function hideIdle() {
    contentWrapper.animate({ opacity: "0", transform: "scale(0.7)" }, animationConfig);
  }

  function showIdle() {
    contentWrapper.animate(
      { opacity: "1", transform: "scale(1)" },
      { ...animationConfig, delay: 300 },
    );
  }

  function absoluteCenterElement(element: HTMLElement | SVGElement) {
    element.style.position = "absolute";
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.height = "60%";
    element.style.width = "auto";
    element.style.transform = "translate(-50%, 100%) scale(0.5)";
    return element;
  }

  function createLoading() {
    const wrapper = createElem("div");
    const spinner = document.createElement("div");
    spinner.style.aspectRatio = "1/1";
    spinner.style.height = "60%";
    spinner.style.borderRadius = "50%";
    spinner.style.border = "0.2em solid white";
    spinner.style.borderTopColor = "transparent";

    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";

    spinner.animate(
      {
        transform: "rotate(360deg)",
      },
      { ...animationConfig, iterations: Infinity, easing: "linear" },
    );
    wrapper.appendChild(spinner);
    absoluteCenterElement(wrapper);
    return wrapper;
  }

  function createSuccess() {
    const successElem = absoluteCenterElement(makeIconFromPath("button-success", 24, "0 0 24 24"));
    successElem.style.height = "60%";
    return successElem;
  }

  function createError() {
    const errorElem = absoluteCenterElement(makeIconFromPath("button-error", 24, "0 0 20 20"));

    errorElem.style.height = "35%";
    return errorElem;
  }

  function createProgressbar() {
    const progress = createElem("div");
    progress.style.height = "100%";
    progress.style.width = "0px";
    progress.style.position = "absolute";
    progress.style.top = "0px";
    progress.style.left = "0px";
    progress.style.transform = "none";
    progress.style.zIndex = "-3";
    progress.style.backgroundColor = "white";
    progress.style.opacity = "0.3";
    progress.style.mixBlendMode = "plus-lighter";
    return progress;
  }

  function showIcon(icon: HTMLElement | SVGElement) {
    if (button.contains(icon)) return;
    button.appendChild(icon);
    icon.animate(
      {
        opacity: "1",
        transform: "translate(-50%, -50%) scale(1)",
      },
      animationConfig,
    );
  }

  function hideIcon(icon: HTMLElement | SVGElement) {
    if (!button.contains(icon)) return;
    const animation = icon.animate(
      {
        opacity: "0",
        transform: "translate(-50%, 150%) scale(0.5)",
      },
      animationConfig,
    );

    animation.onfinish = () => icon.remove();
  }

  async function hideProgressbar() {
    if (!button.contains(progressBar)) return;
    await progressBar.animate(
      {
        opacity: "0",
      },
      animationConfig,
    ).finished;

    await progressBar.animate({
      backgroundColor: "black",
      width: "0%",
    }).finished;

    progressBar.remove();
  }

  const loading = createLoading();
  const success = createSuccess();
  const error = createError();
  const progressBar = createProgressbar();

  function resetToIdle() {
    setTimeout(() => {
      showIdle();
      hideIcon(success);
      hideIcon(loading);
      hideIcon(error);
      hideProgressbar();
      button.disabled = false;
    }, 2000);
  }

  button.idle = () => {
    showIdle();
    hideIcon(success);
    hideIcon(loading);
    hideIcon(error);
    hideProgressbar();
    button.disabled = false;
  };

  button.loading = () => {
    hideIdle();
    showIcon(loading);
    hideIcon(success);
    hideIcon(error);
    button.disabled = true;
  };

  button.success = (holdState?: boolean) => {
    hideIdle();
    showIcon(success);
    hideIcon(loading);
    hideIcon(error);
    button.disabled = true;
    window.dispatchEvent(buttonSuccessEvent);

    if (!holdState) resetToIdle();
  };

  button.error = (holdState?: boolean) => {
    hideIdle();
    showIcon(error);
    hideIcon(loading);
    hideIcon(success);
    button.disabled = true;

    window.dispatchEvent(buttonErrorEvent);
    if (!holdState) resetToIdle();
  };
}
