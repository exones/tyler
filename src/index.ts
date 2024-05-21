import { Colord, colord } from "colord";
import { isNil } from "lodash";
import { AnyColor, euclidianLabDistance, getColord, labQuantizationError as getLabQuantizationError, simpleFindClosestColor } from "./color";
import { draw as newCanvas } from "./drawing";
import { ditherWithErrorQuantization, stuckiDitherMatrix } from "./errorQuantizationDithering";
import { create2DHorizontalGradient } from "./gradient";
import { gradientTilingBuilder } from "./gradientTilingBuilder";
import { TileType, TilingModel, TilingOptions, WebImageTileImage as WebSampledImageTileImage, drawTiling, logTilesMatrix, printTilingStats, modelToTilesMatrix as tilesModelToMatrix } from "./tiles";

let root: HTMLDivElement | undefined = undefined;

const bigCrop = 500;
const tileTypes: TileType[] = [
    new TileType({
        name: "T",

        image: new WebSampledImageTileImage({
            dir: "turq-blue",
            samples: ["0.jpeg"],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop,
            },
            darken: 0.5,
        }),
    }),
    new TileType({
        name: "M",
        image: new WebSampledImageTileImage({
            dir: "marine-blue",
            samples: ["0.jpeg"],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop,
            },
            darken: 0.5,
        }),
    }),
    new TileType({
        name: "B",
        image: new WebSampledImageTileImage({
            dir: "light-blue",
            samples: ["0.jpeg"],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop,
            },
        }),
    }),
    new TileType({
        name: "G",
        image: new WebSampledImageTileImage({
            dir: "light-green",
            samples: ["0.jpeg"],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop,
            },
        }),
    }),
    new TileType({
        name: "O",
        image: new WebSampledImageTileImage({
            dir: "our-green",
            samples: ["0.jpeg"],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop,
            },
            darken: 1.2,
        }),
    }),
    new TileType({
        name: "D",
        image: new WebSampledImageTileImage({
            dir: "deep-green",
            samples: ["0.png"],
            crop: {
                left: 5,
                top: 5,
                right: 5,
                bottom: 5,
            },
        }),
    }),
    new TileType({
        name: "Y",
        image: new WebSampledImageTileImage({
            dir: "yellow",
            samples: ["0.jpeg"],
            crop: {
                left: 2,
                top: 2,
                right: 2,
                bottom: 2,
            },
        }),
    }),
];

const tileSizeInCm = 10;
const spacingInCm = 0.3;

const cmToPx = 5;

const tileSizeInPx = tileSizeInCm * cmToPx;
const spacingInPx = spacingInCm * cmToPx;

const tilingOptions: TilingOptions = {
    cols: 40,
    rows: 13,
    tileWidth: tileSizeInPx,
    tileHeight: tileSizeInPx,
    tileTypes,
    gradient: {
        stops: [
            {
                relativeX: 0.1,
                tileName: "T",
            },
            // {
            //     relativeX: 0.25,
            //     tileName: 'T'
            // },
            // {
            //     relativeX: 0.5,
            //     tileName: 'G'
            // },
            {
                relativeX: 0.5,
                tileName: "O",
            },
        ],
    },
};

window.addEventListener("resize", () => {
    if (isNil(root)) {
        return;
    }

    // make all canvases the same size as the root element using jQuery
    const width = root.clientWidth;

    const canvases = document.getElementsByTagName("canvas");

    for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        canvas.width = width;
    }
});

