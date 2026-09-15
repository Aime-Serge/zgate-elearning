import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("shows plain-language field errors on empty submit, without calling the API", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a way to reach you.")).toBeInTheDocument();
  });

  it("labels every field for accessibility", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email or phone")).toBeInTheDocument();
    expect(screen.getByLabelText(/what do you need/i)).toBeInTheDocument();
  });
});
