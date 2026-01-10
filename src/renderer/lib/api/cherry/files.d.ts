export namespace chPath {
    function join(...args: any[]): string;
}
export function requireComponent(name: any): any;
export function requireVendorComponent(name: any): any;
export function fileExists(name: any): boolean;
export function mkDir(dir: any): void;
export function deleteFolder(pat: any, filesOnly: any): void;
export function loadSync(fileName: any): string;
export function load(fileName: any): Promise<any>;
export function loadFile(fileName: any): Promise<any>;
export function loadCSS(cssName: any): Promise<void>;
export function loadJSON(fname: any): Promise<any>;
export function getStartApp(): any;
export function getStartAppWeb(): Promise<any>;
