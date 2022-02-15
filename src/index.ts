import { interval, BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

const canvasWidth = 480;
const canvasHeight = 480;

type Ctx2D = CanvasRenderingContext2D;
type Obs<T> = Observable<T>;
type Point = { x: number, y: number }

const generateReimu = (p: Point, clock$$: BehaviorSubject<number>) => {

  const image = new Image();
  image.src = './img/reimu.png';

  const drawReimu = (ctx: Ctx2D, p: Point) => {
    ctx.drawImage(image, p.x - image.width / 2, p.y - image.height / 2);
  };

  const state$$ = new BehaviorSubject(p);

  clock$$.pipe(map(_ => ({ x: state$$.getValue().x + 2, y: state$$.getValue().y }))).subscribe(state$$);

  const drawable$ = state$$.pipe(map(p => (ctx: Ctx2D) => drawReimu(ctx, state$$.getValue())));

  return {
    drawable$: drawable$,
  };

}

const init = (ctx: Ctx2D, bufferUpdate: (p: Ctx2D) => void) => {

  const clock$$ = new BehaviorSubject(0);
  interval(16).subscribe(clock$$);

  const drawingObject$$ = new BehaviorSubject<Array<(ctx: Ctx2D) => void>>([]);

  const reimu = generateReimu({ x: 100, y: 400 }, clock$$);
  const drawable$ = reimu.drawable$;
  drawable$.pipe(map(p => [p])).subscribe(drawingObject$$);

  clock$$.subscribe(_ => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawingObject$$.getValue().forEach(draw => draw(ctx));
    bufferUpdate(ctx);
  });

};

onload = () => {

  console.log('onload() called.a');

  const buffercanvas = <HTMLCanvasElement>document.getElementById('buffercanvas');
  const bufferCtx = buffercanvas.getContext('2d');
  const canvas = <HTMLCanvasElement>document.getElementById('gamecanvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null || bufferCtx === null)
    return;

  const updateCtx = (buf: Ctx2D): void => {
    ctx.putImageData(buf.getImageData(0, 0, canvasWidth, canvasHeight), 0, 0);
  };

  init(ctx, updateCtx);

}
