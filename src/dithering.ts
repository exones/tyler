import { Colord } from "colord";
import { ColorDistance as GetColorDistance, ColorMatrix, FindClosesColor, GetQuantizationError } from "./color";
import { isNil } from "lodash";
import { Matrix } from "mathjs";

export function errorQuantizationDithering(
    image: ColorMatrix,
    palette: Colord[],
    ditherMatrix: Matrix,
    getColorDistance: GetColorDistance,
    findClosestColor: FindClosesColor,
    getQuantizationError: GetQuantizationError,
): ColorMatrix {
    const { cols, rows } = image;
    const [ dRows, dCols] = ditherMatrix.size()

    const dithered = ColorMatrix.empty(rows, cols);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const oldColor = image.get(y, x);
            const newColor = findClosestColor(oldColor, palette, getColorDistance);

            dithered.set(y, x, newColor);

            const quantError = getQuantizationError(oldColor, newColor); // usually oldColor - newColor

            for (let dy = 0; dy < dRows; dy++) {
                for (let dx = 0; dx < dCols; dx++) {
                    const ditherValue = ditherMatrix.get([dy, dx]) as number | undefined;
                    if (isNil(ditherValue) || ditherValue <= 0) continue;

                    const ny = y + dy;
                    const nx = x + dx;

                    if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;

                    const ditheredColor = dithered.get(ny, nx); // current color

                    // Colord will clamp the values if they go outside of the allowed range
                    const updatedDitheredColor = ditheredColor.mix(quantError, ditherValue); // add a certain amount of quantization error

                    dithered.set(ny, nx, updatedDitheredColor);
                }
            }
        }
    }

    return dithered;
}