export declare const patterns: {
    dateOnly: RegExp;
    digitsOnly: RegExp;
    floatOnly: RegExp;
    alphaOnly: RegExp;
    alphaNumericOnly: RegExp;
    urlOnly: RegExp;
    emailOnly: RegExp;
    telOnly: RegExp;
};
export declare function isValidEmail(email: string): boolean;
export declare function isValidURL(url: string): boolean;
export declare function isValidTel(tel: string): boolean;
export declare function trim(s: string): string;
