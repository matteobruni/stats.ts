import type { IGraph, IText } from "./Interfaces";
import type { IUpdateArgs } from "./Interfaces/IUpdateArgs";

export class Panel {
    public readonly dom;

    public get min(): number {
        return this._min;
    }

    public get max(): number {
        return this._max;
    }

    private readonly data: number[];

    private _max;
    private _min;
    private lastTime;

    private readonly canvas: HTMLCanvasElement;
    private readonly context;
    private readonly pixelRatio;
    private readonly width;
    private readonly height;
    private readonly text: IText;
    private readonly graph: IGraph;

    constructor(
        private readonly name: string,
        public foreground: string,
        public background: string,
        private readonly msRefresh: number,
        private readonly refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined
    ) {
        this.data = [];
        this._min = Infinity;
        this._max = 0;
        this.lastTime = 0;
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
        this.canvas.style.width = "100px";
        this.canvas.style.height = "60px";
        this.canvas.style.borderRadius = "5px";
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
    }

    public update(time: number): void {
        const delta = time - this.lastTime;

        if (delta < this.msRefresh) {
            return;
        }

        const args = this.refreshCallback(time, delta);

        if (!args) {
            return;
        }

        this.lastTime = time;

        const { value, maxValue } = args;

        this._min = Math.min(this._min, value);
        this._max = Math.max(this._max, value);

        this.data.push(value);

        const realMax = Math.max(this._max, maxValue);

        if (this.data.length > this.graph.size.width) {
            this.data.splice(0, this.data.length - this.graph.size.width);
        }

        if (!this.context) {
            return;
        }

        // draws background
        this.context.fillStyle = this.background;
        this.context.globalAlpha = 1;
        this.context.fillRect(0, 0, this.width, this.height);

        // draws title
        this.context.fillStyle = this.foreground;
        this.context.fillText(
            `${Math.round(value)} ${this.name} (${Math.round(this._min)}-${Math.round(this._max)})`,
            this.text.position.x,
            this.text.position.y
        );

        // draws the graph line
        this.context.beginPath();
        this.context.moveTo(
            this.data.length + this.graph.position.x,
            (1 - this.data[this.data.length - 1] / realMax) * this.graph.size.height + this.graph.position.y
        );

        for (let i = this.data.length - 1; i > 0; i--) {
            const cpx = i - 1 / 2 + this.graph.position.x;
            const cpy = (v: number) => (1 - v / realMax) * this.graph.size.height + this.graph.position.y;
            const cp1y = cpy(this.data[i]);
            const cp2y = cpy(this.data[i - 1]);

            this.context.bezierCurveTo(cpx, cp1y, cpx, cp2y, i - 1 + this.graph.position.x, cp2y);
        }

        this.context.strokeStyle = this.foreground;
        this.context.stroke();
    }
}
