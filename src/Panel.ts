import type { IText } from "./Interfaces/IText.js";
import type { IUpdateArgs } from "./Interfaces/IUpdateArgs.js";

export interface Threshold {
    value: number;
    color: string;
}

export type PanelMode = "soft" | "hardcore";

export class Panel {
    public readonly dom;
    public thresholds?: Threshold[];
    public mode: PanelMode = "soft"; // default "soft" fill

    private readonly _canvas: HTMLCanvasElement;
    private readonly _capacity: number;
    private readonly _context: CanvasRenderingContext2D;
    private readonly _data: number[];
    private readonly _graphHeight: number;
    private readonly _graphWidth: number;
    private readonly _graphX: number;
    private readonly _graphY: number;
    private readonly _height: number;
    private _index = 0;
    private _lastDisplayedValue = Number.NaN;
    private _lastTime = 0;
    private _length = 0;
    private _max = 0;
    private _min = Infinity;
    private readonly _pixelRatio: number;
    private readonly _text: IText;
    private readonly _width: number;

    constructor(
        private readonly _name: string,
        public foreground: string,
        public background: string,
        private readonly _msRefresh: number,
        private readonly _refreshCallback: (time: number, delta: number) => IUpdateArgs | undefined,
    ) {
        this._pixelRatio = window.devicePixelRatio || 1;
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
        this._data = new Array<number>(this._capacity);
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
        this._drawTitle(this._name);
    }

    public update(time: number): void {
        const delta = time - this._lastTime;

        if (delta < this._msRefresh) {
            return;
        }

        const args = this._refreshCallback(time, delta);

        if (!args) {
            return;
        }

        this._lastTime = time;

        const { value, maxValue } = args;

        this._min = Math.min(this._min, value);
        this._max = Math.max(this._max, value);
        this._data[this._index] = value;
        this._index = (this._index + 1) % this._capacity;
        this._length = Math.min(this._length + 1, this._capacity);

        const realMax = Math.max(this._max, maxValue),
            invMax = realMax > 0 ? 1 / realMax : 1;

        this._context.clearRect(this._graphX, this._graphY, this._graphWidth, this._graphHeight);

        const rounded = Math.round(value);

        if (rounded !== this._lastDisplayedValue) {
            this._lastDisplayedValue = rounded;
            this._context.clearRect(0, 0, this._width, this._graphY - 2 * this._pixelRatio);
            this._drawTitle(
                `${rounded.toString()} ${this._name} (${Math.round(this._min).toString()}-${Math.round(this._max).toString()})`,
            );
        }

        if (this._length === 0) {
            return;
        }

        if (this.mode === "soft") {
            let prevX: number | undefined = undefined,
                prevY: number | undefined = undefined,
                prevColor: string | null = null;

            this._context.beginPath();

            for (let i = 0; i < this._length; i++) {
                const dataIndex = (this._index - 1 - i + this._capacity) % this._capacity,
                    v = this._data[dataIndex],
                    x = this._graphX + (this._length - 1 - i),
                    y = (1 - v * invMax) * this._graphHeight + this._graphY;

                let color = this.foreground;

                if (this.thresholds?.length) {
                    for (const t of this.thresholds) {
                        if (v >= t.value) {
                            color = t.color;

                            break;
                        }
                    }
                }

                if (i === 0) {
                    prevX = x;
                    prevY = y;
                    prevColor = color;

                    this._context.moveTo(x, y);
                } else {
                    if (color !== prevColor && prevX !== undefined && prevY !== undefined) {
                        this._context.stroke();
                        this._context.beginPath();
                        this._context.strokeStyle = color;
                        this._context.moveTo(prevX, prevY);

                        prevColor = color;
                    }

                    this._context.lineTo(x, y);

                    prevX = x;
                    prevY = y;
                }
            }

            this._context.stroke();

            const gradient = this._context.createLinearGradient(0, this._graphY, 0, this._graphY + this._graphHeight);

            gradient.addColorStop(0, "rgba(0,128,0,0.4)");
            gradient.addColorStop(1, "rgba(0,128,0,0)");

            this._context.fillStyle = gradient;
            this._context.beginPath();

            for (let i = 0; i < this._length; i++) {
                const dataIndex = (this._index - 1 - i + this._capacity) % this._capacity,
                    v = this._data[dataIndex],
                    x = this._graphX + (this._length - 1 - i),
                    y = (1 - v * invMax) * this._graphHeight + this._graphY;

                if (i === 0) {
                    this._context.moveTo(x, this._graphY + this._graphHeight);
                }

                this._context.lineTo(x, y);
            }

            this._context.lineTo(this._graphX, this._graphY + this._graphHeight);
            this._context.closePath();
            this._context.fill();
        } else /* if (this.mode === "hardcore") */ {
            this._context.drawImage(
                this._canvas,
                1,
                this._graphY,
                this._graphWidth - 1,
                this._graphHeight,
                0,
                this._graphY,
                this._graphWidth - 1,
                this._graphHeight,
            );

            const v = this._data[(this._index - 1 + this._capacity) % this._capacity],
                y = (1 - v * invMax) * this._graphHeight + this._graphY;

            let color = this.foreground;

            if (this.thresholds?.length) {
                for (const t of this.thresholds) {
                    if (v >= t.value) {
                        color = t.color;

                        break;
                    }
                }
            }

            this._context.strokeStyle = color;
            this._context.beginPath();
            this._context.moveTo(this._graphX + this._graphWidth - 1, this._graphY + this._graphHeight);
            this._context.lineTo(this._graphX + this._graphWidth - 1, y);
            this._context.stroke();
        }
    }

    private _setupContext(): void {
        const fontSize = 12 * this._pixelRatio;
        this._context.font = `400 ${fontSize.toString()}px "Avenir Next", Helvetica, Arial, sans-serif`;
        this._context.textBaseline = "top";
        this._context.lineWidth = 1.2 * this._pixelRatio;
    }

    private _drawTitle(text: string): void {
        this._context.fillStyle = this.foreground;
        this._context.fillText(text, this._text.position.x, this._text.position.y);
    }
}
