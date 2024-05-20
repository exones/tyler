import { TilingBuilder, TilingModel, Tile } from "./tiles";


export const randomTilingBuilder: TilingBuilder = (options): TilingModel => {
    const { rows, cols, tileTypes } = options;
    const tiles: Tile[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];

            tiles.push({
                name: tileType.name,
                coords: { col, row }
            });
        }
    }

    return {
        options,
        tiles
    };
};

