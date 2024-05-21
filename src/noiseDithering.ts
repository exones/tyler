import { ColorMatrix, scaleColor } from "./color";

export function applyGaussianNoise(image: ColorMatrix, mean: number, variance: number): ColorMatrix {
    const noised = image.map((oldColor) => {
        const noise = Math.random() * variance + mean - variance / 2;

        const newColor = scaleColor(oldColor, 1 + noise);

        return newColor;
    });

    return noised;
}