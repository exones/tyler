import { isNil } from "lodash";

export type Color = string;

export type PictureCrop = {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export type Picture = {
    dir: string;
    samples: string[];
    crop?: PictureCrop;
};

export type TileImage = Color | Picture;

export type TileName = string;

export type TileType = {
    name: TileName;
    image: TileImage;
};

export type TileWithCoords = TileType & {
    x: number;
    y: number;
};

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

export type TilingOptions = {
    rows: number;
    cols: number;

    tileWidth: number;
    tileHeight: number;

    tileTypes: TileType[];

    gradient: GradientOptions;
};

export type Tile = {
    name: string;
    x: number;
    y: number;
}

export type TilingModel = {
    options: TilingOptions;

    tiles: Tile[];
};

export type TilingBuilder = (options: TilingOptions) => TilingModel;

export type TilingDrawingOptions = {
    /**
     * Spacing in pixels.
     */
    spacing: number;
    spacingColor: Color;
}

/**
 * Tiles matrix type.
 */
export type TilesMatrix = (TileName | undefined)[][];

/**
 * Build a matrix of tiles from model.
 */

export function modelToTilesMatrix(model: TilingModel): TilesMatrix {
    const { options, tiles } = model;
    const { rows, cols } = options;

    const matrix: TilesMatrix = [];

    for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
        const tile = tiles[tileIndex];
        const { x, y } = tile;

        if (matrix[y] === undefined) {
            matrix[y] = [];
        }

        matrix[y][x] = tile.name;
    }

    return matrix;
}

export function tilesMatrixToModel(matrix: TilesMatrix, options: TilingOptions): TilingModel {
    const { rows, cols } = options;
    const tiles: Tile[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tileName = matrix[row][col];

            if (tileName !== undefined) {
                tiles.push({
                    name: tileName,
                    x: col,
                    y: row
                });
            }
        }
    }

    return {
        options,
        tiles
    };
}

/**
 * Draw a tiling on a canvas using a tiling model and drawing options. 
 */
export function drawTiling(ctx: CanvasRenderingContext2D, model: TilingModel, drawingOptions: TilingDrawingOptions): void {
    const { options } = model;
    const { rows, cols, tileWidth, tileHeight, tileTypes } = options;

    const matrix = modelToTilesMatrix(model);
    const tilesTypesByName = tileTypes.reduce((acc, tileType) => {
        acc[tileType.name] = tileType;

        return acc;
    }, {} as Record<string, TileType>);

    const { spacing, spacingColor } = drawingOptions;

    ctx.fillStyle = spacingColor;
    ctx.fillRect(0, 0, cols * (tileWidth + spacing) + spacing, rows * (tileHeight + spacing) + spacing);

    for (let row = 0; row < rows; row++) {        
        const top = spacing + row * (spacing + tileHeight);

        for (let col = 0; col < cols; col++) {
            const left = spacing + col * (spacing + tileWidth);
            const tileName = matrix[row][col];

            if (tileName === undefined) {
                ctx.fillStyle = spacingColor;                
                ctx.fillRect(left, top, tileWidth, tileHeight);
                continue;
            }

            const tileType = tilesTypesByName[tileName];

            if (isNil(tileType)) {
                throw new Error(`Tile type ${tileName} not found`);
            }

            if (typeof tileType.image === 'string') {
                const color = tileType.image;

                ctx.fillStyle = color;
                ctx.fillRect(left, top, tileWidth, tileHeight);

                continue;

            } else {
                const img = new Image();

                // apply crop if defined
                if (tileType.image.crop !== undefined) {
                    const { left: cropLeft, top: cropTop, right: cropRight, bottom: cropBottom } = tileType.image.crop;
                    
                    img.onload = function() {
                        // drop without crop
                        ctx.drawImage(img, left, top, tileWidth, tileHeight, left, top, tileWidth, tileHeight);

                        // draw with crop
                        ctx.drawImage(img, cropLeft, cropTop, img.width - cropLeft - cropRight, img.height - cropTop - cropBottom, left, top, tileWidth, tileHeight);
                    }
                }

                const dir = tileType.image.dir;
                const randomSampleIndex = Math.floor(Math.random() * tileType.image.samples.length);
                const randomSample = tileType.image.samples[randomSampleIndex];

                img.src = `/img/${dir}/${randomSample}`;
            }
        }
    }
}

export function logTilesMatrix(matrix: TilesMatrix): void {
    let rows = []
    for (let row = 0; row < matrix.length; row++) {        
        let cols = []
        for (let col = 0; col < matrix[row].length; col++) {
            cols.push(matrix[row][col]);
        }

        rows.push(cols.join(''));
    }

    const matrixStr = rows.join('\n');

    console.log(matrixStr);
}

