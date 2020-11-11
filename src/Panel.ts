import type { IGraph, IText } from "./Interfaces";

export class Panel {
    public readonly dom;

    private max;
    private min;

    private readonly canvas: HTMLCanvasElement;
    private readonly context;
    private readonly pixelRatio;
    private readonly width;
    private readonly height;
    private readonly text: IText;
    private readonly graph: IGraph;

    constructor(private readonly name: string, private readonly foreground: string, private readonly background: string) {
        this.min = Infinity;
        this.max = 0;
        this.pixelRatio = Math.round(devicePixelRatio || 1);
        this.width = 80 * this.pixelRatio;
        this.height = 48 * this.pixelRatio;
        this.text = {
            position: {
                x: 3 * this.pixelRatio,
                y: 2 * this.pixelRatio,
            },
        };
        this.graph = {
            position: {
                x: 3 * this.pixelRatio,
                y: 15 * this.pixelRatio,
            },
            size: {
                width: 74 * this.pixelRatio,
                height: 30 * this.pixelRatio,
            },
        };
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = "width:80px;height:48px";
        this.context = this.canvas.getContext("2d");

        if (this.context) {
            this.context.font = `bold ${9 * this.pixelRatio}px Helvetica,Arial,sans-serif`;
            this.context.textBaseline = "top";
            this.context.fillStyle = this.background;
            this.context.fillRect(0, 0, this.width, this.height);
            this.context.fillStyle = this.foreground;
            this.context.fillText(this.name, this.text.position.x, this.text.position.y);
            this.context.fillRect(
                this.graph.position.x,
                this.graph.position.y,
                this.graph.size.width,
                this.graph.size.height
            );
            this.context.fillStyle = this.background;
            this.context.globalAlpha = 0.9;
            this.context.fillRect(
                this.graph.position.x,
                this.graph.position.y,
                this.graph.size.width,
                this.graph.size.height
            );
        }

        this.dom = this.canvas;
    }

    public update(value: number, maxValue: number): void {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);

        if (this.context) {
            this.context.fillStyle = this.background;
            this.context.globalAlpha = 1;
            this.context.fillRect(0, 0, this.width, this.graph.position.y);
            this.context.fillStyle = this.foreground;
            this.context.fillText(
                `${Math.round(value)} ${this.name} (${Math.round(this.min)}-${Math.round(this.max)})`,
                this.text.position.x,
                this.text.position.y
            );
            this.context.drawImage(
                this.canvas,
                this.graph.position.x + this.pixelRatio,
                this.graph.position.y,
                this.graph.size.width - this.pixelRatio,
                this.graph.size.height,
                this.graph.position.x,
                this.graph.position.y,
                this.graph.size.width - this.pixelRatio,
                this.graph.size.height
            );
            this.context.fillRect(
                this.graph.position.x + this.graph.size.width - this.pixelRatio,
                this.graph.position.y,
                this.pixelRatio,
                this.graph.size.height
            );
            this.context.fillStyle = this.background;
            this.context.globalAlpha = 0.9;
            this.context.fillRect(
                this.graph.position.x + this.graph.size.width - this.pixelRatio,
                this.graph.position.y,
                this.pixelRatio,
                Math.round((1 - value / maxValue) * this.graph.size.height)
            );
        }
    }
}
