import $ from 'jquery';


export type DrawAsync = (ctx: CanvasRenderingContext2D, opts: Required<DrawCanvasOptions>) => Promise<void>;

export type DrawCanvasOptions = {
    off?: boolean;
    height?: number;
};

export async function draw(options: DrawCanvasOptions, drawFunc: DrawAsync): Promise<void> {
    if (true === options.off ?? false) {
        return;
    }

    const effectiveOptions : Required<DrawCanvasOptions> = {
        off: options.off ?? false,
        height: options.height ?? 200,        
    };

    const body = $('body');

    const canvas = $('<canvas></canvas>')[0] as HTMLCanvasElement;

    if (options.height !== undefined) {
        canvas.height = options.height;
    }

    canvas.style.marginBottom = '10px';
    canvas.style.border = '1px solid black';
    canvas.width = body.width() ?? options.height ?? 200;

    const ctx = canvas.getContext('2d');

    if (ctx === null) {
        throw new Error('Could not get canvas context');
    }

    await drawFunc(ctx, effectiveOptions);

    $('body').append(canvas);
}