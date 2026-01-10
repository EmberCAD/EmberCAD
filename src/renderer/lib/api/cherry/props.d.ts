export const POSITION_HINT: "Position in pixels. E.g. 10 - for ten px, 10em, 10rem";
export const COMPONENTS_PROPERTIES: ({
    group: string;
    items: ({
        name: string;
        values: string[];
        default: string;
        hint?: undefined;
    } | {
        name: string;
        default: string;
        values?: undefined;
        hint?: undefined;
    } | {
        name: string;
        default: number;
        hint: string;
        values?: undefined;
    } | {
        name: string;
        hint: string;
        values?: undefined;
        default?: undefined;
    })[];
} | {
    group: string;
    items: ({
        name: string;
        default: string;
    } | {
        name: string;
        default?: undefined;
    })[];
})[];
export let cherryStylesUnitConvert: string[];
export let cheryStyles: string[];
