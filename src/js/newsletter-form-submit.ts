import { SaveButton, type SaveButtonElement } from "./utils";

let isASaveButton = false;

export default async function newsletterFormSubmitter(form: HTMLFormElement, event: SubmitEvent) {
  event.preventDefault();
  const formData = new FormData(form);
  const email = formData.get("email") as string;

  const submitter = event.submitter as SaveButtonElement | null;

  if (!submitter) return;

  if (!isASaveButton) {
    SaveButton(submitter);
    isASaveButton = true;
  }

  if (!email) {
    const { Toast } = await import("./toast");
    Toast.error("Please add an email.");
    return;
  }

  try {
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to sign up for newsletter");
    }

    const { Toast } = await import("./toast");
    Toast.success(data.message);
    submitter.success();
    form.reset();
  } catch (error: any) {
    submitter.error();
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to sign up for newsletter");
  }
}
