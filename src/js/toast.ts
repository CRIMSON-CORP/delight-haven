import { nanoid } from "nanoid/non-secure";
import { makeIconFromPath } from "./utils";
import "../toast.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The visual variant of a toast notification. */
export type ToastType = "success" | "error" | "info" | "warning" | "loading";

/** Internal record stored in the toast map for each active notification. */
export interface ToastMapItem {
  id: string;
  element: HTMLElement;
  type: ToastType;
  clearTimeout?: ReturnType<typeof setTimeout>;
}

/** Options accepted by the public `Toast.show*` helpers. */
export interface ToastOptions {
  type?: ToastType;
  /** Auto-dismiss duration in ms. Defaults to word-count-based heuristic. */
  duration?: number;
}

/** Options for `Toast.promise`. */
export interface PromiseToastOptions<T> {
  /** Function that returns the promise to track. */
  promise: () => Promise<T>;
  /** Message shown while the promise is pending. */
  loading: string;
  /** Message (or factory) shown on resolution. */
  success?: string | ((result?: T) => string | undefined);
  /** Message (or factory) shown on rejection. */
  error?: string | ((err?: Error) => string | undefined);
  /** How long (ms) the final success/error toast stays visible. */
  duration?: number;
}

/** Parameters accepted by the internal `createElem` helper. */
interface CreateElemParams<K extends keyof HTMLElementTagNameMap = "div"> {
  tag: K;
  classNames?: string;
  text?: string;
  attributes?: Record<string, string>;
  styles?: Partial<CSSStyleDeclaration>;
  append?: HTMLElement | SVGSVGElement;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const springEasing = `linear(
     0, 0.01, 0.04 1.8%, 0.161 3.7%, 0.81 10.6%, 1.038 13.5%, 1.12, 1.181, 1.223,
    1.247 19.3%, 1.253, 1.253, 1.246, 1.232 23.2%, 1.19 25.4%, 1.058 30.8%,
    1.001 33.5%, 0.958 36.5%, 0.945, 0.938 39.6%, 0.936 41.6%, 0.941 43.8%,
    0.999 53.9%, 1.01 56.7%, 1.015 59.7% 64.3%, 1.001 74.2%, 0.996 79.6%, 1.001
  )`;

const SVG_PATHS: Record<string, string> = {
  dynamic:
    "M9.59366 22.7327C11.9934 23.2707 14.5042 22.989 16.7251 21.9326C18.9459 20.8762 20.7487 19.106 21.8455 16.9048C22.9423 14.7036 23.2698 12.1984 22.7757 9.78918C22.2817 7.38002 20.9945 5.2059 19.1198 3.6141C17.2452 2.0223 14.8912 1.10462 12.4338 1.00765C9.97635 0.910681 7.55734 1.64001 5.56307 3.07914C3.5688 4.51827 2.11432 6.5842 1.43194 8.94694C0.749557 11.3097 0.878636 13.833 1.79856 16.1137L9.59366 21L20.5 4.00001L3.99999 4.00001L20.5 20.5L3.99999 20.5L20 4",
  warning:
    "M12 9V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z",
  info: "M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z",
};

/** Keyframe properties used to animate the icon path when a toast transitions state. */
const basicToastIconsConfig: Record<
  ToastType,
  { strokeDashoffset: string; strokeDasharray: string }
> = {
  success: { strokeDashoffset: "-60", strokeDasharray: "27 1500" },
  loading: { strokeDashoffset: "2", strokeDasharray: "60 1500" },
  error: { strokeDashoffset: "-105", strokeDasharray: "22.1 17.7 105.3" },
  warning: { strokeDashoffset: "0", strokeDasharray: "0" },
  info: { strokeDashoffset: "0", strokeDasharray: "0" },
};

const animationConfig: KeyframeAnimationOptions = {
  easing: "cubic-bezier(.24,.67,.08,.99)",
  duration: 700,
  fill: "forwards",
};

// ---------------------------------------------------------------------------
// Internal DOM helper
// ---------------------------------------------------------------------------

/**
 * Creates a typed HTML element from a parameter object.
 * Separate from the `createElem` in utils.ts — this variant accepts an object
 * with optional styles and a child to append, making it cleaner for toast DOM construction.
 */
function createElem<K extends keyof HTMLElementTagNameMap = "div">(
  params: CreateElemParams<K>,
): HTMLElementTagNameMap[K] {
  const { tag, classNames, text, attributes, styles, append } = params;
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
  if (styles) {
    Object.entries(styles).forEach(([prop, value]) => {
      elem.style.setProperty(prop, value as string);
    });
  }
  if (append) {
    elem.append(append);
  }

  return elem;
}

// ---------------------------------------------------------------------------
// Toast class
// ---------------------------------------------------------------------------

export class Toast {
  static #instance: Toast | null = null;

