import { emailjs } from "./index";

export default async function sendScheduleEmail(data: {
  full_name: string;
  email: string;
  phone: string;
  visit_date: string;
}) {
  const response = await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_SCHEDULE_TEMPLATE_ID,
    data,
  );
  return response;
}
