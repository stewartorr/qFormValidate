"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  isValidEmail: () => isValidEmail,
  isValidTel: () => isValidTel,
  isValidURL: () => isValidURL,
  patterns: () => patterns,
  qFormValidate: () => qFormValidate,
  trim: () => trim
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
var patterns = {
  dateOnly: /^[0-9/.-]+$/,
  digitsOnly: /^[0-9]+$/,
  floatOnly: /^[0-9.,]+$/,
  alphaOnly: /^[a-z]+$/i,
  alphaNumericOnly: /^[a-z0-9]+$/i,
  urlOnly: /^[a-z0-9.\-:/?=&#]+$/i,
  emailOnly: /^[a-z0-9@_\-+.]+$/i,
  telOnly: /^[0-9 ()/+]+$/i
};
function isValidEmail(email) {
  const pattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
  return pattern.test(email);
}
function isValidURL(url) {
  const pattern = /^(https?:\/\/)([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;
  return pattern.test(url);
}
function isValidTel(tel) {
  const pattern = /^\+?[0-9\s\-()]{7,15}$/;
  return pattern.test(tel);
}
function trim(s) {
  return s.replace(/\s+/g, " ").trim();
}

// src/qformvalidate.ts
var typeRestrictions = {
  tel: patterns.telOnly,
  email: patterns.emailOnly,
  url: patterns.urlOnly,
  number: patterns.floatOnly
};
function qFormValidate(form, options) {
  const defaults = {
    scrollTopOffset: 100,
    defaultErrorMsg: "Please complete this field.",
    defaultErrorMsgSection: "Please complete this section.",
    onSubmitError: () => {
    },
    onSubmitSuccess: () => {
    },
    onFieldError: (field, errorMsg) => {
    },
    onFieldSuccess: (field) => {
    },
    onAfterValidate: () => {
    },
    onBeforeValidate: () => {
    },
    ...options
    // overwrite defaults with any provided options
  };
  form.noValidate = true;
  form.addEventListener("clear", () => clearErrors(form));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    return validateForm(form);
  });
  const fields = form.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    watchField(field);
  });
  function getErrorMsg(field) {
    if (field.dataset.errorMsg) return field.dataset.errorMsg;
    if (field instanceof HTMLSelectElement) return "Please select an option";
    switch (field.type) {
      case "tel":
        return "Please enter a valid telephone number";
      case "url":
        return "Please enter a valid URL.";
      case "email":
        return "Please enter a valid email address.";
      case "password":
        return "Please enter a valid password";
      default:
        return defaults.defaultErrorMsg;
    }
  }
  function addError(field) {
    const errorMsg = getErrorMsg(field);
    const parent = field.closest("div, li, p, label");
    const fieldId = field.id ? `error-${field.id}` : `error-${crypto.randomUUID()}`;
    defaults.onFieldError?.(field, errorMsg);
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", fieldId);
    if (parent) {
      parent.classList.add("error");
      parent.querySelector("span.inline-error")?.remove();
      parent.insertAdjacentHTML(
        "beforeend",
        `<span class="inline-error" id="${fieldId}" aria-hidden="false" role="alert">${errorMsg}</span>`
      );
    }
  }
  function removeFieldError(field) {
    field.classList.remove("error");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    const parent = field.closest("div, li, p, label");
    if (parent) {
      parent.classList.remove("error");
      parent.querySelector("span.inline-error")?.remove();
    }
  }
  function watchField(field) {
    if (field instanceof HTMLInputElement) {
      const inputType = field.type;
      if (inputType in typeRestrictions) {
        const restriction = typeRestrictions[inputType];
        field.addEventListener(
          "keydown",
          (event) => restrictCharacters(field, event, restriction)
        );
      }
      ["blur", "keyup"].forEach(
        (bind) => field.addEventListener(bind, (event) => {
          if (event.type === "blur") {
            field.value = trim(field.value);
          }
          validateField(field, event);
        })
      );
    }
    if (field instanceof HTMLSelectElement) {
      ["blur", "change"].forEach(
        (bind) => field.addEventListener(bind, (event) => {
          validateField(field, event);
        })
      );
    }
  }
  function clearErrors(form2) {
    const fields2 = form2.querySelectorAll("input, select, textarea");
    fields2.forEach((field) => removeFieldError(field));
  }
  function restrictCharacters(field, event, restrictionType) {
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
      "PageDown"
    ];
    if (event.key && ignoreKeys.includes(event.key) || event.ctrlKey || event.metaKey)
      return true;
    if (event.key === "Escape") {
      field.blur();
      return false;
    }
    if (!event.key.match(restrictionType)) {
      event.preventDefault();
      return false;
    }
  }
  function validateField(field, event) {
    const validate = event ? event.type !== "keyup" : true;
    if (validate) {
      if (field.required) {
        if (field instanceof HTMLSelectElement) {
          if (field.multiple) {
            const hasSelection = Array.from(field.options).some(
              (opt) => opt.selected && opt.value !== ""
            );
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
        if (field instanceof HTMLTextAreaElement) {
          if (field.value === "") {
            addError(field);
            return true;
          }
        }
        if (field instanceof HTMLInputElement && !["checkbox", "radio"].includes(field.type)) {
          if (field.type === "file") {
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
        if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
          const group = field.form?.querySelectorAll(
            `input[name="${field.name}"]`
          );
          if (group && !Array.from(group).some((el) => el.checked)) {
            addError(field);
            return true;
          }
        }
      }
      if (field instanceof HTMLInputElement) {
        if (field.type == "email" && field.value !== "" && !isValidEmail(field.value)) {
          addError(field);
          return true;
        }
        if (field.type == "url" && field.value !== "" && !isValidURL(field.value)) {
          addError(field);
          return true;
        }
        if (field.type === "tel" && field.value !== "" && !isValidTel(field.value)) {
          addError(field);
          return true;
        }
        if (field.dataset.minLength && field.value.length < parseInt(field.dataset.minLength)) {
          addError(field);
          return true;
        }
        if (field.dataset.sameAs) {
          const sameAs = field.form?.querySelector(`#${field.dataset.sameAs}`);
          if (sameAs && sameAs.value != field.value) {
            addError(field);
            return true;
          }
        }
        if (field.classList.contains("alpha") && !patterns.alphaOnly.test(field.value)) {
          addError(field);
          return true;
        }
        if (field.classList.contains("alphanumeric") && !patterns.alphaNumericOnly.test(field.value)) {
          addError(field);
          return true;
        }
      }
      return false;
    }
    removeFieldError(field);
    defaults.onFieldSuccess?.(field);
  }
  function validateForm(form2) {
    defaults.onBeforeValidate?.();
    let hasError = false;
    const fields2 = form2.querySelectorAll("input, select, textarea");
    fields2.forEach((field) => {
      if (validateField(field)) hasError = true;
    });
    defaults.onAfterValidate?.();
    if (!hasError && defaults.onSubmitSuccess) defaults.onSubmitSuccess();
    if (hasError && defaults.onSubmitError) defaults.onSubmitError();
    return !hasError;
  }
}
//# sourceMappingURL=qformvalidate.cjs.js.map
