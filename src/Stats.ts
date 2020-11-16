import type { IUpdateArgs } from "./Interfaces/IUpdateArgs";
import { Panel } from "./Panel";

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

    private background;
    private beginTime;
    private mode;
    private frames;

    private readonly panels: Panel[];

    constructor() {
        this.mode = 0;
        this.dom = document.createElement("div");
        this.panels = [];
        this.background = "#ffffff";
        this.initStyle();

        this.dom.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                this.showPanel(++this.mode % this.dom.children.length);
            },
            false
        );

        this.beginTime = (performance || Date).now();
        this.frames = 0;

        this.panels.push(
            this.addPanel("FPS", "#4080f0", 100, (time, delta) => {
                const res = {
                    value: (this.frames * 1000) / delta,
                    maxValue: 100,
                };

                this.frames = 0;

                return res;
            })
        );

        this.panels.push(
            this.addPanel("MS", "#33A033", 0, (time) => {
                return {
                    value: time - this.beginTime,
                    maxValue: 200,
                };
            })
        );

        if (performance && performance.memory) {
            this.panels.push(
                this.addPanel("MB", "#ff0088", 100, () => {
                    if (!performance || !performance.memory) {
                        return;
                    }

                    const memory = performance.memory;
                    const memoryFactor = 1048576;

                    return {
                        value: memory.usedJSHeapSize / memoryFactor,
                        maxValue: memory.jsHeapSizeLimit / memoryFactor,
                    };
                })
            );
        }

        this.showPanel(0);
    }

    public addPanel(
        name: string,
        foreground: string,
        msRefresh: number,
        refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined
    ): Panel {
        const panel = new Panel(name, foreground, this.background, msRefresh, refreshCallback);

        this.addPanelObject(panel);

        return panel;
    }

    public showPanel(id: number): void {
        for (let i = 0; i < this.dom.children.length; i++) {
            const style = (this.dom.children[i] as HTMLElement).style;

            if (style) {
                style.display = i === id ? "block" : "none";
            }
        }

        this.mode = id;
    }

    public begin(): void {
        this.beginTime = (performance || Date).now();
    }

    public end(): number {
        const time = (performance || Date).now();

        this.frames++;

        for (const panel of this.panels) {
            panel.update(time);
        }

        return time;
    }

    public update(): void {
        this.beginTime = this.end();
    }

    private addPanelObject(panel: Panel): void {
        this.panels.push(panel);
        this.dom.appendChild(panel.dom);
    }

    private initStyle(): void {
        const darkMode = typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : undefined;

        const listener = () => {
            this.updateStyle();
        };

        if (darkMode?.addEventListener) {
            darkMode?.addEventListener("change", listener);
        } else if (darkMode?.addListener) {
            darkMode?.addListener(listener);
        }

        this.updateStyle();
    }

    private updateStyle(): void {
        const darkMode = typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : undefined;
        const darkModeMatch = darkMode?.matches ?? false;

        this.dom.style.position = "fixed";
        this.dom.style.top = "5px";
        this.dom.style.left = "5px";
        this.dom.style.cursor = "pointer";
        this.dom.style.opacity = "0.9";
        this.dom.style.zIndex = "10000";
        this.dom.style.borderRadius = "5px";

        if (darkModeMatch) {
            this.background = "#000000";
            this.dom.style.boxShadow = "-4px -4px 10px 0 rgb(255, 255, 255, 0.7)";
        } else {
            this.background = "#ffffff";
            this.dom.style.boxShadow = "-4px -4px 10px 0 rgb(0, 0, 0, 0.7)";
        }

        for (const panel of this.panels) {
            panel.background = this.background;
        }
    }
}
