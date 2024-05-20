import { isNil } from 'lodash';
import { TilingOptions, drawTiling, modelToTilesMatrix as tilesModelToMatrix, logTilesMatrix, TileName, TileType, WebImageTileImage as WebSampledImageTileImage } from './tiles';
import { gradientTilingBuilder } from "./gradientTilingBuilder";
import { draw as newCanvas } from './drawing';
import { create2DHorizontalGradient } from './gradient';
import { colord } from 'colord';
import { ditherWithErrorQuantization, floydSteinbergDitherMatrix, stuckiDitherMatrix } from './dithering';
import { euclidianLabDistance, labQuantizationError as getLabQuantizationError, simpleFindClosestColor } from './color';

let root: HTMLDivElement | undefined = undefined;

const bigCrop = 80;
const tileTypes : TileType[] =  [
    {
        name: 'T',

        image:  new WebSampledImageTileImage({
            dir: 'turq-blue',
            samples: ['0.jpeg'],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop
            }
        })
    },
    {
        name: 'M',
        image: new WebSampledImageTileImage({
            dir: 'marine-blue',
            samples: ['0.jpeg'],
            crop: {
                left: 110,
                top: 110,
                right: 110,
                bottom: 110
            }
        })
    },
    {
        name: 'B',
        image: new WebSampledImageTileImage({
            dir: 'light-blue',
            samples: ['0.jpeg'],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop
            }
        })
    },
    {
        name: 'G',
        image: new WebSampledImageTileImage({
            dir: 'light-green',
            samples: ['0.jpeg'],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop
            }
        })
    },
    {
        name: 'O',
        image: new WebSampledImageTileImage({
            dir: 'our-green',
            samples: ['0.jpeg'],
            crop: {
                left: bigCrop,
                top: bigCrop,
                right: bigCrop,
                bottom: bigCrop
            }
        })
    },
    {
        name: 'D',
        image: new WebSampledImageTileImage({
            dir: 'deep-green',
            samples: ['0.png'],
            crop: {
                left: 5,
                top: 5,
                right: 5,
                bottom: 5
            }
        })
    },
    {
        name: 'Y',
        image: new WebSampledImageTileImage({
            dir: 'yellow',
            samples: ['0.jpeg'],
            crop: {
                left: 2,
                top: 2,
                right: 2,
                bottom: 2
            }
        })
    }
];

window.addEventListener('resize', () => {
    if (isNil(root)) {
        return;
    }

    // make all canvases the same size as the root element using jQuery
    const width = root.clientWidth;

    const canvases = document.getElementsByTagName('canvas');

    for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        canvas.width = width;     
    }
});

window.onload = async function () {
    root = document.getElementById('root') as HTMLDivElement;

    if (isNil(root)) {
        console.error('Root element not found.');

        return;
    }

    await newCanvas({
        off: true,
        height: 200
    },async ctx => {
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
                        tileName: 'T'
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
                        tileName: 'O'
                    }
                ]
            }
        };

        const model = gradientTilingBuilder(tilingOptions);
        const matrix = tilesModelToMatrix(model);

        logTilesMatrix(matrix);

        drawTiling(ctx, model, { 
            spacing: spacingInPx,
            spacingColor: 'darkgray',
            tileHeight: tileSizeInPx,
            tileWidth: tileSizeInPx
        });
    })

    const startColor = colord({
        r: 0,
        g: 0,
        b: 0
    });

    const endColor = colord({
        r: 255,
        g: 255,
        b: 255
    });

    const height = 200;
    const width = 200;

    const hGradient = create2DHorizontalGradient(startColor, endColor, height, width);

    const scale = 1;

    // gradient
    await newCanvas({
        height: 200
    }, async (ctx, opts) => {
        hGradient.scalePixelWithBorder(scale, colord("red")).drawOn(ctx);
    });

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

    await newCanvas({
        height: 10000
    }, async (ctx, opts) => {
        
        let top = 0;
        
        const dithered = ditherWithErrorQuantization(
            hGradient,
            // [ startColor, endColor ],
            [ colord({r: 0, g: 0, b: 0}), colord({r: 255, g: 255, b: 255}) ],
            stuckiDitherMatrix,
            simpleFindClosestColor(euclidianLabDistance),
            getLabQuantizationError,
            // (current) => {
            //     current.scalePixelWithBorder(scale, colord({r: 255, g: 0, b: 0})).drawOn(ctx, 0, top)
            
            //     top += height * scale + 10;
            // }
        );

        dithered.scalePixelWithBorder(scale, colord({
            r: 255,
            g: 0,
            b: 0
        })) .drawOn(ctx);


    });
};