import { interval, BehaviorSubject, Observable, fromEvent, of, } from 'rxjs';
import { map, distinctUntilChanged, tap, filter, withLatestFrom } from 'rxjs/operators';
import { produce } from 'immer';

const canvasWidth = 480;
const canvasHeight = 480;


type Ctx2D = CanvasRenderingContext2D;
type Obs<T> = Observable<T>;
type Point = { x: number, y: number }
type ActionState = { speed: number, acc: number };

type ReimuState = { pos: Point, jump: ActionState }

const ReimuInitPos: Point = { x: 100, y: 400 };

const generateReimu = (keyInput$: Obs<string>, clock$$: BehaviorSubject<number>) => {

  const image = new Image();
  image.src = './img/reimu.png';

  // 状態の更新処理
  const updateState = (c: ReimuState): ReimuState => {
    return produce(c, (draft) => {
      // ジャンプ
      const newSpeed = draft.jump.speed + draft.jump.acc;
      draft.jump.speed = newSpeed;
      draft.pos.y += newSpeed;
      if (draft.pos.y > ReimuInitPos.y) {
        draft.pos.y = ReimuInitPos.y;
        draft.jump.acc = 0;
        draft.jump.speed = 0;
      }
    });
  }

  // 描画処理関数
  const drawReimu = (ctx: Ctx2D, p: Point) => {
    ctx.drawImage(image, p.x - image.width / 2, p.y - image.height / 2);
  };

  // 初期状態の生成
  const initState = { pos: ReimuInitPos, jump: <ActionState>{ speed: 0, acc: 0 } };
  const state$$ = new BehaviorSubject<ReimuState>(initState);

  // キー入力イベントを受けて状態を更新
  keyInput$.pipe(
    withLatestFrom(state$$, (_, state) => state),
    filter(state => state.jump.speed == 0),
    map(state => produce(state, (draft) => {
      draft.jump.speed = -20;
      draft.jump.acc = 1.5;
    }))
  ).subscribe(state$$);

  // クロック毎に状態を更新
  clock$$.pipe(
    map(_ => updateState(state$$.getValue())),
    distinctUntilChanged(jsonComparator),
    tap(console.log)
  ).subscribe(state$$);

  const drawable$ = state$$.pipe(map(p => (ctx: Ctx2D) => drawReimu(ctx, p.pos)));

  return { drawable$: drawable$ };

}

const init = (ctx: Ctx2D, bufferUpdate: (p: Ctx2D) => void) => {

  const keyInput$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(map(e => e.code));

  const clock$$ = new BehaviorSubject(0);
  interval(16).subscribe(clock$$);

  const drawingObject$$ = new BehaviorSubject<Array<(ctx: Ctx2D) => void>>([]);

  const reimu = generateReimu(keyInput$, clock$$);
  const drawable$ = reimu.drawable$;
  drawable$.pipe(map(p => [p])).subscribe(drawingObject$$);

  clock$$.subscribe(_ => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawingObject$$.getValue().forEach(draw => draw(ctx));
    bufferUpdate(ctx);
  });

};

const jsonComparator = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

onload = () => {

  console.log('onload() called.');
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

  // of({ x: 2, y: 5 },
  //   { x: 2, y: 1 },
  //   { x: 2, y: 1 },
  //   { x: 2, y: 5 }).pipe(distinctUntilChanged(jsonComparator)).subscribe(console.log);

}
