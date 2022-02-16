import { interval, BehaviorSubject, Observable, fromEvent, of, combineLatestWith, lastValueFrom } from 'rxjs';
import { map, distinctUntilChanged, tap, filter, withLatestFrom, scan, mapTo } from 'rxjs/operators';
import { produce } from 'immer';
import R from 'ramda';

const canvasWidth = 480;
const canvasHeight = 480;

type Ctx2D = CanvasRenderingContext2D;
type Obs<T> = Observable<T>;
type Point = { x: number, y: number }
type ActionState = { speed: number, acc: number };
type EnemyPhase = '' | 'xxx';

type ReimuState = { pos: Point, jump: ActionState }
type EnemyState = { pos: Point, phase: EnemyPhase }

const ReimuInitPos: Point = { x: 100, y: 400 };

const reimuR = 16;
const enemyR = 16;

const generateEnemy = (
  clock$$: BehaviorSubject<number>,
  collision$$: BehaviorSubject<boolean>
) => {

  const image = new Image();
  image.src = './img/marisa.png';

  // 状態の更新処理
  const updateState = (c: EnemyState): EnemyState => {
    return produce(c, (draft) => {
      draft.phase = '';
      if (collision$$.getValue())
        return;
      draft.pos.x -= 5;
      if (draft.pos.x < -100) {
        draft.pos.x = 600;
        draft.phase = 'xxx';
      }
    });
  }

  // 描画処理関数
  const drawEnemy = (ctx: Ctx2D, p: Point) => {
    ctx.drawImage(image, p.x - image.width / 2, p.y - image.height / 2);
  };

  // 初期状態の生成
  const initState: EnemyState = { pos: { x: 600, y: 400 }, phase: '' };
  const state$$ = new BehaviorSubject<EnemyState>(initState);

  // クロック毎に状態を更新
  const equals: (a: EnemyState, b: EnemyState) => boolean = R.equals;
  clock$$.pipe(
    map(_ => updateState(state$$.getValue())),
    distinctUntilChanged(equals),
    // tap(console.log)
  ).subscribe(state$$);

  const drawable$ = state$$.pipe(map(p => (ctx: Ctx2D) => drawEnemy(ctx, p.pos)));

  return { state$$: state$$, drawable$: drawable$ };

}

const generateReimu = (
  clock$$: BehaviorSubject<number>,
  collision$$: BehaviorSubject<boolean>,
  keyInput$: Obs<string>
) => {

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
  const equals: (a: ReimuState, b: ReimuState) => boolean = R.equals;
  clock$$.pipe(
    map(_ => updateState(state$$.getValue())),
    distinctUntilChanged(equals),
    tap(console.log)
  ).subscribe(state$$);

  const drawable$ = state$$.pipe(map(p => (ctx: Ctx2D) => drawReimu(ctx, p.pos)));

  return { state$$: state$$, drawable$: drawable$ };

}

const init = (ctx: Ctx2D, bufferUpdate: (p: Ctx2D) => void) => {

  const keyInput$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(map(R.prop('code')));

  const clock$$ = new BehaviorSubject(0);
  interval(16).subscribe(clock$$);

  const score$$ = new BehaviorSubject<number>(0);
  const collision$$ = new BehaviorSubject<boolean>(false); // あたり判定
  const drawingObject$$ = new BehaviorSubject<Array<(ctx: Ctx2D) => void>>([]);

  const reimu = generateReimu(clock$$, collision$$, keyInput$);
  const enemy = generateEnemy(clock$$, collision$$);

  const drawableArr = [enemy.drawable$];
  reimu.drawable$.pipe(combineLatestWith(...drawableArr)).subscribe(drawingObject$$);

  reimu.state$$.pipe(map(p => p.pos))
    .pipe(combineLatestWith(enemy.state$$.pipe(map(p => p.pos))))
    .pipe(map(_ => {
      const diffX = reimu.state$$.getValue().pos.x - enemy.state$$.getValue().pos.x;
      const diffY = reimu.state$$.getValue().pos.y - enemy.state$$.getValue().pos.y;
      const distance = diffX ** 2 + diffY ** 2;
      return (distance < (reimuR + enemyR) ** 2);
    })).subscribe(collision$$) // 衝突

  enemy.state$$.pipe(
    map(p => p.phase),
    distinctUntilChanged(),
    filter(p => p == 'xxx'),
    mapTo(100),
    scan((acc, c) => acc + c, 0)
  ).subscribe(score$$);

  score$$.subscribe(console.log);

  clock$$.subscribe(_ => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawScore(ctx, score$$.getValue());
    drawingObject$$.getValue().forEach(draw => draw(ctx));
    bufferUpdate(ctx);
  });

};

const drawScore = (ctx: Ctx2D, score: number) => {
  ctx.fillStyle = 'white';
  ctx.font = '16pt Arial';
  const scoreLabel = `SCORE : ${score}`;
  const scoreLabelWidth = ctx.measureText(scoreLabel).width;
  ctx.fillText(scoreLabel, 460 - scoreLabelWidth, 40);
}

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
}


