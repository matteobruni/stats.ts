import type { IText } from "./Interfaces/IText.js";
import type { IUpdateArgs } from "./Interfaces/IUpdateArgs.js";

export class Panel {
    public readonly dom;

    private readonly _canvas: HTMLCanvasElement;
    private readonly _capacity: number;
    private readonly _context: CanvasRenderingContext2D;
    private readonly _data: number[];
    private readonly _graphX: number;
    private readonly _graphY: number;
    private readonly _graphWidth: number;
    private readonly _graphHeight: number;
    private readonly _height: number;
    private _index = 0;
    private _lastTime = 0;
    private _lastDisplayedValue = Number.NaN;
    private _length = 0;
    private _max = 0;
    private _min = Infinity;
    private readonly _pixelRatio: number;
    private readonly _width: number;
    private readonly _text: IText;

    constructor(
        private readonly name: string,
        public foreground: string,
        public background: string,
        private readonly msRefresh: number,
        private readonly refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined,
    ) {
        this._pixelRatio = devicePixelRatio || 1;
        this._width = 100 * this._pixelRatio;
        this._height = 60 * this._pixelRatio;

        this._text = {
            position: {
                x: 3 * this._pixelRatio,
                y: 2 * this._pixelRatio,
            },
        };

        this._graphX = 3 * this._pixelRatio;
        this._graphY = 18 * this._pixelRatio;
        this._graphWidth = 94 * this._pixelRatio;
        this._graphHeight = 40 * this._pixelRatio;
        this._capacity = this._graphWidth;
        this._data = new Array(this._capacity) as number[];
        this._canvas = document.createElement("canvas");
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.width = "100px";
        this._canvas.style.height = "60px";
        this._canvas.style.borderRadius = "8px";

        const ctx = this._canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Unable to get 2D context");
        }

        this._context = ctx;
        this.dom = this._canvas;

        this._setupContext();
        this.init();
    }

    public get min(): number {
        return this._min;
    }

    public get max(): number {
        return this._max;
    }

    public init(): void {
        this._context.clearRect(0, 0, this._width, this._height);
        this._drawTitle(this.name);
    }

    public update(time: number): void {
        const delta = time - this._lastTime;

        if (delta < this.msRefresh) {
            return;
        }

        const args = this.refreshCallback(time, delta);

        if (!args) {
            return;
        }

        this._lastTime = time;

        const { value, maxValue } = args;

        this._min = Math.min(this._min, value);
        this._max = Math.max(this._max, value);

        // ring buffer write
        this._data[this._index] = value;
        this._index = (this._index + 1) % this._capacity;
        this._length = Math.min(this._length + 1, this._capacity);

        const realMax = Math.max(this._max, maxValue),
            invMax = realMax > 0 ? 1 / realMax : 1;

        // ---- CLEAR ONLY GRAPH AREA ----
        this._context.clearRect(this._graphX, this._graphY, this._graphWidth, this._graphHeight);

        // ---- UPDATE TITLE ONLY IF VALUE CHANGED ----
        const rounded = Math.round(value);

        if (rounded !== this._lastDisplayedValue) {
            this._lastDisplayedValue = rounded;
            this._context.clearRect(0, 0, this._width, this._graphY - 2 * this._pixelRatio);

            this._drawTitle(`${rounded.toFixed(2)} ${this.name} (${this._min.toFixed(2)}-${this._max.toFixed(2)})`);
        }

        if (this._length === 0) return;

        this._context.beginPath();
        this._context.strokeStyle = this.foreground;

        for (let i = 0; i < this._length; i++) {
            const dataIndex = (this._index - 1 - i + this._capacity) % this._capacity,
                v = this._data[dataIndex],
                x = this._graphX + (this._length - 1 - i),
                y = (1 - v * invMax) * this._graphHeight + this._graphY;

            if (i === 0) {
                this._context.moveTo(x, y);
            } else {
                this._context.lineTo(x, y);
            }
        }

        this._context.stroke();
    }

    private _drawTitle(text: string): void {
        this._context.fillStyle = this.foreground;
        this._context.fillText(text, this._text.position.x, this._text.position.y);
    }

    private _setupContext(): void {
        const fontSize = 12 * this._pixelRatio;

        this._context.font = `400 ${fontSize.toFixed(2)}px "Avenir Next", Helvetica, Arial, sans-serif`;
        this._context.textBaseline = "top";
        this._context.lineWidth = 1.2 * this._pixelRatio;
    }
}
