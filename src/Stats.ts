import { Panel, type PanelMode } from "./Panel.js";
import type { IUpdateArgs } from "./Interfaces/IUpdateArgs.js";

interface MemoryPerformance {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
}

declare global {
    interface Performance {
        memory?: MemoryPerformance;
    }
}

export interface StatsOptions {
    glass?: boolean;
    defaultPanelMode?: PanelMode;
}

export class Stats {
    public dom: HTMLElement;

    private _panels: Panel[] = [];
    private _frames = 0;
    private _beginTime = 0;
    private _mode = 0;
    private _background = "#ffffff";
    private readonly _glass: boolean;
    private readonly _defaultPanelMode: PanelMode;

    constructor(options: StatsOptions = {}) {
        const { glass = true, defaultPanelMode = "soft" } = options;

        this._glass = glass;
        this._defaultPanelMode = defaultPanelMode;

        this.dom = document.createElement("div");
        this._setupContainer();

        this._beginTime = performance.now();

        const fps = this.addPanel("FPS", "#4080f0", 100, (time, delta) => {
            const value = delta > 0 ? (this._frames * 1000) / delta : 0;

            this._frames = 0;

            return {
                value,
                maxValue: 100,
            };
        });

        fps.thresholds = [
            {
                value: 60,
                color: "#00c853",
            },
            {
                value: 30,
                color: "#ffd600",
            },
            {
                value: 0,
                color: "#ff1744",
            },
        ];

        const ms = this.addPanel("MS", "#33A033", 0, (time) => {
            return {
                value: time - this._beginTime,
                maxValue: 200,
            };
        });

        ms.thresholds = [
            { value: 16, color: "#00c853" },
            { value: 33, color: "#ffd600" },
            { value: 50, color: "#ff1744" },
        ];

        if (performance.memory) {
            this.addPanel("MB", "#ff0088", 100, () => {
                if (!performance.memory) {
                    return;
                }

                const mb = 1048576;

                return {
                    value: performance.memory.usedJSHeapSize / mb,
                    maxValue: performance.memory.jsHeapSizeLimit / mb,
                };
            });
        }

        this.dom.addEventListener("click", () => {
            this.showPanel((this._mode + 1) % this._panels.length);
        });

        this.showPanel(0);
    }

    public addPanel(
        name: string,
        foreground: string,
        msRefresh: number,
        refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined,
    ): Panel {
        const panel = new Panel(name, foreground, this._background, msRefresh, refreshCallback, this._defaultPanelMode);

        this._panels.push(panel);
        this.dom.appendChild(panel.dom);

        return panel;
    }

    public getPanel(name: string): Panel | undefined {
        return this._panels.find((p) => p.name === name);
    }

    public showPanel(id: number): void {
        for (let i = 0; i < this._panels.length; i++) {
            this._panels[i].dom.style.display = i === id ? "block" : "none";
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

    private _setupContainer(): void {
        this.dom.style.position = "fixed";
        this.dom.style.top = "5px";
        this.dom.style.left = "5px";
        this.dom.style.cursor = "pointer";
        this.dom.style.zIndex = "10000";
        this.dom.style.borderRadius = "8px";

        if (this._glass) {
            this.dom.style.backdropFilter = "blur(10px)";
            this.dom.style.background = "rgba(255,255,255,0.1)";
        } else {
            this.dom.style.background = this._background;
        }
    }
}
