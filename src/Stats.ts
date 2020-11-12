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

        this.dom.style.position = "fixed";
        this.dom.style.top = "5px";
        this.dom.style.left = "5px";
        this.dom.style.cursor = "pointer";
        this.dom.style.opacity = "0.9";
        this.dom.style.zIndex = "10000";
        this.dom.style.borderRadius = "5px";
        this.dom.style.boxShadow = "-4px -4px 10px 0 #000000B3";
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
        this.fpsPanel = this.addPanel("FPS", "#4080f0", "#fff");
        this.millisecondsPanel = this.addPanel("MS", "#33A033", "#fff");

        if (performance && performance.memory) {
            this.memoryPanel = this.addPanel("MB", "#f08", "#fff");
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

        this.millisecondsPanel.update(time - this.beginTime, Math.max(this.millisecondsPanel.max, 200));

        if (time >= this.previousTime + 100) {
            this.fpsPanel.update((this.frames * 1000) / (time - this.previousTime), Math.max(60, this.fpsPanel.max));
            this.previousTime = time;
            this.frames = 0;

            if (this.memoryPanel) {
                const memory = performance.memory;

                if (memory) {
                    const memoryFactor = 1048576;

                    this.memoryPanel.update(
                        memory.usedJSHeapSize / memoryFactor,
                        Math.max(this.memoryPanel.max, memory.jsHeapSizeLimit / memoryFactor)
                    );
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
