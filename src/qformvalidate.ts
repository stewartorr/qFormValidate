import { patterns, isValidEmail, isValidURL, isValidTel, trim } from "./utils";

// Define an interface for the options
export interface QFVOptions {
  scrollTopOffset?: number; // How much to adjust scroll by
  defaultErrorMsg: string;
  defaultErrorMsgSection: string;
  onSubmit?: () => void;
  onSubmitError?: () => void; // Called on form submit error
  onError?: () => void; // Called on individual field error
  onSuccess?: () => void; // Called if form passes validation
  onAfterValidate?: () => void; // Called after validation
  onBeforeValidate?: () => void; // Called before validation
}

const dateOnly = /[0-9\/\-\.]/; // Date characters only
const digitsOnly = /[0-9]/; // Integers only
const integerOnly = /[0-9\.,]/; // Floats only
const alphaOnly = /[a-z]/i; // Alpha only
const alphaNumericOnly = /[a-z0-9]/i; // Alphanumeric only
const urlOnly = /[a-z0-9\.\-:\/\?=&#]/i; // URL only characters
const emailOnly = /[a-z0-9@_\-\+\.]/i; // Email only characters
const telOnly = /[0-9 /(/)+]/i; // Telephone only characters

type FormFieldElement = | HTMLInputElement| HTMLSelectElement | HTMLTextAreaElement;

type InputTypeRestrictions = "tel" | "email" | "url" | "number";
const typeRestrictions: Record<InputTypeRestrictions, RegExp> = {
  tel: telOnly,
  email: emailOnly,
  url: urlOnly,
  number: integerOnly,
};

/**
 * Validates a form according to QFV rules.
 * @param form - The form element to validate
 * @param options - Optional configuration overrides
 */

export function qFormValidate(form: HTMLFormElement, options?: QFVOptions): void {
  alert("Hello from qFormValidate");
  // Merge default options with user-provided options
  const defaults: QFVOptions = {
    scrollTopOffset: 100,
    defaultErrorMsg: 'Please complete this field.',
    defaultErrorMsgSection: 'Please complete this section.',
    onSubmitError: () => {},
    onError: () => {},
    onSuccess: () => {},
    onAfterValidate: () => {},
    onBeforeValidate: () => {},
    ...options, // overwrite defaults with any provided options
  };

  form.noValidate = true;
  form.addEventListener("clear", () => clearErrors(form));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    return validateForm(form);
  });

  const fields = form.querySelectorAll<FormFieldElement>(
    "input, select, textarea"
  );
  fields.forEach((field) => {
    watchField(field);
  });

  // Example: call onBeforeValidate callback
  // defaults.onBeforeValidate();

  function getErrorMsg(field: FormFieldElement): string {
    if (field.dataset.errorMsg) return field.dataset.errorMsg;
    if (field instanceof HTMLSelectElement) return "Please select an option";
    switch (field.type) {
      case 'tel':
        return "Please enter a valid telephone number";
        break;
      case 'url':
        return "Please enter a valid URL.";
        break;
      case 'email':
        return "Please enter a valid email address.";
        break;
      case 'password':
        return "Please enter a valid password";
        break;
      default:
        return defaults.defaultErrorMsg;
        break;
    }
  }

  function addError(field: FormFieldElement): void {
    const errorMsg = getErrorMsg(field);

    field.classList.add("error");
    field.ariaInvalid = "true";

    const parent = field.closest('div, li, p, label');
    if (parent) {
      parent.classList.add('error');
      parent.querySelector('span.inline-error')?.remove();
      parent.insertAdjacentHTML('beforeend', `<span class="inline-error" id="error_${field.name}" aria-hidden="false" role="alert">${errorMsg}</span>`);
    }
  }

  function removeFieldError(field: FormFieldElement): void {
    field.classList.remove("error");
    field.ariaInvalid = "false";
    field.removeAttribute("aria-describedby");
    const parent = field.closest('div, li, p, label');
    if (parent) {
      parent.classList.remove('error');
      parent.querySelector('span.inline-error')?.remove();
    }
  }

  function watchField(field: FormFieldElement): void {
    // INPUT, TEXTAREA
    if (field instanceof HTMLInputElement) {
      const inputType = field.type as InputTypeRestrictions;
      if (inputType in typeRestrictions) {
        const restriction = typeRestrictions[inputType];
        field.addEventListener("keydown", (event: KeyboardEvent) => restrictCharacters(field, event, restriction)
        );
      }
      // Using the above bind action, watch the form element
      ['blur', 'keyup'].forEach(bind =>
        field.addEventListener(bind, (event) => { field.value = trim(field.value); validateField(field, event) }
      ));
    }
    
    // SELECT
    if (field instanceof HTMLSelectElement) {
      ['blur', 'change'].forEach(bind =>
        field.addEventListener(bind, (event) => { validateField(field, event) }
      ));
    }

  }

  function clearErrors(form: HTMLFormElement): void {
    const fields = form.querySelectorAll<FormFieldElement>(
      "input, select, textarea"
    );
    fields.forEach((field) => removeFieldError(field));
  }

  function restrictCharacters(field: FormFieldElement, event: KeyboardEvent, restrictionType: RegExp) {
    const ignoreKeys = [
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Backspace",
      "Delete",
      "Tab",
      "Insert",
      "Home",
      "End",
      "PageUp",
      "PageDown",
    ];

    // Ignore the usual keys (Some things to consider altKey, ctrlKey, metaKey or shiftKey)
    if (
      (event.key && ignoreKeys.includes(event.key)) || event.ctrlKey || event.metaKey)
      return true;

    // if they pressed esc... remove focus from field...
    if (event.key === "Escape") {
      field.blur();
      return false;
    }

    if (!event.key.match(restrictionType)) {
      event.preventDefault();
      return false;
    }
  }

  function validateField(field: FormFieldElement, event?: Event) {
    const validate = event ? (event.type !== 'keyup' && event.type !== 'change') : true;

    // Only validate on some events so not to show the message too early
    if (validate) {
      // Is it a required field
      if (field.required) {
        // Select
        if (field instanceof HTMLSelectElement) {
          if (field.multiple) {
            const hasSelection = Array.from(field.options).some(opt => opt.selected && opt.value !== "");
            if (!hasSelection) {
              addError(field);
              return true;
            }
          } else {
            const selectedOption = field.options[field.selectedIndex];
            if (!selectedOption || selectedOption.value === "") {
              addError(field);
              return true;
            }
          }
        }

        // Textarea
        if ((field instanceof HTMLTextAreaElement)) {
          if (field.value === "") {
            addError(field);
            return true;
          }
        }
        
        // Input
        if (field instanceof HTMLInputElement && !["checkbox", "radio"].includes(field.type)) {
          if (field.type === 'file') {
            console.log(field.files);
            if (!field.files || field.files.length === 0) {
              addError(field);
              return true;
            }
          } else {
            if (field.value === "") {
              addError(field);
              return true;
            }
          }
        }

        // Checkbox and radio
        if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
          const group = field.form?.querySelectorAll<HTMLInputElement>(`input[name="${field.name}"]`);
          if (group && !Array.from(group).some((el) => el.checked)) {
            addError(field);
            return true;
          }
        }
      }

      if (field instanceof HTMLInputElement) {
        // Is it an email field
        if (field.type == "email" && field.value !== '' && !isValidEmail(field.value)) {
          addError(field);
          return true;
        }

        // Is it a URL field
        if (field.type == "url" && field.value !== '' && !isValidURL(field.value)) {
          addError(field);
          return true;
        }

        // Is it a tel field
        if (field.type === "tel" && field.value !== '' && !isValidTel(field.value)) {
          addError(field);
          return true;
        }

        // Does it have a minimum length
        if (field.dataset.minLength && field.value.length < parseInt(field.dataset.minLength)) {
          addError(field);
          return true;
        }

        // Same as another field
        if (field.dataset.sameAs) {
          const sameAs = field.form?.querySelector<HTMLInputElement>(
            `#${field.dataset.sameAs}`
          );
          if (sameAs && sameAs.value != field.value) {
            addError(field);
            return true;
          }
        }

        // Is it alphaOnly
        if (field.classList.contains("alpha") && !alphaOnly.test(field.value)) {
          addError(field);
          return true;
        }

        // Is it alphaNumericOnly
        if (
          field.classList.contains("alphanumeric") &&
          !alphaNumericOnly.test(field.value)
        ) {
          addError(field);
          return true;
        }
      }

      // Is it a password
      // if ($type == 'password') {
      //     checkStrength($field);
      // }

      // $options.onAfterValidate();
    }

    // No errors, clear any visual messages
    removeFieldError(field);
  }

  function validateForm(form: HTMLFormElement): boolean {
    let hasError = false;
    // Clear errors before starting
    // clearErrors();

    const fields = form.querySelectorAll<FormFieldElement>("input, select, textarea");
    fields.forEach((field) => {
      // $options.onBeforeValidate();
      if (validateField(field)) hasError = true;
      validateField(field);
      // $options.onAfterValidate();
    });
    alert(hasError);
    return !hasError;
  }


}
