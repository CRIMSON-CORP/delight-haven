import emailjs from "@emailjs/browser";

emailjs.init({
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
});

export { emailjs };
