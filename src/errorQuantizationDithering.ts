import { Colord, colord } from "colord";
import { ColorDistance as GetColorDistance, ColorMatrix, FindClosesColor, GetQuantizationError, UnsafeLabColor } from "./color";
import { isNil } from "lodash";
import { Matrix, matrix } from "mathjs";

export type Debug = (currentImage: ColorMatrix) => void;

export function ditherWithErrorQuantization(
    sourceImage: ColorMatrix,
    palette: Colord[],
    ditherMatrix: Matrix,
    findClosestColor: FindClosesColor,
    getQuantizationError: GetQuantizationError,
    debug?: Debug
): ColorMatrix {
    const { cols, rows } = sourceImage;
    const [ dRows, dCols] = ditherMatrix.size()

    const dithered = sourceImage.clone();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const oldColor = dithered.get(row, col);
            const newColor = findClosestColor(oldColor, palette);

            dithered.set(row, col, newColor);

            const quantError : UnsafeLabColor = getQuantizationError(oldColor, newColor); // usually oldColor - newColor

            // because the matrix starts from the middle of the first row
            const dColStart = Math.floor(dRows / 2);
            const dRowStart = 0;

            function addColorWithRatio(color1: Colord, color2: UnsafeLabColor, ratio: number): Colord {
                const lab1 = color1.toLab();
                const lab2 = color2;

                return colord({
                    l: lab1.l + lab2.l * ratio,
                    a: lab1.a + lab2.a * ratio,
                    b: lab1.b + lab2.b * ratio,
                });
            
            }

            const noiseWidth = 1;

            // traversing dither matrix
            for (let dRow = 0; dRow < dRows; dRow++) {
                for (let dCol = 0; dCol < dCols; dCol++) {
                    // const noise = Math.random() * noiseWidth - noiseWidth / 2;
                    const noise = 0;
                    const errorTransferStrength = ditherMatrix.get([dRow, dCol]) as number;

                    const finalFactor = errorTransferStrength * (1+noise);

                    const updateRow = row + dRow - dRowStart;
                    const updateCol = col + dCol - dColStart;

                    if (updateRow < 0 || updateRow >= rows || updateCol < 0 || updateCol >= cols) continue;
                    const currentColor = dithered.get(updateRow, updateCol); // current color

                    // Colord will clamp the values if they go outside of the allowed range
                    const updatedColor =  addColorWithRatio(currentColor, quantError, finalFactor); // add a certain amount of quantization error

                    // console.log({ nx: updateCol, ny: updateRow, error: quantError, before: currentColor, after: updatedColor });

                    const quantErrorString = `lab(${quantError.l}, ${quantError.a}, ${quantError.b})`;
                    // console.log(`nx: ${updateCol}, ny: ${updateRow}, error: ${quantErrorString}, before: ${currentColor.toHex()}, after: ${updatedColor.toHex()}`);

                    dithered.set(updateRow, updateCol, updatedColor);
                }
            }

            debug?.(dithered);
        }
    }

    return dithered;
}

export const stuckiDitherMatrix: Matrix = matrix([
    [0, 0, 0, 8, 4],
    [2, 4, 8, 4, 2],
    [1, 2, 4, 2, 1],
]).map((v: number) => v / 42.0);

export const floydSteinbergDitherMatrix: Matrix = matrix([
    [0, 0, 7],
    [3, 5, 1],
]).map((v: number) => v / 16.0);