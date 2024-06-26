import { Colord } from "colord";
import { ColorVector } from "./color";
import { ColorMatrix } from "./color";
import { TileName } from "./tiles";

export type GradientStop = {
    /**
     * Start of this gradient stop in relative coordinates (from 0 to 1).
     */
    relativeX: number; 

    /**
     * Tile type for this gradient stop.
     */
    tileName: TileName;
}

export type GradientOptions = {
    stops: GradientStop[];
}

export function create1DGradient(startColor: Colord, endColor: Colord, steps: number): ColorVector {
    const gradient: Colord[] = [];

    if (steps < 2) throw new Error("At least 2 steps are required for a gradient");

    // ensure we have end colors equal to start and end colors
    gradient.push(startColor);

    for (let step = 1; step < steps - 1; step++) {
        const ratio = step / steps;
        const color = startColor.mix(endColor, ratio); // mixed in LAB space

        gradient.push(color);
    }

    gradient.push(endColor);

    return gradient;
}

export function create1DMultiStopGradient(stops: { color: Colord, position: number }[], steps: number): ColorVector {
    const gradient: Colord[] = [];

    if (steps < 2) throw new Error("At least 2 steps are required for a gradient");

    // ensure we have end colors equal to start and end colors
    gradient.push(stops[0].color);

    for (let step = 1; step < steps - 1; step++) {
        const ratio = step / steps;
        const stopIndex = stops.findIndex(stop => stop.position >= ratio);

        const startStop = stops[stopIndex - 1];
        const endStop = stops[stopIndex];

        const color = startStop.color.mix(endStop.color, (ratio - startStop.position) / (endStop.position - startStop.position)); // mixed in LAB space

        gradient.push(color);
    }

    gradient.push(stops[stops.length - 1].color);

    return gradient;
}

export function to2DHorizontalGradient(oneDGradient: ColorVector, rows: number): ColorMatrix {
    const gradient: Colord[][] = [];

    for (let row = 0; row < rows; row++) {
        gradient.push([...oneDGradient]);
    }

    const colorMatrix = new ColorMatrix(rows, oneDGradient.length, gradient);

    return colorMatrix;
}

export function create2DHorizontalGradient(startColor: Colord, endColor: Colord, rows: number, cols: number): ColorMatrix {
    const oneDGradient = create1DGradient(startColor, endColor, cols);
    const colorMatrix = to2DHorizontalGradient(oneDGradient, rows);

    return colorMatrix;
}

