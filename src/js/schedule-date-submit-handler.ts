import { SaveButton, type SaveButtonElement } from "./utils";

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
  const phone = formData.get("phone") as string;
  const visit_date = formData.get("visit-date") as string;

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
    const response = await fetch("/api/schedule-date", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name,
        email,
        phone,
        visit_date,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to schedule date");
    }

    const { Toast } = await import("./toast");
    Toast.success(data.message);
    submitter.success(true);
    scheduleDateButtons.forEach((button) => button.success(true));
    form.reset();
    setTimeout(() => {
      closeModal();
    }, 1000);
  } catch (error: any) {
    submitter.error();
    scheduleDateButtons.forEach((button) => button.error());
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to schedule date");
  }
}
