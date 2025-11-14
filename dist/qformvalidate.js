import { patterns, isValidEmail, isValidURL, isValidTel, trim } from './utils.js';
const typeRestrictions = {
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
export function qFormValidate(form, options) {
    // Merge default options with user-provided options
    const defaults = Object.assign({ scrollTopOffset: 100, defaultErrorMsg: 'Please complete this field.', defaultErrorMsgSection: 'Please complete this section.', onSubmitError: () => { }, onSubmitSuccess: () => { }, onFieldError: (field, errorMsg) => { }, onFieldSuccess: (field) => { }, onAfterValidate: () => { }, onBeforeValidate: () => { } }, options);
    form.noValidate = true;
    form.addEventListener('clear', () => clearErrors(form));
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        return validateForm(form);
    });
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
        watchField(field);
    });
    /**
     * Description placeholder
     *
     * @param {FormFieldElement} field
     * @returns {string}
     */
    function getErrorMsg(field) {
        if (field.dataset.errorMsg)
            return field.dataset.errorMsg;
        if (field instanceof HTMLSelectElement)
            return 'Please select an option';
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
    function addError(field) {
        var _a, _b;
        const errorMsg = getErrorMsg(field);
        const parent = field.closest('div, li, p, label');
        const fieldId = field.id ? `error-${field.id}` : `error-${crypto.randomUUID()}`;
        (_a = defaults.onFieldError) === null || _a === void 0 ? void 0 : _a.call(defaults, field, errorMsg);
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', fieldId);
        if (parent) {
            parent.classList.add('error');
            (_b = parent.querySelector('span.inline-error')) === null || _b === void 0 ? void 0 : _b.remove();
            parent.insertAdjacentHTML('beforeend', `<span class="inline-error" id="${fieldId}" aria-hidden="false" role="alert">${errorMsg}</span>`);
        }
    }
    function removeFieldError(field) {
        var _a;
        field.classList.remove('error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        const parent = field.closest('div, li, p, label');
        if (parent) {
            parent.classList.remove('error');
            (_a = parent.querySelector('span.inline-error')) === null || _a === void 0 ? void 0 : _a.remove();
        }
    }
    function watchField(field) {
        // INPUT, TEXTAREA
        if (field instanceof HTMLInputElement) {
            const inputType = field.type;
            if (inputType in typeRestrictions) {
                const restriction = typeRestrictions[inputType];
                field.addEventListener('keydown', (event) => restrictCharacters(field, event, restriction));
            }
            // Using the above bind action, watch the form element
            ['blur', 'keyup'].forEach((bind) => field.addEventListener(bind, (event) => {
                if (event.type === 'blur') {
                    field.value = trim(field.value);
                }
                validateField(field, event);
            }));
        }
        // SELECT
        if (field instanceof HTMLSelectElement) {
            ['blur', 'change'].forEach((bind) => field.addEventListener(bind, (event) => {
                validateField(field, event);
            }));
        }
    }
    function clearErrors(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach((field) => removeFieldError(field));
    }
    function restrictCharacters(field, event, restrictionType) {
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
    function validateField(field, event) {
        var _a, _b, _c;
        const validate = event ? event.type !== 'keyup' : true;
        // Only validate on some events so not to show the message too early
        if (validate) {
            // Is it a required field
            if (field.required) {
                // Select
                if (field instanceof HTMLSelectElement) {
                    if (field.multiple) {
                        const hasSelection = Array.from(field.options).some((opt) => opt.selected && opt.value !== '');
                        if (!hasSelection) {
                            addError(field);
                            return true;
                        }
                    }
                    else {
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
                    }
                    else {
                        if (field.value === '') {
                            addError(field);
                            return true;
                        }
                    }
                }
                // Checkbox and radio
                if (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
                    const group = (_a = field.form) === null || _a === void 0 ? void 0 : _a.querySelectorAll(`input[name="${field.name}"]`);
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
                    const sameAs = (_b = field.form) === null || _b === void 0 ? void 0 : _b.querySelector(`#${field.dataset.sameAs}`);
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
                if (field.classList.contains('alphanumeric') &&
                    !patterns.alphaNumericOnly.test(field.value)) {
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
        (_c = defaults.onFieldSuccess) === null || _c === void 0 ? void 0 : _c.call(defaults, field);
    }
    function validateForm(form) {
        var _a, _b;
        (_a = defaults.onBeforeValidate) === null || _a === void 0 ? void 0 : _a.call(defaults);
        let hasError = false;
        // Clear errors before starting
        // clearErrors();
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach((field) => {
            // $options.onBeforeValidate();
            if (validateField(field))
                hasError = true;
            // $options.onAfterValidate();
        });
        (_b = defaults.onAfterValidate) === null || _b === void 0 ? void 0 : _b.call(defaults);
        if (!hasError && defaults.onSubmitSuccess)
            defaults.onSubmitSuccess();
        if (hasError && defaults.onSubmitError)
            defaults.onSubmitError();
        return !hasError;
    }
}
