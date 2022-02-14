import { interval, BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

type Ctx2D = CanvasRenderingContext2D;
type Obs<T> = Observable<T>;

const generateReimu = (x: number, y: number, clock$$: BehaviorSubject<number>) => {

  const image = new Image();
  image.src = './img/reimu.png';

  const drawReimu = (ctx: Ctx2D, x: number, y: number) => {
    ctx.drawImage(image, x - image.width / 2, y - image.height / 2);
  };

  const state$$ = new BehaviorSubject({ x: x, y: y });

  clock$$.pipe(map(_ => ({ x: state$$.getValue().x + 2, y: state$$.getValue().y }))).subscribe(state$$);

  const drawable$ = state$$.pipe(map(p => (ctx: Ctx2D) => drawReimu(ctx, state$$.getValue().x, state$$.getValue().y)));

  return {
    drawable$: drawable$,
  };

}

const init = () => {

  const canvas = <HTMLCanvasElement>document.getElementById('gamecanvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null)
    return;

  const clock$$ = new BehaviorSubject(0);
  interval(16).subscribe(clock$$);

  const drawingObject$$ = new BehaviorSubject<Array<(ctx: Ctx2D) => void>>([]);

  const reimu = generateReimu(101, 400, clock$$);
  const drawable$ = reimu.drawable$;
  drawable$.pipe(map(p => [p])).subscribe(drawingObject$$);

  clock$$.subscribe(_ => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawingObject$$.getValue().forEach(draw => draw(ctx));
  });

};

onload = () => {

  console.log('onload() called.a');
  // const test$ = interval(1000).pipe(map(p => p * 10));
  // test$.subscribe(console.log);
  init();

}
