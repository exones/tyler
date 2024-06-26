import { AnyColor, ColorMatrix, FindClosesColor, getColord } from "./color";
import { Debug } from "./errorQuantizationDithering";


export function quantizationDither(
    sourceImage: ColorMatrix,
    palette: AnyColor[],
    findClosestColor: FindClosesColor,
    debug?: Debug
): ColorMatrix {
    const { cols, rows } = sourceImage;

    const dithered = sourceImage.clone();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const oldColor = dithered.get(row, col);
            const newColor = findClosestColor(oldColor, palette);

            dithered.set(row, col, getColord(newColor));

            if (debug) debug(dithered);
        }
    }

    return dithered;
}
