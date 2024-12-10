import { URL_PATHS } from './constant';

/* eslint-disable */
if (window.location.pathname.includes(URL_PATHS.contact)) {
  const form = document.getElementById("contact-form");
  const thankYouMessage = document.querySelector(".thankyou_message");
  const errorMessages = {
    name: "Name is required.",
    email: "Please provide a valid email address.",
    message: "Message cannot be empty.",
  };

  const validateForm = () => {
    let isValid = true;

    const nameInput = document.getElementById("name");
    const nameError = document.getElementById("name-error");
    if (!nameInput.value.trim()) {
      nameError.textContent = errorMessages.name;
      nameError.style.display = "block";
      isValid = false;
    } else {
      nameError.style.display = "none";
    }

    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("email-error");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      emailError.textContent = errorMessages.email;
      emailError.style.display = "block";
      isValid = false;
    } else {
      emailError.style.display = "none";
    }

    const messageInput = document.getElementById("message");
    const messageError = document.getElementById("message-error");
    if (!messageInput.value.trim()) {
      messageError.textContent = errorMessages.message;
      messageError.style.display = "block";
      isValid = false;
    } else {
      messageError.style.display = "none";
    }

    return isValid;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Honeypot field validation
    const honeypot = document.getElementById("honeypot").value;
    if (honeypot) {
      console.warn("Spam bot detected.");
      return;
    }

    const formData = new FormData(form);

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbyH7yUEvdTDG9cZIxgkbW9keqt4U1-OXhC22KIpowMz8sZeUM2-fsrqlaqMxWQikrom/exec", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        form.reset();
        form.style.display = "none";
        thankYouMessage.style.display = "flex";
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Error: Unable to send your message. Please try again.");
    }
  });
  
}
/* eslint-enable */
