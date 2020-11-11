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

    constructor(
        private readonly name: string,
        private readonly foreground: string,
        private readonly background: string
    ) {
        this.min = Infinity;
        this.max = 0;
        this.pixelRatio = Math.round(devicePixelRatio || 1);
        this.width = 100 * this.pixelRatio;
        this.height = 60 * this.pixelRatio;
        this.text = {
            position: {
                x: 3 * this.pixelRatio,
                y: 2 * this.pixelRatio,
            },
        };

        this.graph = {
            position: {
                x: 3 * this.pixelRatio,
                y: 18 * this.pixelRatio,
            },
            size: {
                width: 94 * this.pixelRatio,
                height: 40 * this.pixelRatio,
            },
        };

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = "width: 100px; height:60px";
        this.context = this.canvas.getContext("2d");

        this.init();

        this.dom = this.canvas;
    }

    public init(): void {
        if (!this.context) {
            return;
        }

        const fontSize = 12 * this.pixelRatio;

        // draws title
        this.context.font = `400 ${fontSize}px "Avenir Next", Helvetica, "Helvetica Neue", Arial, sans-serif`;
        this.context.textBaseline = "top";
        this.context.fillStyle = this.background;
        this.context.fillRect(0, 0, this.width, this.height);
        this.context.fillStyle = this.foreground;
        this.context.fillText(this.name, this.text.position.x, this.text.position.y);

        // draws graph area
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

    public update(value: number, maxValue: number): void {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);

        if (!this.context) {
            return;
        }

        // draws background
        this.context.fillStyle = this.background;
        this.context.globalAlpha = 1;
        this.context.fillRect(0, 0, this.width, this.graph.position.y);

        // draws title
        this.context.fillStyle = this.foreground;
        this.context.fillText(
            `${Math.round(value)} ${this.name} (${Math.round(this.min)}-${Math.round(this.max)})`,
            this.text.position.x,
            this.text.position.y
        );

        // draws the canvas moved left by 1 * pixel ratio
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

        // draws a vertical line of foreground color
        this.context.fillRect(
            this.graph.position.x + this.graph.size.width - this.pixelRatio,
            this.graph.position.y,
            this.pixelRatio,
            this.graph.size.height
        );

        // draws an inverse vertical line to remove the foreground color
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