  /** The fixed container appended to <body> that holds all toast wrappers. */
  readonly #container: HTMLElement;

  /** The coloured blob behind the toast stack; swapped on type change. */
  #currentUnderlay: HTMLElement | null = null;

  /** Live map of active toasts keyed by their nanoid. */
  #toasts = new Map<string, ToastMapItem>();

  // Stored for potential future use (not yet exposed publicly).
  readonly #defaultDuration = 5000;

  // Private — use the static factory methods instead.
  private constructor() {
    this.#container = createElem({ tag: "div", classNames: "toast-container" });
    document.body.appendChild(this.#container);
  }

  // -------------------------------------------------------------------------
  // Singleton
  // -------------------------------------------------------------------------

  private static getInstance(): Toast {
    if (!Toast.#instance) {
      Toast.#instance = new Toast();
    }
    return Toast.#instance;
  }

  // -------------------------------------------------------------------------
  // Public static API
  // -------------------------------------------------------------------------

  /**
   * Shows a toast with an explicit type.
   * @returns The nanoid string that identifies this toast (pass to `Toast.remove`).
   */
  static show(message: string, options: ToastOptions, fromPromise = false): string {
    return Toast.getInstance().#createToast(message, options, fromPromise);
  }

  /** Shows a success toast. Returns the toast id. */
  static success(
    message: string,
    options: Omit<ToastOptions, "type"> = {},
    fromPromise = false,
  ): string {
    return Toast.show(message, { ...options, type: "success" }, fromPromise);
  }

  /** Shows an error toast. Returns the toast id. */
  static error(
    message: string,
    options: Omit<ToastOptions, "type"> = {},
    fromPromise = false,
  ): string {
    return Toast.show(message, { ...options, type: "error" }, fromPromise);
  }

  /** Shows a warning toast. Returns the toast id. */
  static warning(
    message: string,
    options: Omit<ToastOptions, "type"> = {},
    fromPromise = false,
  ): string {
    return Toast.show(message, { ...options, type: "warning" }, fromPromise);
  }

  /** Shows an info toast. Returns the toast id. */
  static info(
    message: string,
    options: Omit<ToastOptions, "type"> = {},
    fromPromise = false,
  ): string {
    return Toast.show(message, { ...options, type: "info" }, fromPromise);
  }

  /** Shows a persistent loading toast. Returns the toast id. */
  static loading(
    message: string,
    options: Omit<ToastOptions, "type"> = {},
    fromPromise = false,
  ): string {
    return Toast.show(message, { ...options, type: "loading" }, fromPromise);
  }

  /**
   * Tracks a promise, showing loading → success/error transitions automatically.
   * Re-throws the rejection so callers can still handle it.
   */
  static async promise<T>({
    promise,
    loading,
    success,
    error,
    duration,
  }: PromiseToastOptions<T>): Promise<T | void> {
    const toastId = Toast.loading(loading, undefined, true);
    const toast = Toast.getInstance().#toasts.get(toastId);
    if (!toast) return;

    try {
      const result = await promise();
      Toast.getInstance().#transitionToast(
        toast,
        "success",
        typeof success === "function" ? success(result) : success,
      );
      if (toast.clearTimeout) clearTimeout(toast.clearTimeout);
      toast.clearTimeout = setTimeout(() => Toast.remove(toastId), duration ?? 5000);
      return result;
    } catch (err) {
      if (err instanceof Error) {
        Toast.getInstance().#transitionToast(
          toast,
          "error",
          typeof error === "function" ? error(err) : error,
        );
      }
      if (toast.clearTimeout) clearTimeout(toast.clearTimeout);
      toast.clearTimeout = setTimeout(() => Toast.remove(toastId), duration ?? 5000);
      throw err;
    }
  }

