import { SaveButton, type SaveButtonElement } from "./utils";
import sendScheduleEmail from "../services/emailjs/sendScheduleEmail";

let isASaveButton = false;
export default async function scheduleDateFormHandler(
  form: HTMLFormElement,
  event: SubmitEvent,
  closeModal: () => void,
) {
  event.preventDefault();
  const formData = new FormData(form);
  const full_name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phoneInput = form.querySelector<HTMLInputElement>("#phone");
  // @ts-ignore
  const phone = phoneInput?._iti ? phoneInput._iti.getNumber() : (formData.get("phone") as string);
  const visit_date = formData.get("visit-date") as string;
  const botField = formData.get("address_zip_code") as string;

  if (botField) {
    // If the honeypot field is filled out, reject the submission silently (so bots don't know they are caught)
    const { Toast } = await import("./toast");
    Toast.success("Your submission has been received.");
    form.reset();
    setTimeout(() => {
      closeModal();
    }, 1000);
    return;
  }

  const submitter = event.submitter as SaveButtonElement | null;
  if (!submitter) return;

  const scheduleDateButtons = [
    ...document.querySelectorAll<HTMLButtonElement>(".schedule-date"),
  ] as SaveButtonElement[];

  scheduleDateButtons.forEach((button) => {
    SaveButton(button);
  });

  if (!isASaveButton) {
    SaveButton(submitter);
    isASaveButton = true;
  }

  if (!full_name || !email || !phone || !visit_date) {
    const { Toast } = await import("./toast");
    Toast.error("Please fill in all fields.");
    return;
  }

  try {
    submitter.loading();
    scheduleDateButtons.forEach((button) => button.loading());
    await sendScheduleEmail({
      full_name,
      email,
      phone,
      visit_date,
    });

    const { Toast } = await import("./toast");
    Toast.success(
      `Thank you, ${full_name}! Your visit is scheduled for ${new Date(visit_date).toLocaleDateString("en-US", { dateStyle: "long" })}. We'll be in touch shortly.`,
    );
    submitter.success(true);
    scheduleDateButtons.forEach((button) => button.success(true));
    form.reset();
    setTimeout(() => {
      closeModal();
    }, 1000);
  } catch (error: any) {
    submitter.error();
    console.log(error);
    scheduleDateButtons.forEach((button) => button.error());
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to schedule date");
  }
}
