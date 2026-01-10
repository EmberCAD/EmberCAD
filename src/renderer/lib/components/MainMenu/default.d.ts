export function menuTemplate(label: any): {
    label: any;
    id: string;
    submenu: ({
        label: string;
        id: string;
        type?: undefined;
        visible?: undefined;
        accelerator?: undefined;
    } | {
        type: string;
        label?: undefined;
        id?: undefined;
        visible?: undefined;
        accelerator?: undefined;
    } | {
        label: string;
        id: string;
        visible: boolean;
        type?: undefined;
        accelerator?: undefined;
    } | {
        label: string;
        id: string;
        accelerator: string;
        type?: undefined;
        visible?: undefined;
    })[];
}[];
