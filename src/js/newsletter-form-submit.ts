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
    submitter.loading();
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { Toast } = await import("./toast");
    Toast.success("Successfully signed up for the newsletter!");
    submitter.success();
    form.reset();
  } catch (error: any) {
    submitter.error();
    const { Toast } = await import("./toast");
    Toast.error(error.message || "Failed to sign up for newsletter");
  }
}
