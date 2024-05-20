
// Calculate avarage color of an image using sharp and color libraries.
import { isNil } from "lodash";
import { Colord, colord, extend } from "colord";
import sharp from "sharp";
import mixPlugin from "colord/plugins/mix";
import labPlugin from "colord/plugins/lab";
import Color from "color";

extend([mixPlugin]);
extend([labPlugin]);

export type Crop = {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}

export type ColorVector = Colord[];

export class ColorMatrix {
    public readonly rows: number;
    public readonly cols: number;

    private readonly matrix: ColorVector[];

    public drawOn(ctx: CanvasRenderingContext2D, x?: number, y?: number): void {
        const imageData = this.toImageData();

        ctx.putImageData(imageData, x ?? 0, y ?? 0);
    }

    public static async fromSharpImage(image: sharp.Sharp, options?: {crop?: Crop}): Promise<ColorMatrix> {
        const { width, height } = await image.metadata();
    
        if (width === undefined || height === undefined) {
            throw new Error('Image width or height is undefined');
        }    
    
        const data = await image.raw().toBuffer();
    
        const colorMatrix: Colord[][] = [];
    
        const crop : Required<Crop> = {
            left: options?.crop?.left ?? 0,
            top: options?.crop?.top ?? 0,
            right: options?.crop?.right ?? 0,
            bottom: options?.crop?.bottom ?? 0 
        };
    
        for (let y = crop.top  ; y < height - crop.bottom; y++) {
            const row: Colord[] = [];
            for (let x = crop.left; x < width - crop.right; x++) {
                const idx = (y * width + x) * 3;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
    
                const color: Colord = colord({ r, g, b,  });
    
                row.push(color);
            }
            colorMatrix.push(row);
        }
    
        return ColorMatrix.fromValues(height, width, colorMatrix);
    }

    public static fromValues(rows: number, cols: number, values: Colord[][]): ColorMatrix {
        return new ColorMatrix(rows, cols, values);
    }

    public static empty(rows: number, cols: number): ColorMatrix {
        return new ColorMatrix(rows, cols);
    }

    public toRGBUint8ClampedArray(): Uint8ClampedArray {
        const data = new Uint8ClampedArray(this.rows * this.cols * 4);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const color = this.get(row, col).toRgb();
                const idx = (row * this.cols + col) * 4;

                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = color.a * 255;
            }
        }

        return data;
    }

    public toImageData(): ImageData {
        return new ImageData(this.toRGBUint8ClampedArray(), this.cols, this.rows, {
            colorSpace: 'srgb',
        });
    }

    public set(row: number, col: number, value: Colord): void {
        this.checkBoundaries(row, col);

        this.matrix[row][col] = value;
    }

    public get(row: number, col: number): Colord {

        // check boundaries
        this.checkBoundaries(row, col);

        return this.matrix[row][col];
    }

    constructor(rows: number, cols: number, values?: Colord[][]) {
        this.rows = rows;
        this.cols = cols;

        if (isNil(values)) {
            this.matrix = [];
            for (let row = 0; row < rows; row++) {
                const rowValues: Colord[] = [];
                for (let col = 0; col < cols; col++) {
                    rowValues.push(colord({ r: 0, g: 0, b: 0 }));
                }
                this.matrix.push(rowValues);
            }
        }

        this.matrix = values ?? [];
    }

    private checkBoundaries(row: number, col: number) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            throw new Error(`Index out of bounds: row=${row}, col=${col}`);
        }
    }

    // Gets average color of the matrix in LAB color space
    public getAverageColor(): Colord {
        let sumL = 0;
        let sumA = 0;
        let sumB = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const color = this.get(row, col);
                const lab = color.toLab();

                sumL += lab.l;
                sumA += lab.a;
                sumB += lab.b;
            }
        }

        const averageL = sumL / (this.rows * this.cols);
        const averageA = sumA / (this.rows * this.cols);
        const averageB = sumB / (this.rows * this.cols);

        return colord({
            l: averageL,
            a: averageA,
            b: averageB
        });
    }
};

export function colorMatrixToImageData(colorMatrix: ColorMatrix): ImageData {
    const { rows, cols } = colorMatrix;

    const data = new Uint8ClampedArray(rows * cols * 4);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const color = colorMatrix.get(row, col).toRgb();
            const idx = (row * cols + col) * 4;

            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = color.a;
        }
    }

    return new ImageData(data, cols, rows, {
        colorSpace: 'srgb',
    });
}




export type UnsafeLabColor = { l: number, a: number, b: number };


export type ColorDistance = (color1: Colord, color2: Colord) => number;
export type GetQuantizationError = (sourceColor: Colord, availableColor: Colord) => UnsafeLabColor;
export type FindClosesColor = (sourceColor: Colord, palette: Colord[], distanceFunc: ColorDistance) => Colord;

export const findClosestColor : FindClosesColor = (sourceColor, palette, distanceFunc) => {
    let minDistance = Number.MAX_VALUE;
    let closestColor = palette[0];

    for (const color of palette) {
        const distance = distanceFunc(sourceColor, color);

        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }

    return closestColor;
}

export const labQuantizationError : GetQuantizationError = (sourceColor, availableColor) => {
    const sourceLab = sourceColor.toLab();
    const availableLab = availableColor.toLab();

    const deltaL = sourceLab.l - availableLab.l;
    const deltaA = sourceLab.a - availableLab.a;
    const deltaB = sourceLab.b - availableLab.b;

    return { l: deltaL, a: deltaA, b: deltaB };
}

export const euclidianLabDistance : ColorDistance = (color1, color2) => {
    const lab1 = color1.toLab();
    const lab2 = color2.toLab();
    
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}