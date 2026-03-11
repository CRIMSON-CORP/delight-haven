import { SaveButton, type SaveButtonElement } from "./utils";

let isASaveButton = false;
export default async function contactFormSubmitHandler(form: HTMLFormElement, event: SubmitEvent) {
  const formData = new FormData(form);
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

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
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name,
        email,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send message");
    }

    const { Toast } = await import("./toast");
    Toast.success(data.message);
    submitter.success();
    form.reset();
  } catch (error: any) {
    submitter.error();
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to send message");
  }
}