  /** Removes a single toast by id. */
  static remove(id: string): void {
    Toast.getInstance().#removeToast(id);
  }

  /** Removes every active toast. */
  static removeAll(): void {
    const instance = Toast.getInstance();
    instance.#toasts.forEach((_, id) => instance.#removeToast(id));
  }

  /**
   * Transitions an existing toast (by id) to a new type and message.
   * Useful for updating a loading toast to success/error without removing it first.
   */
  static transitionTo(toastId: string, newType: ToastType, newMessage: string): void {
    const toast = Toast.getInstance().#toasts.get(toastId);
    if (!toast) return;
    Toast.getInstance().#transitionToast(toast, newType, newMessage);
  }

  // -------------------------------------------------------------------------
  // Private instance methods
  // -------------------------------------------------------------------------

  /** Creates the coloured underlay blob for a given toast type. */
  #createToastUnderlay(type: ToastType): HTMLElement {
    return createElem({ tag: "div", classNames: `toast-underlay ${type}` });
  }

  /** Full toast construction — returns the new toast's id. */
  #createToast(message: string, options: ToastOptions = {}, fromPromise = false): string {
    const { type = "info" } = options;

    this.#swapUnderlay(type);

    const id = nanoid(5);

    const toastEl = createElem({
      tag: "div",
      classNames: `toast toast-${type}`,
      attributes: { "data-id": id },
    });

    const toastUnderlay = createElem({ tag: "div", classNames: "toast-underlay" });
    const toastContentWrapper = createElem({ tag: "div", classNames: "toast-content-wrapper" });
    const icon = this.#createIconElement(type);
    const content = createElem({ tag: "div", classNames: "toast-content" });
    const messageElement = createElem({ tag: "p", text: message, classNames: "toast-message" });
    const closeButton = createElem({
      tag: "button",
      classNames: "toast-close clickable",
      attributes: { "aria-label": "Close toast" },
      append: makeIconFromPath("close", 16, "0 0 24 24"),
    });

    content.append(messageElement);
    toastContentWrapper.append(icon, content, closeButton);
    toastEl.append(toastUnderlay, toastContentWrapper);

    const toastWrapper = createElem({ tag: "div" });
    toastEl.style.opacity = "0";
    toastWrapper.style.height = "0px";
    toastWrapper.append(toastEl);
    this.#container.prepend(toastWrapper);

    toastWrapper.animate(
      { height: toastWrapper.scrollHeight + "px", marginBottom: "16px" },
      { easing: springEasing, duration: 1500, fill: "forwards" },
    );

    if (!fromPromise && type !== "loading") {
      const duration = options.duration ?? message.split(" ").length * 300 + 1000;
      setTimeout(() => this.#removeToast(id), duration);
    }

    this.#toasts.set(id, { element: toastWrapper, type, id });

    this.#animateToastIn(toastEl);

    closeButton.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      this.#removeToast(id);
    };

    return id;
  }

  /** Swaps the coloured background blob, animating in/out as appropriate. */
  #swapUnderlay(type: ToastType): void {
    const newUnderlay = this.#createToastUnderlay(type);
    newUnderlay.style.opacity = "0";
    newUnderlay.style.transform = "translate3d(0, -50%, 0) scale3d(0.5, 0.5, 1)";
    this.#container.appendChild(newUnderlay);

    const animateOut = (element: HTMLElement): void => {
      element.animate({ opacity: ["1", "0"] }, animationConfig).onfinish = () => element.remove();
    };

    const animateIn = (element: HTMLElement, hasExisting: boolean): Animation => {
      if (hasExisting) {
        newUnderlay.style.opacity = "0";
        newUnderlay.style.transform = "translate3d(0, -50%, 0)";
        return element.animate({ opacity: ["0", "1"] }, animationConfig);
      }
      return element.animate(
        {
          opacity: ["0", "1"],
          transform: [
            "translate3d(0, -50%, 0) scale3d(0.5, 0.5, 1)",
            "translate3d(0, -50%, 0) scale3d(1, 1, 1)",
          ],
        },
        animationConfig,
      );
    };

    const hasExisting = !!this.#currentUnderlay;
    if (this.#currentUnderlay) animateOut(this.#currentUnderlay);
    animateIn(newUnderlay, hasExisting);
    this.#currentUnderlay = newUnderlay;
  }

  /**
   * Builds the SVG icon wrapper for a toast.
   * @param type - Toast variant.
   * @param size - Icon size in px (default 20).
   */
  #createIconElement(type: ToastType, size = 20): HTMLElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "3");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    if (type === "loading" || type === "success" || type === "error") {
      path.setAttribute("d", SVG_PATHS.dynamic);
      path.setAttribute("stroke-dasharray", basicToastIconsConfig[type].strokeDasharray);
      path.setAttribute("stroke-dashoffset", basicToastIconsConfig[type].strokeDashoffset);
    } else {
      path.setAttribute("d", SVG_PATHS[type]);
    }

    svg.appendChild(path);

    const iconWrapper = createElem({ tag: "div", classNames: "icon-wrapper" });
    iconWrapper.appendChild(svg);

    if (type === "loading") {
      svg.animate(
        { transform: "rotate(360deg)" },
        { easing: "linear", duration: 1000, iterations: Infinity },
      );
    }
    if (type === "success") {
      svg.style.transform = "rotate(10deg)";
    }

    return iconWrapper;
  }

  /** Spring-based entry animation applied to a freshly created toast element. */
  #animateToastIn(toast: HTMLElement): void {
    toast.style.scale = "0.5";

    toast.animate(
      { opacity: ["0", "1"] },
      { fill: "forwards", duration: 1800, easing: springEasing },
    );

    toast.animate(
      { translate: ["0 -100%", "0 0%"] },
      { fill: "forwards", duration: 1800, easing: springEasing },
    );

    toast.animate(
      { scale: ["0.5", "1"] },
      { delay: 100, duration: 2000, fill: "forwards", easing: springEasing },
    );
  }

  /**
   * Transitions an existing toast to a new type, smoothly animating the message
   * swap and icon morph.
   */
  #transitionToast(toast: ToastMapItem, newType: ToastType, newMessage = "Toast message"): void {
    const messageElement = toast.element.querySelector<HTMLElement>(".toast-message");
    const iconElement = toast.element.querySelector<SVGSVGElement>("svg");
    const iconElementPath = toast.element.querySelector<SVGPathElement>("svg path");
    const toastElement = toast.element.firstElementChild as HTMLElement | null;

    // ---------- message swap ----------
    if (messageElement && toastElement) {
      const initialHeight = toastElement.offsetHeight;
      const initialWidth = toastElement.offsetWidth;

      (toastElement as HTMLElement).style.width = initialWidth + "px";
      (toastElement as HTMLElement).style.height = initialHeight + "px";
      (toastElement as HTMLElement).style.overflow = "hidden";

      const newMessageElement = createElem({
        tag: "p",
        classNames: "toast-message",
        text: newMessage,
      });
      newMessageElement.style.opacity = "0";
      newMessageElement.style.transform = "translate3d(0, 100%, 0)";

      messageElement.animate(
        {
          transform: ["translate3d(0, 0, 0)", "translate3d(0, -50px, 0)"],
          opacity: ["1", "0"],
        },
        { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      ).onfinish = () => {
        messageElement.replaceWith(newMessageElement);

        (toastElement as HTMLElement).style.height = "auto";
        (toastElement as HTMLElement).style.width = "auto";
        newMessageElement.style.overflow = "visible";
        newMessageElement.style.whiteSpace = "normal";

        const newHeight = (toastElement as HTMLElement).offsetHeight;
        const newWidth = (toastElement as HTMLElement).offsetWidth;

        newMessageElement.style.minWidth = newMessageElement.offsetWidth + "px";
        newMessageElement.style.width = newMessageElement.offsetWidth + "px";

        (toastElement as HTMLElement).style.height = initialHeight + "px";
        (toastElement as HTMLElement).style.width = initialWidth + "px";

        // Trigger reflow so the browser registers the locked starting values
        void (toastElement as HTMLElement).offsetHeight;

        const heightAnim = (toastElement as HTMLElement).animate(
          { height: [initialHeight + "px", newHeight + "px"] },
          { duration: 600, easing: "cubic-bezier(.23,.02,0,.97)", fill: "forwards" },
        );

        const widthAnim = (toastElement as HTMLElement).animate(
          { width: [initialWidth + "px", newWidth + "px"] },
          { duration: 800, easing: "cubic-bezier(.23,.02,0,.97)", fill: "forwards" },
        );

        newMessageElement.animate(
          {
            transform: ["translate3d(0, 50px, 0)", "translate3d(0, 0, 0)"],
            opacity: ["0", "1"],
          },
          { duration: 500, delay: 100, easing: "cubic-bezier(.23,.02,0,.97)", fill: "forwards" },
        );

        Promise.all([heightAnim.finished, widthAnim.finished]).then(() => {
          (toastElement as HTMLElement).style.height = "auto";
          (toastElement as HTMLElement).style.width = "auto";
          (toastElement as HTMLElement).style.overflow = "";
          newMessageElement.style.minWidth = "";
          newMessageElement.style.width = "";
        });
      };
    }

    // ---------- icon state ----------
    if (newType === "success" || newType === "error") {
      const [existingAnim] = iconElement?.getAnimations() ?? [];
      if (existingAnim) {
        existingAnim.commitStyles();
        existingAnim.cancel();
      }
      iconElement?.animate(
        { transform: newType === "success" ? "rotate(10deg)" : "rotate(0deg)" },
        { duration: 300, easing: "ease-out", iterations: 1, fill: "forwards" },
      );
    }

    if (newType === "loading" || newType === "success" || newType === "error") {
      iconElementPath?.animate(basicToastIconsConfig[newType], {
        duration: 1500,
        easing: "cubic-bezier(.46,.01,.01,.98)",
        fill: "forwards",
      });
    } else {
      iconElementPath?.setAttribute("d", SVG_PATHS[newType]);
    }

    // ---------- underlay swap if this is the topmost toast ----------
    const toastsArray = [...this.#toasts.values()];
    const isLast =
      toastsArray.findIndex((t) => t.element === toast.element) === toastsArray.length - 1;

    if (isLast) this.#swapUnderlay(newType);

    if (toast.element.firstElementChild) {
      toast.element.firstElementChild.className = `toast toast-${newType}`;
    }

    // ---------- reset auto-dismiss ----------
    if (toast.clearTimeout) clearTimeout(toast.clearTimeout);
    toast.clearTimeout = setTimeout(() => this.#removeToast(toast.id), this.#defaultDuration);
  }

  /** Animates a toast out and removes it from the DOM and the internal map. */
  #removeToast(id: string): void {
    const toast = this.#toasts.get(id);
    if (!toast) return;

    this.#toasts.delete(id);

    if (this.#toasts.size === 0 && this.#currentUnderlay) {
      this.#currentUnderlay.animate(
        {
          opacity: 0,
          transform: "translate3d(0, -50%, 0) scale3d(0.5, 0.5, 1)",
        },
        animationConfig,
      ).onfinish = () => this.#currentUnderlay?.remove();
    }

    toast.element.animate(
      {
        height: [toast.element.offsetHeight + "px", "0px"],
        transform: [
          "translate3d(0, 0, 0) scale3d(1,1,1)",
          "translate3d(0, -100%, 0) scale3d(0.5,0.5,1)",
        ],
        opacity: [1, 0],
        marginBottom: ["16px", "0px"],
      },
      { duration: 300, easing: "ease" },
    ).onfinish = () => toast.element.remove();
  }
}
