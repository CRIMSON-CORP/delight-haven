import { emailjs } from "./index";

export default async function sendContactEmail(data: {
  full_name: string;
  email: string;
  message: string;
  form_time: string;
}) {
  const response = await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
    data,
  );
  return response;
}
