import { Colord } from "colord";
import { isNil } from "lodash";

export type Color = string;

export type PictureCrop = {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export type TilePictureRef = {
    dir: string;
    samples: string[];
    crop?: PictureCrop;
};


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

export class Rectangle {
    public readonly top: number;
    public readonly left: number;
    public readonly width: number;
    public readonly height: number;
    
    constructor(top: number, left: number, width: number, height: number) {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
    }
}



export type TileCoords = {
    row: number;
    col: number;
}

export type TileWithImage = {
    tile: Tile;
    image: TileImage;
}

export type Tile = {
    name: TileName;
    // image: TileImage;
    coords: TileCoords;
}

export abstract class TileImage {
    public draw(tile: Tile, ctx: CanvasRenderingContext2D, options: TilingDrawingOptions): void {
        const { spacing } = options;
        const { row, col } = tile.coords;

        const { tileWidth, tileHeight } = options;

        const left = spacing + col * (spacing + tileWidth);
        const top = spacing + row * (spacing + tileHeight);

        const rect : Rectangle = new Rectangle(top, left, tileWidth, tileHeight);
        
        this.drawCore(tile, ctx, rect, options);
    }

    public abstract drawCore(tile: Tile, ctx: CanvasRenderingContext2D, rect: Rectangle, options: TilingDrawingOptions): void;
}

export class SolidColorTileImage extends TileImage {
    public readonly color: Colord;

    constructor(color: Colord) {
        super();
        this.color = color;
    }

    public override drawCore(tile: Tile,  ctx: CanvasRenderingContext2D, rect: Rectangle, options: TilingDrawingOptions): void {
        const { color } = this;

        ctx.fillStyle = color.toHex();

        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
}


type WebImageTileImageOptions = {
    crop?: PictureCrop;
    dir: string;
    samples: string[];
}

export class WebImageTileImage extends TileImage {
    private readonly crop?: PictureCrop;
    private readonly dir: string;
    private readonly samples: string[];
    

    constructor(options: WebImageTileImageOptions) {
        super();
        this.crop = options.crop;
        this.dir = options.dir;
        this.samples = options.samples;
    }

    public drawCore(tile: Tile, ctx: CanvasRenderingContext2D, rect: Rectangle, options: TilingDrawingOptions): void {
        const img = new Image();

        const effectiveCrop = {
            left: this.crop?.left ?? 0,
            top: this.crop?.top ?? 0,
            right: this.crop?.right ?? 0,
            bottom: this.crop?.bottom ?? 0
        };
        
        // apply crop if defined
        const { left: cropLeft, top: cropTop, right: cropRight, bottom: cropBottom } = effectiveCrop;
        const { tileWidth, tileHeight } = options;
        const { col, row }  = tile.coords;
            
        img.onload = function() {
            // draw with crop
            ctx.drawImage(
                img, 
                cropLeft, cropTop, img.width - cropLeft - cropRight, img.height - cropTop - cropBottom,
                col, row, tileWidth, tileHeight);
        }
        

        const dir = this.dir;
        const randomSampleIndex = Math.floor(Math.random() * this.samples.length);
        const randomSample = this.samples[randomSampleIndex];

        img.src = `/img/${dir}/${randomSample}`;
    }
}

export type TilingModel = {
    tiles: Tile[];
    options: TilingOptions;
};

export type TilingBuilder = (options: TilingOptions) => TilingModel;

export type TilingDrawingOptions = {
    /**
     * Spacing in pixels.
     */
    spacing: number;
    spacingColor: Color;

    tileWidth: number;
    tileHeight: number;
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
        const { row: x, col: y } = tile.coords;

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

    const tilesTypesByName = options.tileTypes.reduce((acc, tileType) => {
        acc[tileType.name] = tileType;

        return acc;
    }, {} as Record<string, TileType>);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tileName = matrix[row][col];

            if (tileName === undefined) {
                throw new Error(`Tile at ${row}, ${col} is undefined`);
            }

            if (tileName !== undefined) {
                tiles.push({
                    name: tileName,
                    coords: {
                        row,
                        col
                    }
                
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

    // const matrix = modelToTilesMatrix(model);
    const tilesTypesByName = tileTypes.reduce((acc, tileType) => {
        acc[tileType.name] = tileType;

        return acc;
    }, {} as Record<string, TileType>);

    const { spacing, spacingColor } = drawingOptions;

    ctx.fillStyle = spacingColor;
    ctx.fillRect(0, 0, cols * (tileWidth + spacing) + spacing, rows * (tileHeight + spacing) + spacing);


    model.tiles.forEach(tile => {
        const tileType = tilesTypesByName[tile.name];

        if (tileType === undefined) {
            throw new Error(`Tile type ${tile.name} not found`);
        }

        tileType.image.draw(tile, ctx, drawingOptions);
    });
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

