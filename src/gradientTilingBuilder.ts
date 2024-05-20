import { shuffle } from "lodash";
import { TilingOptions, TilingModel, Tile, TileType, GradientStop } from "./core";




export const gradientTilingBuilder = (options: TilingOptions): TilingModel => {
    const { rows, cols, tileTypes, gradient } = options;
    const tiles: Tile[] = [];

    const stops = gradient.stops;
    const tilesTypesByName = tileTypes.reduce((acc: Record<string, TileType>, tileType) => {
        acc[tileType.name] = tileType;

        return acc as Record<string, TileType>;
    }, {} as Record<string, TileType>);

    // we want to have a smooth of a gradient as possible given the discrete nature of the grid
    // so we will assign tiles to columns based on the relative position of the column in the grid
    // and the gradient stops.
    // for each column we will find the stop that covers the relative position of the column
    // and assign the tile type of that stop to the column.
    // In the column there should be some number of tiles from the previous stop and some number of tiles from the next stop.
    // The number of tiles from the previous and the next stop should be proportional to the relative position of the column
    // sort stops by relativeX
    stops.sort((a, b) => a.relativeX - b.relativeX);

    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    // complement with potentially missing start and end stops
    if (firstStop.relativeX > 0) {
        stops.unshift({
            relativeX: 0,
            tileName: firstStop.tileName
        });
    }

    if (lastStop.relativeX < 1) {
        stops.push({
            relativeX: 1,
            tileName: lastStop.tileName
        });
    }

    let prevStop: GradientStop = stops.shift()!;
    let currentStop: GradientStop = stops.shift()!;

    // Define the size of the window
    const windowWidth = 5;
    const windowHeight = rows;

    for (let col = 0; col < cols; col++) {
        const relativeX = col / cols; // relative position of the column


        // switching to the next stop if needed
        if (relativeX > currentStop.relativeX) {
            // move to the next stop
            prevStop = currentStop;
            const newCurrentStop = stops.shift();

            if (newCurrentStop === undefined) {
                throw new Error('Not enough stops');
            }

            currentStop = newCurrentStop!;
        }

        const stopWidth = currentStop.relativeX - prevStop.relativeX;

        const amountFromCurrentStop = (relativeX - prevStop.relativeX) / stopWidth;

        const numberOfNextStopTiles = Math.floor(amountFromCurrentStop * rows);
        const numberOfPrevStopTiles = options.rows - numberOfNextStopTiles;

        const tilesToShuffle = [];

        for (let i = 0; i < numberOfPrevStopTiles; i++) {
            tilesToShuffle.push(prevStop.tileName);
        }

        for (let i = 0; i < numberOfNextStopTiles; i++) {
            tilesToShuffle.push(currentStop.tileName);
        }

        const rowTiles = shuffle(tilesToShuffle);

        for (let row = 0; row < rows; row++) {
            tiles.push({
                name: rowTiles[row],
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
