import sendContactEmail from "../services/emailjs/sendContactEmail";
import { SaveButton, type SaveButtonElement } from "./utils";

let isASaveButton = false;
export default async function contactFormSubmitHandler(form: HTMLFormElement, event: SubmitEvent) {
  event.preventDefault();
  const formData = new FormData(form);
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  const botField = formData.get("address_zip_code") as string;
  const form_time = formData.get("form_time") as string;

  if (botField) {
    const { Toast } = await import("./toast");
    Toast.success("Your message has been sent successfully.", { duration: 5000 });
    form.reset();
    return;
  }

  const submitter = event.submitter as SaveButtonElement | null;
  if (!submitter) return;

  if (!isASaveButton) {
    SaveButton(submitter);
    isASaveButton = true;
  }

  if (!full_name || !email || !message) {
    submitter.error();
    const { Toast } = await import("./toast");
    Toast.error("Please fill in all fields.");
    return;
  }

  try {
    submitter.loading();
    await sendContactEmail({
      full_name,
      email,
      message,
      form_time: form_time || new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
    });

    const { Toast } = await import("./toast");
    Toast.success("Your message has been sent successfully.", { duration: 5000 });
    submitter.success();
    form.reset();
  } catch (error: any) {
    console.log(error);
    submitter.error();
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to send message", { duration: 5000 });
  }
}
