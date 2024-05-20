
// Calculate avarage color of an image using sharp and color libraries.

import { Colord, colord } from "colord";
import sharp from "sharp";

export type Crop = {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}


export async function getColorMatrix(image: sharp.Sharp, options?: {crop?: Crop}): Promise<Colord[][]>{
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
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];

            const color: Colord = rgb()

            row.push(color);
        }
        colorMatrix.push(row);
    }

    return colorMatrix;
}

export type ColorDistanceCalculator = (color1: Color, color2: Color) => number;
export type DitherQuantizationCalculator = (sourceColor: Color, availableColor: Color) => Color;

export const euclidianLabDistance : ColorDistanceCalculator = (color1, color2) => {


    const lab1 = color1.lab().object();
    const lab2 = color2.lab().object();
    
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}