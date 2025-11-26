export interface qFormValidateOptions {
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
/**
 * Validates a form according to QFV rules.
 * @param form - The form element to validate
 * @param options - Optional configuration overrides
 */
export declare function qFormValidate(form: HTMLFormElement, options?: qFormValidateOptions): void;
export {};
