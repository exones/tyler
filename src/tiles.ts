import { Colord } from "colord";
import { isNil } from "lodash";
import { ColorMatrix, IHaveColor } from "./color";
import { GradientOptions } from "./gradient";

export type Color = string;

export type PictureCrop = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

export type TilePictureRef = {
    dir: string;
    samples: string[];
    crop?: PictureCrop;
};

export type TileName = string;

export type TileTypeConstructorOptions = {
    name: TileName;
    image: TileImage;
};

export class TileType implements IHaveColor {
    public readonly name: TileName;
    public readonly image: TileImage;
    public get color(): Colord {
        return this.image.effectiveColor;
    }

    constructor(options: TileTypeConstructorOptions) {
        this.name = options.name;
        this.image = options.image;
    }

    public get effectiveColor(): Colord {
        return this.image.effectiveColor;
    }
}

export type TileWithCoords = TileType & {
    x: number;
    y: number;
};

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
};

export type TileWithImage = {
    tile: Tile;
    image: TileImage;
};

export type Tile = {
    name: TileName;
    // image: TileImage;
    coords: TileCoords;
};

export abstract class TileImage {
    public draw(tile: Tile, ctx: CanvasRenderingContext2D, options: TilingDrawingOptions): void {
        const { spacing } = options;
        const { row, col } = tile.coords;

        const { tileWidth, tileHeight } = options;

        const left = spacing + col * (spacing + tileWidth);
        const top = spacing + row * (spacing + tileHeight);

        const rect: Rectangle = new Rectangle(top, left, tileWidth, tileHeight);

        this.drawCore(tile, ctx, rect, options);
    }

    protected abstract drawCore(tile: Tile, ctx: CanvasRenderingContext2D, rect: Rectangle, options: TilingDrawingOptions): void;

    public abstract get effectiveColor(): Colord;

    public prepare(): Promise<void> {
        return Promise.resolve();
    }
}

export class SolidColorTileImage extends TileImage {
    public override get effectiveColor(): Colord {
        return this.color;
    }
    public readonly color: Colord;

    constructor(color: Colord) {
        super();
        this.color = color;
    }

    public override drawCore(_tile: Tile, ctx: CanvasRenderingContext2D, rect: Rectangle, options: TilingDrawingOptions): void {
        const { color } = this;

        ctx.fillStyle = color.toHex();

        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
}

type WebImageTileImageOptions = {
    crop?: PictureCrop;
    dir: string;
    samples: string[];
    darken?: number;
};

export class WebImageTileImage extends TileImage {
    public get effectiveColor(): Colord {
        if (isNil(this.color)) {
            throw new Error("Color is not defined");
        }

        return this.color;
    }
    private readonly crop?: PictureCrop;
    private readonly dir: string;
    private readonly samples: string[];
    private readonly darken?: number;

    private colorMatrix: ColorMatrix | undefined;
    public color: Colord | undefined;

    private getImageData(url: string): Promise<ImageData> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;

            const canvas = document.createElement("canvas");

            try {
                const ctx = canvas.getContext("2d");

                if (ctx === null) {
                    throw new Error("Canvas context is null");
                }

                img.onload = function () {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    console.log(`Image loaded: ${img.width}x${img.height}`);
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, img.width, img.height);

                    resolve(imageData);
                };

                img.onerror = function () {
                    reject(new Error("Image loading failed"));
                };
            } finally {
                canvas.remove();
            }
        });
    }

    public override async prepare(): Promise<void> {
        // get image with fetch and form ColorMatrix from ImageData
        const dir = this.dir;
        const randomSampleIndex = Math.floor(Math.random() * this.samples.length);
        const randomSample = this.samples[randomSampleIndex];

        const imgUrl = `/img/${dir}/${randomSample}`;
        const imageData = await this.getImageData(imgUrl);

        this.colorMatrix = ColorMatrix.fromImageData(imageData);
        this.color = this.colorMatrix.getAverageColor();

        if (this.darken) {
            this.color = this.color.darken(this.darken);
        }
    }

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
            bottom: this.crop?.bottom ?? 0,
        };

        // const zeroCrop = {
        //     left: 0,
        //     top: 0,
        //     right: 0,
        //     bottom: 0,
        // };

        // const effectiveCrop = zeroCrop;

        // apply crop if defined
        const { left: cropLeft, top: cropTop, right: cropRight, bottom: cropBottom } = effectiveCrop;
        const { tileWidth, tileHeight } = options;
        const { col, row } = tile.coords;

        const [x, y] = [col * (tileWidth + options.spacing), row * (tileHeight + options.spacing)];

        img.onload = function () {
            // draw with crop
            ctx.drawImage(img, cropLeft, cropTop, img.width - cropLeft - cropRight, img.height - cropTop - cropBottom, x, y, tileWidth, tileHeight);
        };

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
};

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
                        col,
                    },
                });
            }
        }
    }

    return {
        options,
        tiles,
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

    model.tiles.forEach((tile) => {
        const tileType = tilesTypesByName[tile.name];

        if (tileType === undefined) {
            throw new Error(`Tile type ${tile.name} not found`);
        }

        tileType.image.draw(tile, ctx, drawingOptions);
    });
}

export function logTilesMatrix(matrix: TilesMatrix): void {
    let rows = [];
    for (let row = 0; row < matrix.length; row++) {
        let cols = [];
        for (let col = 0; col < matrix[row].length; col++) {
            cols.push(matrix[row][col]);
        }

        rows.push(cols.join(""));
    }

    const matrixStr = rows.join("\n");

    console.log(matrixStr);
}

export function printTilingStats(tilingModel: TilingModel) {
    // tiles count by type

    const tilesByType = tilingModel.tiles.reduce((acc, tile) => {
        if (acc[tile.name] === undefined) {
            acc[tile.name] = 0;
        }

        acc[tile.name]++;

        return acc;
    }, {} as Record<string, number>);

    console.log("Tiles count by type:");

    for (const tileName in tilesByType) {
        const tilesCount = tilesByType[tileName];
        const boxesCount = Math.ceil(tilesCount / 54);
        console.log(`${tileName}: ${tilesCount} ( ${boxesCount} boxes)`);
    }
}