window.onload = async function () {
    root = document.getElementById("root") as HTMLDivElement;

    for (const tileType of tileTypes) {
        await tileType.image.prepare();

        console.log(`Prepared tile type ${tileType.name}: ${tileType.image.effectiveColor.toHex()}`);
    }

    if (isNil(root)) {
        console.error("Root element not found.");

        return;
    }

    await newCanvas(
        {
            off: true,
            height: 200,
        },
        async (ctx) => {
            const tileSizeInCm = 10;
            const spacingInCm = 0.2;

            const cmToPx = 5;

            const tileSizeInPx = tileSizeInCm * cmToPx;
            const spacingInPx = spacingInCm * cmToPx;

            const tilingOptions: TilingOptions = {
                rows: 7,
                cols: 80,
                tileWidth: tileSizeInPx,
                tileHeight: tileSizeInPx,
                tileTypes,
                gradient: {
                    stops: [
                        {
                            relativeX: 0.1,
                            tileName: "T",
                        },
                        // {
                        //     relativeX: 0.25,
                        //     tileName: 'T'
                        // },
                        // {
                        //     relativeX: 0.5,
                        //     tileName: 'G'
                        // },
                        {
                            relativeX: 0.5,
                            tileName: "O",
                        },
                    ],
                },
            };

            const model = gradientTilingBuilder(tilingOptions);
            const matrix = tilesModelToMatrix(model);

            logTilesMatrix(matrix);

            drawTiling(ctx, model, {
                spacing: spacingInPx,
                spacingColor: "darkgray",
                tileHeight: tileSizeInPx,
                tileWidth: tileSizeInPx,
            });
        },
    );

    const gradientEnd = tileTypes.find((x) => x.name === "O")!;
    const gradientStart = tileTypes.find((x) => x.name === "T")!;

    const height = tilingOptions.rows;
    const width = tilingOptions.cols;

    const hGradient = create2DHorizontalGradient(getColord(gradientStart), getColord(gradientEnd), height, width);

    const scale = 20;
    const scaleBorder: Colord | undefined = colord("#999999");
    // const palette = [  startColor, hGradient.getRow(0)[width /3], hGradient.getRow(0)[2*width /3], endColor ];
    const palette: AnyColor[] = tileTypes;

    // gradient
    await newCanvas(
        {
            height: 200,
        },
        async (ctx, opts) => {
            hGradient.scalePixelWithBorder(scale, scaleBorder).drawOn(ctx);
        },
    );

    // await newCanvas({}, async (ctx, opts) => {
    //     const dithered = ditherWithErrorQuantization(
    //         hGradient,
    //         [ startColor, colord({ r: 100, g: 100,  b: 255 }),  endColor ],
    //         stuckiDitherMatrix,
    //         simpleFindClosestColor(euclidianLabDistance),
    //         getLabQuantizationError
    //     );

    //     dithered.drawOn(ctx);
    // });

    const skipRows = 5;

    const tileModel: TilingModel = {
        options: {
            ...tilingOptions,
            rows: tilingOptions.rows - skipRows,
        },
        tiles: [],
    };

    await newCanvas(
        {
            height: 300,
        },
        async (ctx, opts) => {
            const dithered = ditherWithErrorQuantization(
                hGradient,
                palette,
                stuckiDitherMatrix,
                simpleFindClosestColor(euclidianLabDistance),
                getLabQuantizationError,
                (row, col, finalColor) => {
                    if (row < skipRows) {
                        return;
                    }

                    const tileType = finalColor as TileType;

                    const actualRow = row - skipRows;

                    tileModel.tiles.push({
                        coords: { row: actualRow, col },
                        name: tileType.name,
                    });
                },
                // (current) => {
                //     current.scalePixelWithBorder(scale, colord({r: 255, g: 0, b: 0})).drawOn(ctx, 0, top)

                //     top += height * scale + 10;
                // }
            );

            dithered.scalePixelWithBorder(scale, scaleBorder).drawOn(ctx);
        },
    );

    await newCanvas({ height: 600 }, async (ctx, opts) => {
        const matrix = tilesModelToMatrix(tileModel);
        logTilesMatrix(matrix);

        drawTiling(ctx, tileModel, {
            spacing: spacingInPx,
            spacingColor: "darkgray",
            tileHeight: tileSizeInPx,
            tileWidth: tileSizeInPx,
        });

        printTilingStats(tileModel);
    });

    // await newCanvas(
    //     {
    //         height: 300,
    //     },
    //     async (ctx, opts) => {
    //         let top = 0;

    //         const dithered = quantizationDither(
    //             applyGaussianNoise(hGradient, 0, 2),
    //             palette,
    //             simpleFindClosestColor(euclidianLabDistance),
    //             // (current) => {
    //             //     current.scalePixelWithBorder(scale, colord({r: 255, g: 0, b: 0})).drawOn(ctx, 0, top)

    //             //     top += height * scale + 10;
    //             // }
    //         );

    //         dithered.scalePixelWithBorder(scale, scaleBorder).drawOn(ctx);
    //     },
    // );

    // const hGradientWithNoise = applyGaussianNoise(hGradient, 0, 1);

    // await newCanvas({}, async (ctx, opts) => {
    //     hGradientWithNoise.scalePixelWithBorder(scale, scaleBorder).drawOn(ctx);
    // });

    // await newCanvas(
    //     {
    //         height: 300,
    //     },
    //     async (ctx, opts) => {
    //         let top = 0;

    //         const dithered = ditherWithErrorQuantization(
    //             hGradientWithNoise,
    //             palette,
    //             stuckiDitherMatrix,
    //             simpleFindClosestColor(euclidianLabDistance),
    //             getLabQuantizationError,
    //             // (current) => {
    //             //     current.scalePixelWithBorder(scale, colord({r: 255, g: 0, b: 0})).drawOn(ctx, 0, top)

    //             //     top += height * scale + 10;
    //             // }
    //         );

    //         dithered.scalePixelWithBorder(scale, scaleBorder).drawOn(ctx);
    //     },
    // );
};
