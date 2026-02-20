import type { IUpdateArgs } from "./Interfaces/IUpdateArgs.js";
import { Panel } from "./Panel.js";

interface MemoryPerformance {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
}

declare global {
    interface Performance {
        memory?: MemoryPerformance;
    }
}

export class Stats {
    public dom: HTMLElement;

    private _background = "rgba(255,255,255,0.15)";
    private _beginTime = 0;
    private readonly _darkModeQuery?: MediaQueryList;
    private _frames = 0;
    private _mode = 0;
    private readonly _panels: Panel[] = [];

    constructor() {
        this.dom = document.createElement("div");

        this._darkModeQuery =
            typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : undefined;

        this._setupContainer();
        this._initStyle();

        this.dom.addEventListener("click", (event) => {
            event.preventDefault();
            this.showPanel((this._mode + 1) % this.dom.children.length);
        });

        this._beginTime = performance.now();

        this.addPanel("FPS", "#4080f0", 100, (time, delta) => {
            const value = delta > 0 ? (this._frames * 1000) / delta : 0;
            this._frames = 0;
            return { value, maxValue: 100 };
        });

        this.addPanel("MS", "#33A033", 0, (time) => {
            return { value: time - this._beginTime, maxValue: 200 };
        });

        if (performance.memory) {
            const memory = performance.memory,
                mb = 1048576;

            this.addPanel("MB", "#ff0088", 100, () => {
                return {
                    value: memory.usedJSHeapSize / mb,
                    maxValue: memory.jsHeapSizeLimit / mb,
                };
            });
        }

        this.showPanel(0);
    }

    public addPanel(
        name: string,
        foreground: string,
        msRefresh: number,
        refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined,
    ): Panel {
        const panel = new Panel(name, foreground, this._background, msRefresh, refreshCallback);

        this._panels.push(panel);
        this.dom.appendChild(panel.dom);

        return panel;
    }

    public showPanel(id: number): void {
        for (let i = 0; i < this.dom.children.length; i++) {
            (this.dom.children[i] as HTMLElement).style.display = i === id ? "block" : "none";
        }

        this._mode = id;
    }

    public begin(): void {
        this._beginTime = performance.now();
    }

    public end(): number {
        const time = performance.now();

        this._frames++;

        for (const panel of this._panels) {
            panel.update(time);
        }

        return time;
    }

    public update(): void {
        this._beginTime = this.end();
    }

    private _initStyle(): void {
        const listener = () => {
            this._updateStyle();
        };

        if (this._darkModeQuery?.addEventListener) {
            this._darkModeQuery.addEventListener("change", listener);
        }

        this._updateStyle();
    }

    private _setupContainer(): void {
        this.dom.style.position = "fixed";
        this.dom.style.top = "10px";
        this.dom.style.left = "10px";
        this.dom.style.cursor = "pointer";
        this.dom.style.zIndex = "10000";
        this.dom.style.borderRadius = "12px";

        // GLASS EFFECT
        this.dom.style.backdropFilter = "blur(14px)";
        this.dom.style.border = "1px solid rgba(255,255,255,0.2)";
        this.dom.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
        this.dom.style.padding = "4px";
    }

    private _updateStyle(): void {
        const dark = this._darkModeQuery?.matches ?? false;

        if (dark) {
            this._background = "rgba(0,0,0,0.25)";
        } else {
            this._background = "rgba(255,255,255,0.15)";
        }

        for (const panel of this._panels) {
            panel.background = this._background;
        }
    }
}
