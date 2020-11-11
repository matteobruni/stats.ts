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

    private beginTime;
    private previousTime;
    private frames;
    private mode;

    private readonly fpsPanel;
    private readonly millisecondsPanel;
    private readonly memoryPanel;

    constructor() {
        this.mode = 0;
        this.dom = document.createElement("div");

        this.dom.style.cssText = "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
        this.dom.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                this.showPanel(++this.mode % this.dom.children.length);
            },
            false
        );

        this.beginTime = (performance || Date).now();
        this.previousTime = this.beginTime;
        this.frames = 0;
        this.fpsPanel = this.addPanel("FPS", "#0ff", "#002");
        this.millisecondsPanel = this.addPanel("MS", "#0f0", "#020");

        if (performance && performance.memory) {
            this.memoryPanel = this.addPanel("MB", "#f08", "#201");
        }

        this.showPanel(0);
    }

    public addPanel(name: string, foreground: string, background: string): Panel {
        const panel = new Panel(name, foreground, background);

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
        this.frames++;

        const time = (performance || Date).now();

        this.millisecondsPanel.update(time - this.beginTime, 200);

        if (time >= this.previousTime + 1000) {
            this.fpsPanel.update((this.frames * 1000) / (time - this.previousTime), 100);
            this.previousTime = time;
            this.frames = 0;

            if (this.memoryPanel) {
                const memory = performance.memory;

                if (memory) {
                    this.memoryPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
                }
            }
        }

        return time;
    }

    public update(): void {
        this.beginTime = this.end();
    }

    private addPanelObject(panel: Panel): void {
        this.dom.appendChild(panel.dom);
    }
}
