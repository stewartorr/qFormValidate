import { patterns, isValidEmail, isValidURL, isValidTel, trim } from './utils.js';

// Define an interface for the options
export interface QFVOptions {
  scrollTopOffset?: number;
  defaultErrorMsg: string;
  defaultErrorMsgSection: string;
  onSubmitError?: () => void;
  onSubmitSuccess?: () => void;
  onFieldError?: (field: FormFieldElement, errorMsg: string) => void;
  onFieldSuccess?: (field: FormFieldElement) => void;
  onAfterValidate?: () => void;
  onBeforeValidate?: () => void;
}

type FormFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type InputTypeRestrictions = 'tel' | 'email' | 'url' | 'number';
const typeRestrictions: Record<InputTypeRestrictions, RegExp> = {
  tel: patterns.telOnly,
  email: patterns.emailOnly,
  url: patterns.urlOnly,
  number: patterns.floatOnly,
};

/**
 * Validates a form according to QFV rules.
 * @param form - The form element to validate
 * @param options - Optional configuration overrides
 */

export function qFormValidate(form: HTMLFormElement, options?: QFVOptions): void {
  // Merge default options with user-provided options
  const defaults: QFVOptions = {
    scrollTopOffset: 100,
    defaultErrorMsg: 'Please complete this field.',
    defaultErrorMsgSection: 'Please complete this section.',
    onSubmitError: () => {},
    onSubmitSuccess: () => {},
    onFieldError: (field, errorMsg) => {},
    onFieldSuccess: (field) => {},
    onAfterValidate: () => {},
    onBeforeValidate: () => {},
    ...options, // overwrite defaults with any provided options
  };

  form.noValidate = true;
  form.addEventListener('clear', () => clearErrors(form));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    return validateForm(form);
  });

  const fields = form.querySelectorAll<FormFieldElement>('input, select, textarea');
  fields.forEach((field) => {
    watchField(field);
  });

  
  /**
   * Description placeholder
   *
   * @param {FormFieldElement} field 
   * @returns {string} 
   */

  function getErrorMsg(field: FormFieldElement): string {
    if (field.dataset.errorMsg) return field.dataset.errorMsg;
    if (field instanceof HTMLSelectElement) return 'Please select an option';
    switch (field.type) {
      case 'tel':
        return 'Please enter a valid telephone number';
      case 'url':
        return 'Please enter a valid URL.';
      case 'email':
        return 'Please enter a valid email address.';
      case 'password':
        return 'Please enter a valid password';
      default:
        return defaults.defaultErrorMsg;
    }
  }

  function addError(field: FormFieldElement): void {
    const errorMsg = getErrorMsg(field);
    const parent = field.closest('div, li, p, label');
    const fieldId = field.id ? `error-${field.id}` : `error-${crypto.randomUUID()}`;


    defaults.onFieldError?.(field, errorMsg);

    field.classList.add('error');
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby', fieldId);

    if (parent) {
      parent.classList.add('error');
      parent.querySelector('span.inline-error')?.remove();
      parent.insertAdjacentHTML(
        'beforeend',
        `<span class="inline-error" id="${fieldId}" aria-hidden="false" role="alert">${errorMsg}</span>`,
      );
    }
  }

  function removeFieldError(field: FormFieldElement): void {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');

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
        field.addEventListener('keydown', (event: KeyboardEvent) =>
          restrictCharacters(field, event, restriction),
        );
      }
      // Using the above bind action, watch the form element
      ['blur', 'keyup'].forEach((bind) =>
        field.addEventListener(bind, (event) => {
          if (event.type === 'blur') {
            field.value = trim(field.value);
          }
          validateField(field, event);
        }),
      );
    }

    // SELECT
    if (field instanceof HTMLSelectElement) {
      ['blur', 'change'].forEach((bind) =>
        field.addEventListener(bind, (event) => {
          validateField(field, event);
        }),
      );
    }
  }

  function clearErrors(form: HTMLFormElement): void {
    const fields = form.querySelectorAll<FormFieldElement>('input, select, textarea');
    fields.forEach((field) => removeFieldError(field));
  }

  function restrictCharacters(
    field: FormFieldElement,
    event: KeyboardEvent,
    restrictionType: RegExp,
  ) {
    const ignoreKeys = [
      'ArrowRight',
      'ArrowLeft',
      'ArrowUp',
      'ArrowDown',
      'Backspace',
      'Delete',
      'Tab',
      'Insert',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ];

    // Ignore the usual keys (Some things to consider altKey, ctrlKey, metaKey or shiftKey)
    if ((event.key && ignoreKeys.includes(event.key)) || event.ctrlKey || event.metaKey)
      return true;

    // if they pressed esc... remove focus from field...
    if (event.key === 'Escape') {
      field.blur();
      return false;
    }

    if (!event.key.match(restrictionType)) {
      event.preventDefault();
      return false;
    }
  }

  function validateField(field: FormFieldElement, event?: Event) {
    const validate = event ? event.type !== 'keyup' : true;

    // Only validate on some events so not to show the message too early
    if (validate) {
      // Is it a required field
      if (field.required) {
        // Select
        if (field instanceof HTMLSelectElement) {
          if (field.multiple) {
            const hasSelection = Array.from(field.options).some(
              (opt) => opt.selected && opt.value !== '',
            );
            if (!hasSelection) {
              addError(field);
              return true;
            }
          } else {
            const selectedOption = field.options[field.selectedIndex];
            if (!selectedOption || selectedOption.value === '') {
              addError(field);
              return true;
            }
          }
        }

        // Textarea
        if (field instanceof HTMLTextAreaElement) {
          if (field.value === '') {
            addError(field);
            return true;
          }
        }

        // Input
        if (field instanceof HTMLInputElement && !['checkbox', 'radio'].includes(field.type)) {
          if (field.type === 'file') {
            if (!field.files || field.files.length === 0) {
              addError(field);
              return true;
            }
          } else {
            if (field.value === '') {
              addError(field);
              return true;
            }
          }
        }

        // Checkbox and radio
        if (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
          const group = field.form?.querySelectorAll<HTMLInputElement>(
            `input[name="${field.name}"]`,
          );
          if (group && !Array.from(group).some((el) => el.checked)) {
            addError(field);
            return true;
          }
        }
      }

      if (field instanceof HTMLInputElement) {
        // Is it an email field
        if (field.type == 'email' && field.value !== '' && !isValidEmail(field.value)) {
          addError(field);
          return true;
        }

        // Is it a URL field
        if (field.type == 'url' && field.value !== '' && !isValidURL(field.value)) {
          addError(field);
          return true;
        }

        // Is it a tel field
        if (field.type === 'tel' && field.value !== '' && !isValidTel(field.value)) {
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
          const sameAs = field.form?.querySelector<HTMLInputElement>(`#${field.dataset.sameAs}`);
          if (sameAs && sameAs.value != field.value) {
            addError(field);
            return true;
          }
        }

        // Is it alphaOnly
        if (field.classList.contains('alpha') && !patterns.alphaOnly.test(field.value)) {
          addError(field);
          return true;
        }

        // Is it alphaNumericOnly
        if (
          field.classList.contains('alphanumeric') &&
          !patterns.alphaNumericOnly.test(field.value)
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
      return false;
    }

    // No errors, clear any visual messages
    removeFieldError(field);
   
    defaults.onFieldSuccess?.(field);
  }

  function validateForm(form: HTMLFormElement): boolean {
    
    defaults.onBeforeValidate?.();

    let hasError = false;
    // Clear errors before starting
    // clearErrors();

    const fields = form.querySelectorAll<FormFieldElement>('input, select, textarea');
    fields.forEach((field) => {
      // $options.onBeforeValidate();
      if (validateField(field)) hasError = true;
      // $options.onAfterValidate();
    });

    defaults.onAfterValidate?.();
    if (!hasError && defaults.onSubmitSuccess) defaults.onSubmitSuccess();
    if (hasError && defaults.onSubmitError) defaults.onSubmitError();

    return !hasError;
  }
}
