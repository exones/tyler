import {isNil} from 'lodash';
import { TilingOptions, drawTiling, modelToTilesMatrix as tilesModelToMatrix, logTilesMatrix } from './core';
import { gradientTilingBuilder } from "./gradientTilingBuilder";
import { singleTileTilingBuilder } from "./singleTileTilingBuilder";
import { randomTilingBuilder } from './randomTilingBuilder';

let canvas : HTMLCanvasElement | undefined

window.addEventListener('resize', () => {
    if (isNil(canvas)) {
        return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

window.onload = function() {
    var canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (isNil(canvas)) {
        console.error('Canvas not supported');
        
        return;
    }
    var ctx = canvas.getContext('2d');

    if (ctx === null) {
        console.error('2d context not supported');
        
        return;
    }
    
    const tileSizeInCm = 10;
    const spacingInCm = 0.2;

    const cmToPx = 5;

    const tileSizeInPx = tileSizeInCm * cmToPx;
    const spacingInPx = spacingInCm * cmToPx;

    const bigCrop = 80;

    const tilingOptions: TilingOptions =  {
        rows: 7,
        cols: 80,
        tileWidth: tileSizeInPx,
        tileHeight: tileSizeInPx,
        tileTypes: [
            {
                name: 'T',
                image: {
                    dir: 'turq-blue',
                    samples: ['0.jpeg'],
                    crop: {
                        left: bigCrop,
                        top: bigCrop,
                        right: bigCrop,
                        bottom: bigCrop
                    }
                }
            },
            {
                name: 'M',
                image: {
                    dir: 'marine-blue',
                    samples: ['0.jpeg'],
                    crop: {
                        left: 110,
                        top: 110,
                        right: 110,
                        bottom: 110
                    }
                }
            },
            {
                name: 'B',
                image: {
                    dir:  'light-blue',
                    samples: ['0.jpeg'],
                    crop: {
                        left: bigCrop,
                        top: bigCrop,
                        right: bigCrop,
                        bottom: bigCrop
                    }
                }
            },
            {
                name: 'G',
                image: {
                    dir:  'light-green',
                    samples: ['0.jpeg'],
                    crop: {
                        left: bigCrop,
                        top: bigCrop,
                        right: bigCrop,
                        bottom: bigCrop
                    }
                }
            },
            {
                name: 'O',
                image: {
                    dir:  'our-green',
                    samples: ['0.jpeg'],
                    crop: {
                        left: bigCrop,
                        top: bigCrop,
                        right: bigCrop,
                        bottom: bigCrop
                    }
                }
            },
            {
                name: 'D',
                image: {
                    dir:  'deep-green',
                    samples: ['0.png'],
                    crop: {
                        left: 5,
                        top: 5,
                        right:5,
                        bottom: 5
                    }
                }
            },
            {
                name: 'Y',
                image: {
                    dir:  'yellow',
                    samples: ['0.jpeg'],
                    crop: {
                        left: 2,
                        top: 2,
                        right: 2,
                        bottom: 2
                    }
                }
            }
        ],
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

    drawTiling(ctx, model, {spacing: spacingInPx, spacingColor: 'darkgray'});
  };


