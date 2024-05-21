import { Matrix, matrix } from "mathjs";
import { AnyColor, ColorMatrix, FindClosesColor, GetQuantizationError, UnsafeLabColor, addColorWithRatio, getColord } from "./color";

export type Debug = (currentImage: ColorMatrix) => void;
export type OnFinalColor = (row: number, col: number, finalColor: AnyColor) => void;

export function ditherWithErrorQuantization(
    sourceImage: ColorMatrix,
    palette: AnyColor[],
    ditherMatrix: Matrix,
    findClosestColor: FindClosesColor,
    getQuantizationError: GetQuantizationError,
    onFinalColor?: OnFinalColor,
    debug?: Debug,
): ColorMatrix {
    const { cols, rows } = sourceImage;
    const [dRows, dCols] = ditherMatrix.size();

    const dithered = sourceImage.clone();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const oldColor = dithered.get(row, col);
            const finalColor = findClosestColor(oldColor, palette);

            dithered.set(row, col, getColord(finalColor)); // TODO: here we know the final color: it will not change: so we can set it to the tile color
            onFinalColor?.(row, col, finalColor);

            const quantError: UnsafeLabColor = getQuantizationError(oldColor, finalColor); // usually oldColor - newColor

            // because the matrix starts from the middle of the first row
            const dColStart = dRows % 2 === 0 ? Math.floor(dRows / 2) - 1 : Math.floor(dRows / 2);
            const dRowStart = 0;

            // const noiseWidth = 1;

            // traversing dither matrix
            for (let dRow = 0; dRow < dRows; dRow++) {
                for (let dCol = 0; dCol < dCols; dCol++) {
                    // const noise = Math.random() * noiseWidth - noiseWidth / 2;
                    const noise = 0;
                    const errorTransferStrength = ditherMatrix.get([dRow, dCol]) as number;

                    const finalFactor = errorTransferStrength * (1 + noise);

                    const updateRow = row + dRow - dRowStart;
                    const updateCol = col + dCol - dColStart;

                    if (updateRow < 0 || updateRow >= rows || updateCol < 0 || updateCol >= cols) continue;
                    const currentColor = dithered.get(updateRow, updateCol); // current color

                    // Colord will clamp the values if they go outside of the allowed range
                    const updatedColor = addColorWithRatio(currentColor, quantError, finalFactor); // add a certain amount of quantization error

                    dithered.set(updateRow, updateCol, updatedColor);
                }
            }

            debug?.(dithered);
        }
    }

    return dithered;
}

export const floydSteinbergDitherMatrix: Matrix = matrix([
    [0, 0, 7],
    [3, 5, 1],
]).map((v: number) => v / 16.0);

export const stuckiDitherMatrix: Matrix = matrix([
    [0, 0, 0, 8, 4],
    [2, 4, 8, 4, 2],
    [1, 2, 4, 2, 1],
]).map((v: number) => v / 42.0);

export const atkinsonDitherMatrix: Matrix = matrix([
    [0, 0, 1, 1],
    [1, 1, 1, 0],
    [0, 1, 0, 0],
]).map((v: number) => v / 8.0);
