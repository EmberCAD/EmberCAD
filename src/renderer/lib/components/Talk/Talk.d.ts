export = Talk;
declare class Talk {
    defaults(): void;
    kind: string;
    _init(): void;
    speaker: SpeechSynthesisUtterance;
    _events(): void;
    set text(arg: any);
    set lang(arg: any);
    set rate(arg: any);
    say(txt: any): void;
}
