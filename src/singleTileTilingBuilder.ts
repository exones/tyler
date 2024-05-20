import { TilingBuilder, TilingModel, Tile } from "./core";


export const singleTileTilingBuilder: TilingBuilder = (options): TilingModel => {
    const { rows, cols, tileTypes } = options;
    const tiles: Tile[] = [];

    const firstTileType = tileTypes[0];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            tiles.push({
                name: firstTileType.name,
                x: col,
                y: row
            });
        }
    }

    return {
        options,
        tiles
    };
};


